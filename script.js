
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
// 2. ELEMENTOS DAS TELAS
// =====================================

const landingView = document.getElementById("landingView");
const containerLogin = document.querySelector(".container");

const loginView = document.getElementById("loginView");
const cadastroView = document.getElementById("cadastroView");

const criarConta = document.getElementById("criarConta");
const voltarLogin = document.getElementById("voltarLogin");

const loginForm = document.getElementById("loginForm");
const cadastroForm = document.getElementById("cadastroForm");


// =====================================
// 3. NAVEGAÇÃO ENTRE AS TELAS
// =====================================

function mostrarInicio() {

    containerLogin.classList.add("hidden");
    landingView.classList.remove("hidden");

}

function mostrarLogin() {

    landingView.classList.add("hidden");
    containerLogin.classList.remove("hidden");

    cadastroView.classList.add("hidden");
    loginView.classList.remove("hidden");

}

function mostrarCadastro() {

    landingView.classList.add("hidden");
    containerLogin.classList.remove("hidden");

    loginView.classList.add("hidden");
    cadastroView.classList.remove("hidden");

}


// Botões da página inicial

document.getElementById("btnComecarAgora")
    .addEventListener("click", mostrarCadastro);

document.getElementById("btnLandingCadastro")
    .addEventListener("click", mostrarCadastro);

document.getElementById("btnLandingLogin")
    .addEventListener("click", mostrarLogin);

document.getElementById("btnJaTenhoConta")
    .addEventListener("click", mostrarLogin);


// Voltar para a página inicial

document.getElementById("voltarInicioLogin")
    .addEventListener("click", function(event) {

        event.preventDefault();
        mostrarInicio();

    });

document.getElementById("voltarInicioCadastro")
    .addEventListener("click", function(event) {

        event.preventDefault();
        mostrarInicio();

    });


// Alternar entre login e cadastro

criarConta.addEventListener("click", function(event) {

    event.preventDefault();
    mostrarCadastro();

});

voltarLogin.addEventListener("click", function(event) {

    event.preventDefault();
    mostrarLogin();

});


// =====================================
// 4. CADASTRAR BARBEARIA
// =====================================

cadastroForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const nomeBarbearia =
        document.getElementById("nomeBarbearia").value.trim();

    const responsavel =
        document.getElementById("responsavel").value.trim();

    const email =
        document.getElementById("emailCadastro").value.trim();

    const telefone =
        document.getElementById("telefone").value.trim();

    const senha =
        document.getElementById("senhaCadastro").value;

    const confirmarSenha =
        document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não são iguais!");
        return;
    }

    if (senha.length < 6) {
        alert("A senha precisa ter pelo menos 6 caracteres.");
        return;
    }

    try {

        const { data, error } = await supabaseClient.auth.signUp({

            email: email,
            password: senha,

            options: {
                data: {
                    barbershop_name: nomeBarbearia,
                    responsible: responsavel,
                    phone: telefone
                }
            }

        });

        if (error) {
            throw error;
        }

        alert(
            "Cadastro realizado! " +
            "Verifique seu e-mail para confirmar a conta, caso solicitado."
        );

        cadastroForm.reset();

        mostrarLogin();

    } catch (error) {

        alert("Erro ao cadastrar: " + error.message);

    }

});


// =====================================
// 5. FAZER LOGIN
// =====================================

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const senha =
        document.getElementById("senha").value;

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,
                password: senha

            });

        if (error) {

            document.getElementById("tituloErroLogin").textContent =
                "E-mail ou senha incorretos";

            document.getElementById("mensagemErroLogin").textContent =
                "Confira seus dados e tente novamente. Verifique se o e-mail e a senha foram digitados corretamente.";

            document.getElementById("modalErroLogin")
                .classList.remove("hidden");

            return;
        }

        document.getElementById("modalLoginSucesso")
            .classList.remove("hidden");

    } catch (error) {

        alert("Erro ao entrar: " + error.message);

    }

});


// =====================================
// 6. CONTINUAR APÓS LOGIN
// =====================================

document.getElementById("continuarLogin")
    .addEventListener("click", () => {

        window.location.href = "dashboard.html";

    });


// =====================================
// 7. FECHAR MODAL DE ERRO DE LOGIN
// =====================================

document.getElementById("fecharErroLogin")
    .addEventListener("click", () => {

        document.getElementById("modalErroLogin")
            .classList.add("hidden");

        document.getElementById("senha").value = "";

        document.getElementById("senha").focus();

    });
