// =====================================
// 1. CONEXÃO COM SUPABASE
// =====================================

const SUPABASE_URL = "https://rtbydpwxqxphbhldakow.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ov7MgF4hpesErWClI5iLlQ_n6lI3jdP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================
// 2. FUNÇÕES AUXILIARES
// =====================================

function escaparTexto(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

async function obterBarbearia() {
    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        throw new Error("Faça login novamente.");
    }

    const { data: barbearia, error } = await supabaseClient
        .from("barbershops")
        .select("id")
        .eq("owner_id", userData.user.id)
        .single();

    if (error) throw error;

    return barbearia;
}


// =====================================
// 3. NAVEGAÇÃO DO MENU
// =====================================

const menuItems = document.querySelectorAll(".menu-item");
const sections = document.querySelectorAll(".main-content > section");

const verTodosAgendamentos =
    document.getElementById("verTodosAgendamentos");

if (verTodosAgendamentos) {
    verTodosAgendamentos.addEventListener("click", function(event) {
        event.preventDefault();

        const menuAgendamentos = document.querySelector(
            '.menu-item[href="#agendamentos"]'
        );

        if (menuAgendamentos) menuAgendamentos.click();
    });
}

menuItems.forEach(item => {
    item.addEventListener("click", function(event) {
        event.preventDefault();

        const targetId = this.getAttribute("href").replace("#", "");

        sections.forEach(section => {
            section.classList.add("future-section");
        });

        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.classList.remove("future-section");
        }

        menuItems.forEach(menu => menu.classList.remove("active"));

        this.classList.add("active");

        const tituloPagina = document.getElementById("tituloPagina");
        const subtituloPagina = document.getElementById("subtituloPagina");

        const paginas = {
            inicio: {
                titulo: "Dashboard",
                subtitulo: "Bem-vindo ao painel de gerenciamento."
            },
            agendamentos: {
                titulo: "Agendamentos",
                subtitulo: "Gerencie os horários e atendimentos."
            },
            clientes: {
                titulo: "Clientes",
                subtitulo: "Gerencie seus clientes e histórico de atendimentos."
            },
            funcionarios: {
                titulo: "Funcionários",
                subtitulo: "Gerencie sua equipe de profissionais."
            },
            financeiro: {
                titulo: "Financeiro",
                subtitulo: "Acompanhe receitas, despesas e faturamento."
            },
            configuracoes: {
                titulo: "Configurações",
                subtitulo: "Gerencie os dados e as preferências da sua barbearia."
            }
        };

        if (paginas[targetId]) {
            if (tituloPagina) {
                tituloPagina.textContent = paginas[targetId].titulo;
            }

            if (subtituloPagina) {
                subtituloPagina.textContent = paginas[targetId].subtitulo;
            }
        }
    });
});


// =====================================
// 4. MODAL DE AGENDAMENTO
// =====================================

const modalAgendamento = document.getElementById("modalAgendamento");
const botaoNovoAgendamento = document.getElementById("novoAgendamento");
const fecharModal = document.getElementById("fecharModal");
const cancelarAgendamento = document.getElementById("cancelarAgendamento");

if (botaoNovoAgendamento && modalAgendamento) {
    botaoNovoAgendamento.addEventListener("click", function() {
        modalAgendamento.classList.remove("hidden");
        carregarClientesNoAgendamento();
    });
}

if (fecharModal && modalAgendamento) {
    fecharModal.addEventListener("click", function() {
        modalAgendamento.classList.add("hidden");
    });
}

if (cancelarAgendamento && modalAgendamento) {
    cancelarAgendamento.addEventListener("click", function() {
        modalAgendamento.classList.add("hidden");
    });
}

if (modalAgendamento) {
    modalAgendamento.addEventListener("click", function(event) {
        if (event.target === modalAgendamento) {
            modalAgendamento.classList.add("hidden");
        }
    });
}


// =====================================
// 5. CARREGAR AGENDAMENTOS
// =====================================

async function carregarAgendamentos() {
    const lista = document.getElementById("listaAgendamentos");

    if (!lista) return;

    try {
        const barbearia = await obterBarbearia();

        const campoData = document.getElementById("dataAgenda");
        const dataSelecionada = campoData ? campoData.value : "";

        let consulta = supabaseClient
            .from("appointments")
            .select("*")
            .eq("barbershop_id", barbearia.id)
            .order("appointment_time", { ascending: false });

        if (dataSelecionada) {
            consulta = consulta.eq("appointment_date", dataSelecionada);
        }

        const { data: agendamentos, error } = await consulta;

        if (error) throw error;

        const registros = agendamentos || [];

        const agendamentosVisiveis = registros.filter(
            a => a.status !== "Cancelado"
        );

        const totalAgendamentos = document.getElementById("totalAgendamentos");
        const totalConfirmados = document.getElementById("totalConfirmados");
        const totalConcluidos = document.getElementById("totalConcluidos");

        if (totalAgendamentos) {
            totalAgendamentos.textContent = agendamentosVisiveis.length;
        }

        if (totalConfirmados) {
            totalConfirmados.textContent =
                registros.filter(a => a.status === "Confirmado").length;
        }

        if (totalConcluidos) {
            totalConcluidos.textContent =
                registros.filter(a => a.status === "Concluído").length;
        }

        if (agendamentosVisiveis.length === 0) {
            lista.className = "empty-state";
            lista.innerHTML = `
                <div>▣</div>
                <strong>Nenhum agendamento encontrado</strong>
                <p>Não existem atendimentos para esta data.</p>
            `;
            return;
        }

        lista.className = "appointment-items";

        lista.innerHTML = agendamentosVisiveis.map(a => {
            const data = a.appointment_date.split("-").reverse().join("/");
            const horario = a.appointment_time.slice(0, 5);

            return `
                <div class="appointment-item">
                    <div class="appointment-time">${horario}</div>

                    <div class="appointment-info">
                        <strong>${escaparTexto(a.client_name)}</strong>
                        <span>${escaparTexto(a.service)} • ${escaparTexto(a.barber_name)}</span>
                    </div>

                    <div class="appointment-value">
                        R$ ${Number(a.price).toFixed(2).replace(".", ",")}
                    </div>

                    <span class="appointment-status ${
                        a.status === "Confirmado" ? "status-pendente" :
                        a.status === "Concluído" ? "status-concluido" :
                        a.status === "Cancelado" ? "status-cancelado" : ""
                    }">
                        ${a.status === "Confirmado" ? "Pendente" : escaparTexto(a.status)}
                    </span>

                    <div class="appointment-date">${data}</div>

                    <div class="appointment-actions">
                        ${a.status === "Confirmado" ? `
                            <button class="btn-concluir" data-action="concluir" data-id="${a.id}">
                                Concluir
                            </button>

                            <button class="btn-cancelar" data-action="cancelar" data-id="${a.id}">
                                Cancelar
                            </button>
                        ` : ""}

                        ${a.status === "Concluído" ? `
                            <button class="btn-reverter" data-action="reverter" data-id="${a.id}">
                                Reverter conclusão
                            </button>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        lista.innerHTML = "<p>Erro ao carregar agendamentos.</p>";
    }
}


// =====================================
// 6. SALVAR AGENDAMENTOS
// =====================================

const formAgendamento = document.getElementById("formAgendamento");

if (formAgendamento) {
    formAgendamento.addEventListener("submit", async function(event) {
        event.preventDefault();

        try {
            const barbearia = await obterBarbearia();

            const selectCliente = document.getElementById("nomeCliente");

            if (!selectCliente || !selectCliente.value) {
                throw new Error("Selecione um cliente.");
            }

            const agendamento = {
                barbershop_id: barbearia.id,
                client_id: selectCliente.value,
                client_name: selectCliente.selectedOptions[0].textContent,
                barber_name: document.getElementById("nomeBarbeiro").value.trim(),
                service: document.getElementById("servico").value,
                price: Number(document.getElementById("valorServico").value),
                appointment_date: document.getElementById("dataAtendimento").value,
                appointment_time: document.getElementById("horarioAtendimento").value
            };

            const { error } = await supabaseClient
                .from("appointments")
                .insert([agendamento]);

            if (error) throw error;

            alert("Agendamento salvo com sucesso!");

            formAgendamento.reset();

            if (modalAgendamento) {
                modalAgendamento.classList.add("hidden");
            }

            const busca = document.getElementById("buscarClienteAgendamento");

            if (busca) busca.value = "";

            if (sugestoesClientes) {
                sugestoesClientes.style.display = "none";
            }

            await carregarAgendamentos();
            await atualizarDashboard();

        } catch (error) {
            alert("Erro ao salvar agendamento: " + error.message);
        }
    });
}


// =====================================
// 7. FILTRO DE DATA DOS AGENDAMENTOS
// =====================================

const dataAgenda = document.getElementById("dataAgenda");

if (dataAgenda) {
    dataAgenda.addEventListener("change", carregarAgendamentos);
}


// =====================================
// 8. CONCLUIR, CANCELAR OU REVERTER
// =====================================

const listaAgendamentos = document.getElementById("listaAgendamentos");

if (listaAgendamentos) {
    listaAgendamentos.addEventListener("click", async function(event) {
        const botao = event.target.closest("button[data-action]");

        if (!botao) return;

        const id = botao.dataset.id;
        const acao = botao.dataset.action;

        let novoStatus;
        let mensagem;

        if (acao === "concluir") {
            novoStatus = "Concluído";
            mensagem = "concluir este agendamento?";
        } else if (acao === "cancelar") {
            novoStatus = "Cancelado";
            mensagem = "cancelar este agendamento?";
        } else if (acao === "reverter") {
            novoStatus = "Confirmado";
            mensagem = "reverter a conclusão deste agendamento?";
        } else {
            return;
        }

        if (!confirm("Deseja realmente " + mensagem)) return;

        try {
            const barbearia = await obterBarbearia();

            const { data: agendamento, error: erroBusca } =
                await supabaseClient
                    .from("appointments")
                    .select("*")
                    .eq("id", id)
                    .eq("barbershop_id", barbearia.id)
                    .single();

            if (erroBusca) throw erroBusca;

            if (acao === "concluir") {
                const valor = Number(agendamento.price);

                if (!Number.isFinite(valor) || valor <= 0) {
                    throw new Error("O valor do agendamento é inválido.");
                }

                const { error: erroStatus } = await supabaseClient
                    .from("appointments")
                    .update({ status: novoStatus })
                    .eq("id", id)
                    .eq("barbershop_id", barbearia.id);

                if (erroStatus) throw erroStatus;

                try {
                    const { data: receitaExistente, error: erroConsulta } =
                        await supabaseClient
                            .from("financial_transactions")
                            .select("id")
                            .eq("appointment_id", id)
                            .eq("source", "agendamento")
                            .maybeSingle();

                    if (erroConsulta) throw erroConsulta;

                    if (!receitaExistente) {
                        const { error: erroReceita } = await supabaseClient
                            .from("financial_transactions")
                            .insert([{
                                barbershop_id: barbearia.id,
                                appointment_id: id,
                                type: "receita",
                                source: "agendamento",
                                description:
                                    "Serviço: " + agendamento.service +
                                    " - Cliente: " + agendamento.client_name,
                                amount: valor
                            }]);

                        if (erroReceita) throw erroReceita;
                    }

                } catch (erroFinanceiro) {
                    await supabaseClient
                        .from("appointments")
                        .update({ status: "Confirmado" })
                        .eq("id", id)
                        .eq("barbershop_id", barbearia.id);

                    throw erroFinanceiro;
                }

                alert("Agendamento concluído e receita registrada!");
            }

            else if (acao === "reverter") {
                const { error: erroStatus } = await supabaseClient
                    .from("appointments")
                    .update({ status: novoStatus })
                    .eq("id", id)
                    .eq("barbershop_id", barbearia.id);

                if (erroStatus) throw erroStatus;

                const { error: erroReceita } = await supabaseClient
                    .from("financial_transactions")
                    .delete()
                    .eq("appointment_id", id)
                    .eq("barbershop_id", barbearia.id)
                    .eq("source", "agendamento");

                if (erroReceita) {
                    await supabaseClient
                        .from("appointments")
                        .update({ status: "Concluído" })
                        .eq("id", id)
                        .eq("barbershop_id", barbearia.id);

                    throw erroReceita;
                }

                alert("Conclusão revertida e receita automática removida!");
            }

            else if (acao === "cancelar") {
                const { error } = await supabaseClient
                    .from("appointments")
                    .update({ status: novoStatus })
                    .eq("id", id)
                    .eq("barbershop_id", barbearia.id);

                if (error) throw error;

                alert("Agendamento cancelado!");
            }

            await carregarAgendamentos();
            await atualizarDashboard();
            await atualizarFinanceiro();

        } catch (error) {
            alert("Erro ao atualizar agendamento: " + error.message);
        }
    });
}


// =====================================
// 9. MODAL DE CLIENTES
// =====================================

const modalCliente = document.getElementById("modalCliente");
const novoCliente = document.getElementById("novoCliente");
const fecharModalCliente = document.getElementById("fecharModalCliente");
const cancelarModalCliente = document.getElementById("cancelarModalCliente");
const formCliente = document.getElementById("formCliente");

let clienteEditandoId = null;

function prepararNovoCliente() {
    clienteEditandoId = null;

    if (formCliente) formCliente.reset();

    const titulo = document.getElementById("tituloModalCliente");
    const descricao = document.getElementById("descricaoModalCliente");
    const botaoSalvar = document.getElementById("botaoSalvarCliente");
    const botaoExcluir = document.getElementById("excluirCliente");

    if (titulo) titulo.textContent = "Novo cliente";

    if (descricao) {
        descricao.textContent = "Cadastre um novo cliente na sua barbearia.";
    }

    if (botaoSalvar) botaoSalvar.textContent = "Salvar cliente";

    if (botaoExcluir) botaoExcluir.style.display = "none";
}

if (novoCliente && modalCliente) {
    novoCliente.addEventListener("click", function() {
        prepararNovoCliente();
        modalCliente.classList.remove("hidden");
    });
}

if (fecharModalCliente && modalCliente) {
    fecharModalCliente.addEventListener("click", function() {
        modalCliente.classList.add("hidden");
    });
}

if (cancelarModalCliente && modalCliente) {
    cancelarModalCliente.addEventListener("click", function() {
        modalCliente.classList.add("hidden");
    });
}

if (modalCliente) {
    modalCliente.addEventListener("click", function(event) {
        if (event.target === modalCliente) {
            modalCliente.classList.add("hidden");
        }
    });
}


// =====================================
// 10. SALVAR E EDITAR CLIENTES
// =====================================

if (formCliente) {
    formCliente.addEventListener("submit", async function(event) {
        event.preventDefault();

        try {
            const barbearia = await obterBarbearia();

            const cliente = {
                name: document.getElementById("clienteNome").value.trim(),
                phone: document.getElementById("clienteTelefone").value.trim(),
                email: document.getElementById("clienteEmail").value.trim() || null
            };

            if (clienteEditandoId) {
                const { error } = await supabaseClient
                    .from("clients")
                    .update(cliente)
                    .eq("id", clienteEditandoId)
                    .eq("barbershop_id", barbearia.id);

                if (error) throw error;

                alert("Cliente atualizado com sucesso!");

            } else {
                const { error } = await supabaseClient
                    .from("clients")
                    .insert([{
                        ...cliente,
                        barbershop_id: barbearia.id
                    }]);

                if (error) throw error;

                alert("Cliente cadastrado com sucesso!");
            }

            clienteEditandoId = null;

            formCliente.reset();

            if (modalCliente) {
                modalCliente.classList.add("hidden");
            }

            prepararNovoCliente();

            await carregarClientes();
            await carregarClientesNoAgendamento();
            await atualizarDashboard();

        } catch (error) {
            alert("Erro ao salvar cliente: " + error.message);
        }
    });
}


// =====================================
// 11. CARREGAR CLIENTES
// =====================================

async function carregarClientes() {
    const lista = document.getElementById("listaClientes");

    if (!lista) return;

    try {
        const barbearia = await obterBarbearia();

        const { data: clientes, error } = await supabaseClient
            .from("clients")
            .select("*")
            .eq("barbershop_id", barbearia.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const registros = clientes || [];

        const totalClientes = document.getElementById("totalClientes");
        const totalClientesDashboard =
            document.getElementById("totalClientesDashboard");

        if (totalClientes) {
            totalClientes.textContent = registros.length;
        }

        if (totalClientesDashboard) {
            totalClientesDashboard.textContent = registros.length;
        }

        const clientesCadastrados =
            document.getElementById("clientesCadastrados");

        if (clientesCadastrados) {
            clientesCadastrados.textContent = registros.length;
        }

        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const recentes = registros.filter(cliente =>
            new Date(cliente.created_at) >= trintaDiasAtras
        );

        const clientesRecentes =
            document.getElementById("clientesRecentes");

        if (clientesRecentes) {
            clientesRecentes.textContent = recentes.length;
        }

        if (registros.length === 0) {
            lista.className = "empty-state";
            lista.innerHTML = `
                <div>♙</div>
                <strong>Nenhum cliente cadastrado</strong>
                <p>Os clientes aparecerão aqui.</p>
            `;
            return;
        }

        lista.className = "client-list";

        lista.innerHTML = registros.map(cliente => {
            const inicial = escaparTexto(
                cliente.name.charAt(0).toUpperCase()
            );

            return `
                <div class="client-item">
                    <div class="client-avatar">${inicial}</div>

                    <div class="client-info">
                        <strong>${escaparTexto(cliente.name)}</strong>
                        <span>${escaparTexto(cliente.phone || "Sem telefone")}</span>
                    </div>

                    <div class="client-email">
                        ${escaparTexto(cliente.email || "Sem e-mail")}
                    </div>

                    <button
                        type="button"
                        class="gold-button"
                        onclick="verHistoricoCliente('${cliente.id}')">
                        Ver histórico
                    </button>

                    <button
                        type="button"
                        class="btn-editar-cliente"
                        data-id="${cliente.id}"
                        title="Editar cliente">
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="btn-apagar-cliente"
                        data-id="${cliente.id}"
                        title="Excluir cliente">
                        🗑️
                    </button>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        lista.textContent = "Erro ao carregar clientes: " + error.message;
    }
}


// =====================================
// 12. AÇÕES DOS CLIENTES
// =====================================

const listaClientesAcoes = document.getElementById("listaClientes");

if (listaClientesAcoes) {
    listaClientesAcoes.addEventListener("click", async function(event) {
        const botaoEditar = event.target.closest(".btn-editar-cliente");
        const botaoApagar = event.target.closest(".btn-apagar-cliente");

        if (!botaoEditar && !botaoApagar) return;

        const botao = botaoEditar || botaoApagar;
        const clienteId = botao.dataset.id;

        if (botaoApagar) {
            const confirmar = await confirmarExclusao(
                "Excluir cliente",
                "Tem certeza que deseja excluir este cliente?"
            );

            if (!confirmar) return;

            try {
                const barbearia = await obterBarbearia();

                const { error } = await supabaseClient
                    .from("clients")
                    .delete()
                    .eq("id", clienteId)
                    .eq("barbershop_id", barbearia.id);

                if (error) throw error;

                alert("Cliente excluído com sucesso!");

                await carregarClientes();
                await carregarClientesNoAgendamento();
                await atualizarDashboard();

            } catch (error) {
                alert("Erro ao excluir cliente: " + error.message);
            }

            return;
        }

        if (botaoEditar) {
            clienteEditandoId = clienteId;

            document.getElementById("tituloModalCliente").textContent =
                "Editar cliente";

            document.getElementById("descricaoModalCliente").textContent =
                "Carregando informações...";

            document.getElementById("clienteNome").value = "";
            document.getElementById("clienteTelefone").value = "";
            document.getElementById("clienteEmail").value = "";

            document.getElementById("botaoSalvarCliente").textContent =
                "Salvar alterações";

            document.getElementById("excluirCliente").style.display =
                "none";

            modalCliente.classList.remove("hidden");

            try {
                const barbearia = await obterBarbearia();

                const { data: cliente, error } = await supabaseClient
                    .from("clients")
                    .select("*")
                    .eq("id", clienteId)
                    .eq("barbershop_id", barbearia.id)
                    .single();

                if (error) throw error;

                if (
                    modalCliente.classList.contains("hidden") ||
                    clienteEditandoId !== clienteId
                ) return;

                document.getElementById("descricaoModalCliente").textContent =
                    "Altere as informações do cliente.";

                document.getElementById("clienteNome").value =
                    cliente.name || "";

                document.getElementById("clienteTelefone").value =
                    cliente.phone || "";

                document.getElementById("clienteEmail").value =
                    cliente.email || "";

            } catch (error) {
                alert("Erro ao abrir edição: " + error.message);
                modalCliente.classList.add("hidden");
            }
        }
    });
}


// =====================================
// 13. EXCLUIR CLIENTE
// =====================================

const botaoExcluirCliente = document.getElementById("excluirCliente");

if (botaoExcluirCliente) {
    botaoExcluirCliente.addEventListener("click", async function() {
        if (!clienteEditandoId) return;

        const confirmar = await confirmarExclusao(
            "Excluir cliente",
            "Tem certeza que deseja excluir este cliente?"
        );

        if (!confirmar) return;

        try {
            const barbearia = await obterBarbearia();

            const { error } = await supabaseClient
                .from("clients")
                .delete()
                .eq("id", clienteEditandoId)
                .eq("barbershop_id", barbearia.id);

            if (error) throw error;

            alert("Cliente excluído com sucesso!");

            clienteEditandoId = null;

            modalCliente.classList.add("hidden");

            prepararNovoCliente();

            await carregarClientes();
            await carregarClientesNoAgendamento();
            await atualizarDashboard();

        } catch (error) {
            alert("Erro ao excluir cliente: " + error.message);
        }
    });
}


// =====================================
// 14. PESQUISAR CLIENTES
// =====================================

const buscarCliente = document.getElementById("buscarCliente");

if (buscarCliente) {
    buscarCliente.addEventListener("input", function() {
        const pesquisa = this.value.toLowerCase();

        document.querySelectorAll(".client-item").forEach(item => {
            item.style.display =
                item.textContent.toLowerCase().includes(pesquisa)
                    ? "flex"
                    : "none";
        });
    });
}


// =====================================
// 15. CARREGAR CLIENTES NO AGENDAMENTO
// =====================================

async function carregarClientesNoAgendamento() {
    const selectCliente = document.getElementById("nomeCliente");

    if (!selectCliente) return;

    try {
        const barbearia = await obterBarbearia();

        const { data: clientes, error } = await supabaseClient
            .from("clients")
            .select("id, name")
            .eq("barbershop_id", barbearia.id)
            .order("name");

        if (error) throw error;

        selectCliente.innerHTML =
            '<option value="">Selecione um cliente</option>';

        (clientes || []).forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = cliente.name;
            selectCliente.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
    }
}


// =====================================
// 16. PESQUISA DE CLIENTES NO AGENDAMENTO
// =====================================

const buscaClienteAgendamento =
    document.getElementById("buscarClienteAgendamento");

const sugestoesClientes =
    document.getElementById("sugestoesClientes");

const selectClienteAgendamento =
    document.getElementById("nomeCliente");

function mostrarSugestoesClientes(pesquisa = "") {
    if (!selectClienteAgendamento || !sugestoesClientes) return;

    const termo = pesquisa.toLowerCase().trim();

    const clientes = Array.from(selectClienteAgendamento.options)
        .slice(1)
        .filter(option =>
            option.textContent.toLowerCase().trim().startsWith(termo)
        )
        .sort((a, b) =>
            a.textContent.localeCompare(b.textContent, "pt-BR")
        );

    sugestoesClientes.innerHTML = "";
    sugestoesClientes.style.display = "block";

    if (clientes.length === 0) {
        sugestoesClientes.textContent = "Nenhum cliente encontrado.";
        return;
    }

    clientes.forEach(cliente => {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = cliente.textContent;
        botao.dataset.clienteId = cliente.value;

        sugestoesClientes.appendChild(botao);
    });
}

if (buscaClienteAgendamento) {
    buscaClienteAgendamento.addEventListener("focus", function() {
        mostrarSugestoesClientes(this.value);
    });

    buscaClienteAgendamento.addEventListener("input", function() {
        if (selectClienteAgendamento) {
            selectClienteAgendamento.value = "";
        }

        mostrarSugestoesClientes(this.value);
    });
}

if (sugestoesClientes) {
    sugestoesClientes.addEventListener("click", function(event) {
        const botao = event.target.closest("button");

        if (!botao) return;

        if (selectClienteAgendamento) {
            selectClienteAgendamento.value = botao.dataset.clienteId;
        }

        if (buscaClienteAgendamento) {
            buscaClienteAgendamento.value = botao.textContent;
        }

        sugestoesClientes.style.display = "none";
    });
}

document.addEventListener("click", function(event) {
    const wrapper = document.querySelector(".client-search-wrapper");

    if (
        wrapper &&
        !wrapper.contains(event.target) &&
        sugestoesClientes
    ) {
        sugestoesClientes.style.display = "none";
    }
});


// =====================================
// 17. HISTÓRICO DE CORTES DO CLIENTE
// =====================================

async function verHistoricoCliente(clienteId) {
    const modal = document.getElementById("modalHistorico");
    const lista = document.getElementById("listaHistorico");
    const nomeCliente = document.getElementById("historicoNomeCliente");

    if (!modal || !lista || !nomeCliente) return;

    modal.classList.remove("hidden");
    lista.innerHTML = "<p>Carregando histórico...</p>";

    try {
        const barbearia = await obterBarbearia();

        const { data: cliente, error: erroCliente } = await supabaseClient
            .from("clients")
            .select("name")
            .eq("id", clienteId)
            .eq("barbershop_id", barbearia.id)
            .single();

        if (erroCliente) throw erroCliente;

        nomeCliente.textContent = cliente.name;

        const { data: atendimentos, error } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("client_id", clienteId)
            .eq("barbershop_id", barbearia.id)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false });

        if (error) throw error;

        if (!atendimentos || atendimentos.length === 0) {
            lista.innerHTML = `
                <p>Nenhum atendimento encontrado para este cliente.</p>
            `;
            return;
        }

        lista.innerHTML = atendimentos.map(a => {
            const data = a.appointment_date.split("-").reverse().join("/");
            const horario = a.appointment_time.slice(0, 5);

            return `
                <div class="history-item">
                    <strong>${escaparTexto(a.service)}</strong>
                    <span>Barbeiro: ${escaparTexto(a.barber_name)}</span>
                    <span>Data: ${data}</span>
                    <span>Horário: ${horario}</span>
                    <span>Valor: R$ ${Number(a.price).toFixed(2).replace(".", ",")}</span>
                    <span>Status: ${escaparTexto(a.status)}</span>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(error);
        lista.innerHTML = "<p>Não foi possível carregar o histórico.</p>";
    }
}


// =====================================
// 18. FECHAR HISTÓRICO
// =====================================

const fecharHistorico = document.getElementById("fecharHistorico");
const modalHistorico = document.getElementById("modalHistorico");

if (fecharHistorico && modalHistorico) {
    fecharHistorico.addEventListener("click", function() {
        modalHistorico.classList.add("hidden");
    });
}

if (modalHistorico) {
    modalHistorico.addEventListener("click", function(event) {
        if (event.target === modalHistorico) {
            modalHistorico.classList.add("hidden");
        }
    });
}


// =====================================
// 19. ATUALIZAR DASHBOARD E FATURAMENTO
// =====================================

async function atualizarDashboard() {
    try {
        const barbearia = await obterBarbearia();

        const hoje = new Date();

        const primeiroDia = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            1
        );

        const proximoMes = new Date(
            hoje.getFullYear(),
            hoje.getMonth() + 1,
            1
        );

        function formatarData(data) {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, "0");
            const dia = String(data.getDate()).padStart(2, "0");

            return `${ano}-${mes}-${dia}`;
        }

        const { data: agendamentos, error } = await supabaseClient
            .from("appointments")
            .select("price, status, appointment_date")
            .eq("barbershop_id", barbearia.id)
            .gte("appointment_date", formatarData(primeiroDia))
            .lt("appointment_date", formatarData(proximoMes));

        if (error) throw error;

        const registrosAgendamentos = agendamentos || [];

        const concluidos = registrosAgendamentos.filter(
            a => a.status === "Concluído"
        );

        const faturamento = concluidos.reduce(
            (total, a) => total + Number(a.price || 0),
            0
        );

        const { data: movimentacoes, error: erroFinanceiro } =
            await supabaseClient
                .from("financial_transactions")
                .select("type, amount, transaction_date, source")
                .eq("barbershop_id", barbearia.id)
                .gte("transaction_date", formatarData(primeiroDia))
                .lt("transaction_date", formatarData(proximoMes));

        if (erroFinanceiro) throw erroFinanceiro;

        const dadosFinanceiros = movimentacoes || [];

        const despesas = dadosFinanceiros
            .filter(item => item.type === "despesa")
            .reduce(
                (total, item) => total + Number(item.amount || 0),
                0
            );

        const receitasManuais = dadosFinanceiros
            .filter(item =>
                item.type === "receita" &&
                item.source === "manual"
            )
            .reduce(
                (total, item) => total + Number(item.amount || 0),
                0
            );

        const totalEntradas = faturamento + receitasManuais;
        const saldo = totalEntradas - despesas;

        const formatarDinheiro = valor =>
            valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        const campoFaturamento = document.getElementById("faturamentoMes");
        const campoAgendamentos = document.getElementById("agendamentosMes");
        const campoEntradas = document.getElementById("totalEntradas");
        const campoDespesas = document.getElementById("totalDespesas");
        const campoSaldo = document.getElementById("saldoMes");

        if (campoFaturamento) {
            campoFaturamento.textContent = formatarDinheiro(faturamento);
        }

        if (campoAgendamentos) {
            campoAgendamentos.textContent = registrosAgendamentos.length;
        }

        if (campoEntradas) {
            campoEntradas.textContent = formatarDinheiro(totalEntradas);
        }

        if (campoDespesas) {
            campoDespesas.textContent = formatarDinheiro(despesas);
        }

        if (campoSaldo) {
            campoSaldo.textContent = formatarDinheiro(saldo);
        }

        await carregarProximosAgendamentos();

    } catch (error) {
        console.error("Erro ao atualizar Dashboard:", error);
    }
}


// =====================================
// 20. PRÓXIMOS AGENDAMENTOS
// =====================================

async function carregarProximosAgendamentos() {
    const lista = document.getElementById("proximosAgendamentos");

    if (!lista) return;

    try {
        const barbearia = await obterBarbearia();

        const hoje = new Date();

        const dataHoje = [
            hoje.getFullYear(),
            String(hoje.getMonth() + 1).padStart(2, "0"),
            String(hoje.getDate()).padStart(2, "0")
        ].join("-");

        const horaAtual = [
            String(hoje.getHours()).padStart(2, "0"),
            String(hoje.getMinutes()).padStart(2, "0")
        ].join(":");

        const { data: agendamentos, error } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("barbershop_id", barbearia.id)
            .gte("appointment_date", dataHoje)
            .neq("status", "Cancelado")
            .neq("status", "Concluído")
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });

        if (error) throw error;

        const proximos = (agendamentos || [])
            .filter(a => {
                if (a.appointment_date > dataHoje) return true;

                return a.appointment_time.slice(0, 5) >= horaAtual;
            })
            .slice(0, 5);

        if (proximos.length === 0) {
            lista.innerHTML = "<p>Não há próximos agendamentos.</p>";
            return;
        }

        lista.innerHTML = proximos.map(a => {
            const dataFormatada = a.appointment_date
                .split("-")
                .reverse()
                .join("/");

            const horario = a.appointment_time.slice(0, 5);

            return `
                <div class="upcoming-appointment-item">
                    <div>
                        <strong>${escaparTexto(a.client_name)}</strong>
                        <span>${escaparTexto(a.service)}</span>
                    </div>

                    <div>
                        <span>${dataFormatada}</span>
                        <strong>${horario}</strong>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao carregar próximos agendamentos:", error);
        lista.innerHTML = "<p>Erro ao carregar os agendamentos.</p>";
    }
}


// =====================================
// 21. CADASTRO E EDIÇÃO DE FUNCIONÁRIOS
// =====================================

const modalFuncionario = document.getElementById("modalFuncionario");
const novoFuncionario = document.getElementById("novoFuncionario");
const fecharModalFuncionario = document.getElementById("fecharModalFuncionario");
const cancelarFuncionario = document.getElementById("cancelarFuncionario");
const formFuncionario = document.getElementById("formFuncionario");

let funcionarioEditandoId = null;

function prepararNovoFuncionario() {
    funcionarioEditandoId = null;

    if (formFuncionario) {
        formFuncionario.reset();
    }

    const titulo = document.querySelector(
        "#modalFuncionario .modal-header h2"
    );

    const botaoSalvar = formFuncionario?.querySelector(
        'button[type="submit"]'
    );

    if (titulo) {
        titulo.textContent = "Novo funcionário";
    }

    if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar funcionário";
    }
}

function abrirModalFuncionario(id, nome, telefone) {
    if (!modalFuncionario || !formFuncionario) return;

    funcionarioEditandoId = id;

    const titulo = document.querySelector(
        "#modalFuncionario .modal-header h2"
    );

    const botaoSalvar = formFuncionario.querySelector(
        'button[type="submit"]'
    );

    if (titulo) {
        titulo.textContent = "Editar funcionário";
    }

    document.getElementById("funcionarioNome").value = nome || "";
    document.getElementById("funcionarioTelefone").value = telefone || "";

    if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar alterações";
    }

    modalFuncionario.classList.remove("hidden");
}

if (novoFuncionario && modalFuncionario) {
    novoFuncionario.addEventListener("click", function() {
        prepararNovoFuncionario();
        modalFuncionario.classList.remove("hidden");
    });
}

function fecharModalFuncionarioEPreparar() {
    if (modalFuncionario) {
        modalFuncionario.classList.add("hidden");
    }

    prepararNovoFuncionario();
}

if (fecharModalFuncionario) {
    fecharModalFuncionario.addEventListener(
        "click",
        fecharModalFuncionarioEPreparar
    );
}

if (cancelarFuncionario) {
    cancelarFuncionario.addEventListener(
        "click",
        fecharModalFuncionarioEPreparar
    );
}

if (modalFuncionario) {
    modalFuncionario.addEventListener("click", function(event) {
        if (event.target === modalFuncionario) {
            fecharModalFuncionarioEPreparar();
        }
    });
}

if (formFuncionario) {
    formFuncionario.addEventListener("submit", async function(event) {
        event.preventDefault();

        try {
            const barbearia = await obterBarbearia();

            const funcionario = {
                barbershop_id: barbearia.id,
                name: document.getElementById("funcionarioNome").value.trim(),
                phone: document.getElementById("funcionarioTelefone").value.trim()
            };

            if (!funcionario.name) {
                throw new Error("Informe o nome do funcionário.");
            }

            let error;

            if (funcionarioEditandoId) {
                const resultado = await supabaseClient
                    .from("employees")
                    .update({
                        name: funcionario.name,
                        phone: funcionario.phone
                    })
                    .eq("id", funcionarioEditandoId)
                    .eq("barbershop_id", barbearia.id);

                error = resultado.error;

            } else {
                const resultado = await supabaseClient
                    .from("employees")
                    .insert([funcionario]);

                error = resultado.error;
            }

            if (error) throw error;

            alert(
                funcionarioEditandoId
                    ? "Funcionário atualizado com sucesso!"
                    : "Funcionário cadastrado com sucesso!"
            );

            fecharModalFuncionarioEPreparar();

            await carregarFuncionarios();

        } catch (error) {
            alert("Erro ao salvar funcionário: " + error.message);
        }
    });
}


// =====================================
// 22. CARREGAR FUNCIONÁRIOS
// =====================================

async function carregarFuncionarios() {
    const lista = document.getElementById("listaFuncionarios");

    if (!lista) return;

    try {
        const barbearia = await obterBarbearia();

        const { data: funcionarios, error } = await supabaseClient
            .from("employees")
            .select("*")
            .eq("barbershop_id", barbearia.id)
            .order("name");

        if (error) throw error;

        const registros = funcionarios || [];

        const totalFuncionarios =
            document.getElementById("totalFuncionarios");

        const totalFuncionariosDashboard =
            document.getElementById("totalFuncionariosDashboard");

        if (totalFuncionarios) {
            totalFuncionarios.textContent = registros.length;
        }

        if (totalFuncionariosDashboard) {
            totalFuncionariosDashboard.textContent = registros.length;
        }

        if (registros.length === 0) {
            lista.className = "empty-state";
            lista.innerHTML = `
                <div>♙</div>
                <strong>Nenhum funcionário cadastrado</strong>
                <p>Os profissionais aparecerão aqui.</p>
            `;
            return;
        }

        lista.className = "client-list";

        lista.innerHTML = registros.map(funcionario => {
            const inicial = escaparTexto(
                funcionario.name.charAt(0).toUpperCase()
            );

            return `
                <div class="client-item">
                    <div class="client-avatar">${inicial}</div>

                    <div class="client-info">
                        <strong>${escaparTexto(funcionario.name)}</strong>
                        <span>${escaparTexto(funcionario.phone || "Sem telefone")}</span>
                    </div>

                    <div class="employee-actions">
                        <button
                            type="button"
                            class="btn-editar-funcionario"
                            data-action="editar-funcionario"
                            data-id="${funcionario.id}"
                            data-name="${escaparTexto(funcionario.name)}"
                            data-phone="${escaparTexto(funcionario.phone || "")}"
                            title="Editar funcionário">
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="btn-apagar-funcionario"
                            data-action="excluir-funcionario"
                            data-id="${funcionario.id}"
                            title="Excluir funcionário">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        lista.innerHTML = "<p>Erro ao carregar funcionários.</p>";
    }
}


// =====================================
// 23. EDITAR E EXCLUIR FUNCIONÁRIOS
// =====================================

const listaFuncionarios = document.getElementById("listaFuncionarios");

if (listaFuncionarios) {
    listaFuncionarios.addEventListener("click", async function(event) {
        const botao = event.target.closest("button[data-action]");

        if (!botao) return;

        const id = botao.dataset.id;
        const acao = botao.dataset.action;

        try {
            if (acao === "editar-funcionario") {
                abrirModalFuncionario(
                    id,
                    botao.dataset.name,
                    botao.dataset.phone
                );

                return;
            }

            if (acao === "excluir-funcionario") {
                const confirmar = await confirmarExclusao(
                    "Excluir funcionário",
                    "Tem certeza que deseja excluir este funcionário?"
                );

                if (!confirmar) return;

                const barbearia = await obterBarbearia();

                const { error } = await supabaseClient
                    .from("employees")
                    .delete()
                    .eq("id", id)
                    .eq("barbershop_id", barbearia.id);

                if (error) throw error;

                alert("Funcionário excluído com sucesso!");

                await carregarFuncionarios();
            }

        } catch (error) {
            alert("Erro ao atualizar funcionário: " + error.message);
        }
    });
}


// =====================================
// 23.5. ATUALIZAR FINANCEIRO
// =====================================

async function atualizarFinanceiro() {
    const lista = document.getElementById("listaMovimentacoes");

    try {
        const barbearia = await obterBarbearia();

        const { data: movimentacoes, error } = await supabaseClient
            .from("financial_transactions")
            .select("*")
            .eq("barbershop_id", barbearia.id)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) throw error;

        const dados = movimentacoes || [];

        const receitas = dados
            .filter(item => item.type === "receita")
            .reduce((total, item) => total + Number(item.amount || 0), 0);

        const despesas = dados
            .filter(item => item.type === "despesa")
            .reduce((total, item) => total + Number(item.amount || 0), 0);

        const lucro = receitas - despesas;

        const formatarDinheiro = valor =>
            Number(valor).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        const campoReceitas = document.getElementById("totalReceitas");
        const campoDespesas = document.getElementById("financeiroTotalDespesas");
        const campoLucro = document.getElementById("lucroLiquido");

        if (campoReceitas) {
            campoReceitas.textContent = formatarDinheiro(receitas);
        }

        if (campoDespesas) {
            campoDespesas.textContent = formatarDinheiro(despesas);
        }

        if (campoLucro) {
            campoLucro.textContent = formatarDinheiro(lucro);
        }

        if (!lista) return;

        if (dados.length === 0) {
            lista.innerHTML = "<p>Nenhuma movimentação registrada ainda.</p>";
            return;
        }

        lista.innerHTML = dados.map(item => {
            const data = item.transaction_date
                ? new Date(item.transaction_date + "T00:00:00")
                    .toLocaleDateString("pt-BR")
                : "";

            const receita = item.type === "receita";
            const cor = receita ? "#36c98f" : "#ff6262";
            const sinal = receita ? "+" : "-";

            return `
                <div class="movimentacao-item">
                    <div>
                        <strong>${escaparTexto(item.description)}</strong>
                        <span>${data}</span>
                    </div>

                    <strong style="color: ${cor}">
                        ${sinal} ${formatarDinheiro(Number(item.amount || 0))}
                    </strong>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao atualizar financeiro:", error);

        if (lista) {
            lista.innerHTML =
                "<p>Não foi possível carregar as movimentações.</p>";
        }
    }
}


// =====================================
// 24. CARREGAR DADOS INICIAIS
// =====================================

carregarAgendamentos();
carregarClientes();
carregarClientesNoAgendamento();
atualizarDashboard();
carregarFuncionarios();
atualizarFinanceiro();


// =====================================
// 25. MOVIMENTAÇÕES MANUAIS DO FINANCEIRO
// =====================================

let tipoMovimentacaoAtual = "receita";

const modalMovimentacao = document.getElementById("modalMovimentacao");
const formMovimentacao = document.getElementById("formMovimentacao");

function abrirModalMovimentacao(tipo) {
    tipoMovimentacaoAtual = tipo;

    document.getElementById("tituloMovimentacao").textContent =
        tipo === "receita" ? "Adicionar receita" : "Adicionar despesa";

    document.getElementById("descricaoMovimentacao").value = "";
    document.getElementById("valorMovimentacao").value = "";

    const hoje = new Date();

    const dataLocal =
        hoje.getFullYear() + "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoje.getDate()).padStart(2, "0");

    document.getElementById("dataMovimentacao").value = dataLocal;

    if (modalMovimentacao) {
        modalMovimentacao.classList.remove("hidden");
    }
}

function fecharModalMovimentacao() {
    if (modalMovimentacao) {
        modalMovimentacao.classList.add("hidden");
    }
}

const btnAdicionarReceita = document.getElementById("btnAdicionarReceita");

if (btnAdicionarReceita) {
    btnAdicionarReceita.addEventListener("click", () => {
        abrirModalMovimentacao("receita");
    });
}

const btnAdicionarDespesa = document.getElementById("btnAdicionarDespesa");

if (btnAdicionarDespesa) {
    btnAdicionarDespesa.addEventListener("click", () => {
        abrirModalMovimentacao("despesa");
    });
}

const fecharModalMovimentacaoBotao =
    document.getElementById("fecharModalMovimentacao");

const cancelarMovimentacao =
    document.getElementById("cancelarMovimentacao");

if (fecharModalMovimentacaoBotao) {
    fecharModalMovimentacaoBotao.addEventListener(
        "click",
        fecharModalMovimentacao
    );
}

if (cancelarMovimentacao) {
    cancelarMovimentacao.addEventListener(
        "click",
        fecharModalMovimentacao
    );
}

if (modalMovimentacao) {
    modalMovimentacao.addEventListener("click", (event) => {
        if (event.target === modalMovimentacao) {
            fecharModalMovimentacao();
        }
    });
}


// SALVAR MOVIMENTAÇÃO

if (formMovimentacao) {
    formMovimentacao.addEventListener("submit", async (event) => {
        event.preventDefault();

        const descricao = document
            .getElementById("descricaoMovimentacao")
            .value.trim();

        const valor = Number(
            document.getElementById("valorMovimentacao").value
        );

        const data = document
            .getElementById("dataMovimentacao")
            .value;

        if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        const botaoSalvar = document.getElementById("salvarMovimentacao");

        if (botaoSalvar) {
            botaoSalvar.disabled = true;
            botaoSalvar.textContent = "Salvando...";
        }

        try {
            const barbearia = await obterBarbearia();

            const { error } = await supabaseClient
                .from("financial_transactions")
                .insert({
                    barbershop_id: barbearia.id,
                    appointment_id: null,
                    type: tipoMovimentacaoAtual,
                    source: "manual",
                    description: descricao,
                    amount: valor,
                    transaction_date: data
                });

            if (error) throw error;

            alert("Movimentação salva com sucesso!");

            fecharModalMovimentacao();

            await atualizarFinanceiro();
            await atualizarDashboard();

        } catch (error) {
            console.error("Erro ao salvar movimentação:", error);
            alert("Não foi possível salvar a movimentação. Verifique o console.");
        } finally {
            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar movimentação";
            }
        }
    });
}


// =====================================
// 26. CONFIRMAÇÃO PERSONALIZADA DO BARBERPRO
// =====================================

function confirmarExclusao(titulo, mensagem) {
    return new Promise(resolve => {
        const modal = document.getElementById("modalConfirmacao");
        const tituloModal = document.getElementById("tituloConfirmacao");
        const mensagemModal = document.getElementById("mensagemConfirmacao");
        const botaoConfirmar = document.getElementById("confirmarAcao");
        const botaoCancelar = document.getElementById("cancelarConfirmacao");
        const botaoFechar = document.getElementById("fecharConfirmacao");

        if (
            !modal ||
            !tituloModal ||
            !mensagemModal ||
            !botaoConfirmar ||
            !botaoCancelar ||
            !botaoFechar
        ) {
            resolve(confirm("Deseja realmente excluir?"));
            return;
        }

        tituloModal.textContent = titulo;
        mensagemModal.textContent = mensagem;
        botaoConfirmar.textContent = "Excluir";

        modal.classList.remove("hidden");

        function finalizar(resultado) {
            modal.classList.add("hidden");

            botaoConfirmar.onclick = null;
            botaoCancelar.onclick = null;
            botaoFechar.onclick = null;
            modal.onclick = null;

            resolve(resultado);
        }

        botaoConfirmar.onclick = () => finalizar(true);
        botaoCancelar.onclick = () => finalizar(false);
        botaoFechar.onclick = () => finalizar(false);

        modal.onclick = event => {
            if (event.target === modal) {
                finalizar(false);
            }
        };
    });
}


// =====================================
// 27. CONFIGURAÇÕES DA BARBEARIA
// =====================================

// CARREGAR CONFIGURAÇÕES

async function carregarConfiguracoes() {
    try {
        const barbearia = await obterBarbearia();

        const { data, error } = await supabaseClient
            .from("barbershops")
            .select("name, phone, address, description, opening_time, closing_time")
            .eq("id", barbearia.id)
            .single();

        if (error) throw error;

        const campoNome = document.getElementById("configNomeBarbearia");
        const campoTelefone = document.getElementById("configTelefone");
        const campoEndereco = document.getElementById("configEndereco");
        const campoDescricao = document.getElementById("configDescricao");
        const campoAbertura = document.getElementById("configAbertura");
        const campoFechamento = document.getElementById("configFechamento");

        if (campoNome) campoNome.value = data.name || "";
        if (campoTelefone) campoTelefone.value = data.phone || "";
        if (campoEndereco) campoEndereco.value = data.address || "";
        if (campoDescricao) campoDescricao.value = data.description || "";

        if (campoAbertura) {
            campoAbertura.value =
                data.opening_time ? data.opening_time.slice(0, 5) : "08:00";
        }

        if (campoFechamento) {
            campoFechamento.value =
                data.closing_time ? data.closing_time.slice(0, 5) : "18:00";
        }

    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
}


// SALVAR DADOS DA BARBEARIA

const formConfiguracoes = document.getElementById("formConfiguracoes");

if (formConfiguracoes) {
    formConfiguracoes.addEventListener("submit", async function(event) {
        event.preventDefault();

        try {
            const barbearia = await obterBarbearia();

            const campoNome = document.getElementById("configNomeBarbearia");
            const campoTelefone = document.getElementById("configTelefone");
            const campoEndereco = document.getElementById("configEndereco");
            const campoDescricao = document.getElementById("configDescricao");

            const { error } = await supabaseClient
                .from("barbershops")
                .update({
                    name: campoNome?.value || "",
                    phone: campoTelefone?.value || "",
                    address: campoEndereco?.value || "",
                    description: campoDescricao?.value || ""
                })
                .eq("id", barbearia.id);

            if (error) throw error;

            mostrarSucesso();

        } catch (error) {
            console.error("Erro ao salvar dados:", error);
            alert("Não foi possível salvar os dados da barbearia.");
        }
    });
}


// SALVAR HORÁRIOS

const botaoSalvarHorarios = document.getElementById("salvarHorarios");

if (botaoSalvarHorarios) {
    botaoSalvarHorarios.addEventListener("click", async function() {
        try {
            const barbearia = await obterBarbearia();

            const campoAbertura = document.getElementById("configAbertura");
            const campoFechamento = document.getElementById("configFechamento");

            if (!campoAbertura || !campoFechamento) {
                throw new Error("Os campos de horário não foram encontrados.");
            }

            const { error } = await supabaseClient
                .from("barbershops")
                .update({
                    opening_time: campoAbertura.value,
                    closing_time: campoFechamento.value
                })
                .eq("id", barbearia.id);

            if (error) throw error;

            mostrarSucesso();

        } catch (error) {
            console.error("Erro ao salvar horários:", error);
            alert("Não foi possível salvar os horários.");
        }
    });
}


// CARREGAR CONFIGURAÇÕES AO INICIAR

carregarConfiguracoes();


// =====================================
// 28. MODAL DE SUCESSO
// =====================================

function mostrarSucesso() {
    const modal = document.getElementById("modalSucesso");

    if (modal) {
        modal.classList.remove("hidden");
    }
}

const fecharSucesso = document.getElementById("fecharSucesso");

if (fecharSucesso) {
    fecharSucesso.addEventListener("click", function() {
        const modal = document.getElementById("modalSucesso");

        if (modal) {
            modal.classList.add("hidden");
        }
    });
}


// =====================================
// 29. FOTO DE PERFIL
// =====================================

const inputFotoPerfil = document.getElementById("inputFotoPerfil");
const botaoFotoPerfil = document.getElementById("botaoFotoPerfil");
const botaoFotoPerfilTopo = document.getElementById("botaoFotoPerfilTopo");

const modalFotoPerfil = document.getElementById("modalFotoPerfil");
const previewFotoPerfil = document.getElementById("previewFotoPerfil");

const salvarFotoPerfil = document.getElementById("salvarFotoPerfil");
const cancelarFotoPerfil = document.getElementById("cancelarFotoPerfil");
const fecharModalFoto = document.getElementById("fecharModalFoto");

let arquivoFotoSelecionado = null;
let urlPreviewFoto = null;
let cropperFoto = null;

const modalEscolherFoto = document.getElementById("modalEscolherFoto");

function abrirEscolhaFoto() {
    if (modalEscolherFoto) {
        modalEscolherFoto.classList.remove("hidden");
    }
}

if (botaoFotoPerfil) {
    botaoFotoPerfil.addEventListener("click", abrirEscolhaFoto);
}

if (botaoFotoPerfilTopo) {
    botaoFotoPerfilTopo.addEventListener("click", abrirEscolhaFoto);
}

const confirmarEscolherFoto =
    document.getElementById("confirmarEscolherFoto");

if (confirmarEscolherFoto) {
    confirmarEscolherFoto.addEventListener("click", () => {
        if (modalEscolherFoto) {
            modalEscolherFoto.classList.add("hidden");
        }

        if (inputFotoPerfil) {
            inputFotoPerfil.click();
        }
    });
}

const cancelarEscolherFoto =
    document.getElementById("cancelarEscolherFoto");

if (cancelarEscolherFoto) {
    cancelarEscolherFoto.addEventListener("click", () => {
        if (modalEscolherFoto) {
            modalEscolherFoto.classList.add("hidden");
        }
    });
}

const fecharEscolherFoto =
    document.getElementById("fecharEscolherFoto");

if (fecharEscolherFoto) {
    fecharEscolherFoto.addEventListener("click", () => {
        if (modalEscolherFoto) {
            modalEscolherFoto.classList.add("hidden");
        }
    });
}


// EXIBE A PRÉVIA DA FOTO ESCOLHIDA

if (inputFotoPerfil) {
    inputFotoPerfil.addEventListener("change", () => {
        const arquivo = inputFotoPerfil.files[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem.");
            inputFotoPerfil.value = "";
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5 MB.");
            inputFotoPerfil.value = "";
            return;
        }

        if (!previewFotoPerfil || !modalFotoPerfil) {
            alert("Não foi possível abrir a prévia da foto.");
            return;
        }

        if (typeof Cropper === "undefined") {
            alert("Não foi possível carregar o editor de fotos.");
            return;
        }

        arquivoFotoSelecionado = arquivo;

        if (urlPreviewFoto) {
            URL.revokeObjectURL(urlPreviewFoto);
        }

        urlPreviewFoto = URL.createObjectURL(arquivo);

        previewFotoPerfil.onload = () => {
            if (cropperFoto) {
                cropperFoto.destroy();
            }

            cropperFoto = new Cropper(previewFotoPerfil, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: "move",
                autoCropArea: 1,
                movable: true,
                zoomable: true,
                zoomOnWheel: true,
                cropBoxMovable: false,
                cropBoxResizable: false,
                guides: false,
                background: false
            });
        };

        previewFotoPerfil.src = urlPreviewFoto;
        modalFotoPerfil.classList.remove("hidden");
    });
}


// FECHA A PRÉVIA

function fecharPreviaFoto() {
    if (cropperFoto) {
        cropperFoto.destroy();
        cropperFoto = null;
    }

    if (modalFotoPerfil) {
        modalFotoPerfil.classList.add("hidden");
    }

    if (inputFotoPerfil) {
        inputFotoPerfil.value = "";
    }

    arquivoFotoSelecionado = null;

    if (urlPreviewFoto) {
        URL.revokeObjectURL(urlPreviewFoto);
        urlPreviewFoto = null;
    }

    if (previewFotoPerfil) {
        previewFotoPerfil.src = "";
    }
}

if (cancelarFotoPerfil) {
    cancelarFotoPerfil.addEventListener("click", fecharPreviaFoto);
}

if (fecharModalFoto) {
    fecharModalFoto.addEventListener("click", fecharPreviaFoto);
}


// ATUALIZA OS DOIS AVATARES

function atualizarFotoNaTela(url) {
    const imagens = [
        document.getElementById("fotoPerfilSidebar"),
        document.getElementById("fotoPerfilTopo")
    ];

    const letras = [
        document.getElementById("letraPerfilSidebar"),
        document.getElementById("letraPerfilTopo")
    ];

    imagens.forEach((imagem, index) => {
        if (imagem) {
            imagem.src = url;
            imagem.style.display = "block";
        }

        if (letras[index]) {
            letras[index].style.display = "none";
        }
    });
}


// SALVA A FOTO NO SUPABASE

if (salvarFotoPerfil) {
    salvarFotoPerfil.addEventListener("click", async () => {
        if (!arquivoFotoSelecionado) return;

        salvarFotoPerfil.disabled = true;
        salvarFotoPerfil.textContent = "Salvando...";

        try {
            const { data: usuarioData, error: usuarioErro } =
                await supabaseClient.auth.getUser();

            if (usuarioErro || !usuarioData.user) {
                throw new Error("Você precisa estar conectado para salvar a foto.");
            }

            const usuario = usuarioData.user;

            const imagemCortada = await new Promise((resolve, reject) => {
                if (!cropperFoto) {
                    reject(new Error("Ajuste a imagem antes de salvar."));
                    return;
                }

                cropperFoto.getCroppedCanvas({
                    width: 512,
                    height: 512,
                    imageSmoothingQuality: "high"
                }).toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Não foi possível recortar a imagem."));
                    }
                }, "image/jpeg", 0.90);
            });

            const { error: uploadErro } = await supabaseClient
                .storage
                .from("avatars")
                .upload(`${usuario.id}/avatar`, imagemCortada, {
                    upsert: true,
                    contentType: "image/jpeg"
                });

            if (uploadErro) throw uploadErro;

            const { data: urlData } = supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(`${usuario.id}/avatar`);

            const urlFoto = urlData.publicUrl + "?v=" + Date.now();

            const { error: perfilErro } = await supabaseClient.auth.updateUser({
                data: {
                    avatar_url: urlFoto
                }
            });

            if (perfilErro) throw perfilErro;

            atualizarFotoNaTela(urlFoto);
            fecharPreviaFoto();

            const modalFotoSucesso =
                document.getElementById("modalFotoSucesso");

            if (modalFotoSucesso) {
                modalFotoSucesso.classList.remove("hidden");
            }

        } catch (erro) {
            console.error("Erro ao salvar foto:", erro);
            alert("Não foi possível salvar a foto: " + erro.message);

        } finally {
            salvarFotoPerfil.disabled = false;
            salvarFotoPerfil.textContent = "Confirmar foto";
        }
    });
}


// CARREGA A FOTO SALVA QUANDO O USUÁRIO ENTRA NO PAINEL

async function carregarFotoPerfil() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) return;

        const urlFoto = data.user.user_metadata?.avatar_url;

        if (urlFoto) {
            atualizarFotoNaTela(urlFoto);
        }

    } catch (erro) {
        console.error("Erro ao carregar foto de perfil:", erro);
    }
}

carregarFotoPerfil();


// FECHAR MENSAGEM DE SUCESSO DA FOTO

const fecharFotoSucesso = document.getElementById("fecharFotoSucesso");

if (fecharFotoSucesso) {
    fecharFotoSucesso.addEventListener("click", () => {
        const modal = document.getElementById("modalFotoSucesso");

        if (modal) {
            modal.classList.add("hidden");
        }
    });
}


// =====================================
// 30. ALTERAR E-MAIL DA CONTA
// =====================================

const formAlterarEmail = document.getElementById("formAlterarEmail");

const modalErroEmail = document.getElementById("modalEmailErro");
const mensagemErroEmail = document.getElementById("mensagemEmailErro");
const modalSucessoEmail = document.getElementById("modalEmailSucesso");


// ABRIR MODAL DE ERRO CENTRALIZADO

function abrirModalErroEmail(mensagem) {
    if (!modalErroEmail) {
        alert(mensagem);
        return;
    }

    if (mensagemErroEmail) {
        mensagemErroEmail.textContent = mensagem;
    }

    // Posiciona o modal no centro da tela
    modalErroEmail.style.position = "fixed";
    modalErroEmail.style.inset = "0";
    modalErroEmail.style.width = "100%";
    modalErroEmail.style.height = "100%";
    modalErroEmail.style.display = "flex";
    modalErroEmail.style.alignItems = "center";
    modalErroEmail.style.justifyContent = "center";
    modalErroEmail.style.zIndex = "99999";
    modalErroEmail.style.background = "rgba(0, 0, 0, 0.65)";
    modalErroEmail.style.padding = "20px";
    modalErroEmail.style.boxSizing = "border-box";

    modalErroEmail.classList.remove("hidden");

    const conteudo = modalErroEmail.querySelector(".modal-card");

    if (conteudo) {
        conteudo.style.position = "relative";
        conteudo.style.margin = "auto";
        conteudo.style.width = "100%";
        conteudo.style.maxWidth = "440px";
    }
}


// FECHAR MODAL DE ERRO

function fecharModalErroEmail() {
    if (!modalErroEmail) return;

    modalErroEmail.classList.add("hidden");
    modalErroEmail.style.display = "none";
}


// ENVIAR ALTERAÇÃO DE E-MAIL

if (formAlterarEmail) {
    formAlterarEmail.addEventListener("submit", async function(event) {
        event.preventDefault();

        const campoNovoEmail = document.getElementById("novoEmail");

        if (!campoNovoEmail) return;

        const novoEmail = campoNovoEmail.value.trim();

        if (!novoEmail) {
            abrirModalErroEmail(
                "Digite um endereço de e-mail válido."
            );
            return;
        }

        const botaoEnviar = formAlterarEmail.querySelector(
            'button[type="submit"]'
        );

        if (botaoEnviar) {
            botaoEnviar.disabled = true;
            botaoEnviar.textContent = "Atualizando...";
        }

        try {
            const { error } = await supabaseClient.auth.updateUser({
                email: novoEmail
            });

            if (error) {
                throw error;
            }

            formAlterarEmail.reset();

            if (modalErroEmail) {
                modalErroEmail.classList.add("hidden");
                modalErroEmail.style.display = "none";
            }

            if (modalSucessoEmail) {
                modalSucessoEmail.classList.remove("hidden");
            }

        } catch (error) {
            console.error("Erro ao atualizar e-mail:", error);

            const mensagemOriginal = (
                error.message || ""
            ).toLowerCase();

            if (mensagemOriginal.includes("email rate limit exceeded")) {
                abrirModalErroEmail(
                    "O limite de solicitações de e-mail foi atingido. Aguarde alguns minutos antes de tentar novamente."
                );

            } else {
                abrirModalErroEmail(
                    error.message ||
                    "Não foi possível atualizar seu e-mail. Tente novamente."
                );
            }

        } finally {
            if (botaoEnviar) {
                botaoEnviar.disabled = false;
                botaoEnviar.textContent = "Atualizar e-mail";
            }
        }
    });
}


// FECHAR MODAL DE SUCESSO DO E-MAIL

const fecharEmailSucesso = document.getElementById("fecharEmailSucesso");

if (fecharEmailSucesso) {
    fecharEmailSucesso.addEventListener("click", function() {
        if (modalSucessoEmail) {
            modalSucessoEmail.classList.add("hidden");
        }
    });
}


// FECHAR MODAL DE ERRO DO E-MAIL

const fecharEmailErro = document.getElementById("fecharEmailErro");

if (fecharEmailErro) {
    fecharEmailErro.addEventListener("click", fecharModalErroEmail);
}


// FECHAR AO CLICAR FORA DA JANELA

if (modalErroEmail) {
    modalErroEmail.addEventListener("click", function(event) {
        if (event.target === modalErroEmail) {
            fecharModalErroEmail();
        }
    });
}