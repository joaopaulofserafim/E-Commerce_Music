/* ==========================================================
    Music Store - Script Principal
   ========================================================== */

// ========================
// 🔹 VARIÁVEIS GLOBAIS
// ========================
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let usuarioLogado = JSON.parse(localStorage.getItem("usuario")) || null;

// ========================
// 🔹 CARREGAR PRODUTOS
// ========================
async function carregarProdutos() {
    try {
        const caminho =
            location.pathname.includes("/pages/")
                ? "../data/produtos.json"
                : "data/produtos.json";

        const res = await fetch(caminho);
        produtos = await res.json();

        if (document.getElementById("produtos-destaque")) {
            carregarDestaques();
            carregarNovidades();
        }

        if (document.getElementById("lista-produtos")) {
            carregarCatalogo();
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

function criarCard(produto) {
    return `
        <div class="card-produto">
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
            <button class="btn-add" data-id="${produto.id}">Adicionar ao Carrinho</button>
        </div>
    `;
}

function carregarDestaques() {
    const container = document.getElementById("produtos-destaque");
    const destaques = produtos.filter(p => p.destaque);
    container.innerHTML = destaques.map(criarCard).join("");
}

function carregarNovidades() {
    const container = document.getElementById("produtos-novos");
    const novos = produtos.filter(p => p.novo);
    container.innerHTML = novos.map(criarCard).join("");
}

function carregarCatalogo() {
    const container = document.getElementById("lista-produtos");
    container.innerHTML = produtos.map(criarCard).join("");
}

// ========================
// 🔹 CARRINHO
// ========================
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-add")) {
        const id = parseInt(e.target.dataset.id);
        const produto = produtos.find(p => p.id === id);
        adicionarAoCarrinho(produto);
    }
    if (e.target.classList.contains("remover-item")) {
        removerDoCarrinho(e.target.dataset.id);
    }
});

function adicionarAoCarrinho(produto) {
    const itemExistente = carrinho.find(p => p.id === produto.id);
    if (itemExistente) {
        itemExistente.qtd += 1;
    } else {
        carrinho.push({ ...produto, qtd: 1 });
    }
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    alert("Produto adicionado ao carrinho!");
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(p => p.id != id);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    exibirCarrinho();
}

function exibirCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalContainer = document.getElementById("total-carrinho");
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
        totalContainer.textContent = "";
        return;
    }

    container.innerHTML = carrinho
        .map(
            (p) => `
            <div class="item-carrinho">
                <span>${p.nome}</span>
                <span>Qtd: ${p.qtd}</span>
                <span>R$ ${(p.preco * p.qtd).toFixed(2)}</span>
                <button class="remover-item" data-id="${p.id}">Remover</button>
            </div>`
        )
        .join("");

    const total = carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0);
    totalContainer.textContent = `Total: R$ ${total.toFixed(2)}`;
}

// ========================
// 🔹 LOGIN / CADASTRO
// ========================
function login(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

    const usuario = JSON.parse(localStorage.getItem("usuarioCadastrado"));

    if (!usuario || usuario.email !== email || usuario.senha !== senha) {
        alert("Usuário ou senha incorretos.");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify(usuario));
    window.location.href = "../index.html";
}

function cadastro(event) {
    event.preventDefault();
    const email = document.getElementById("cadastroEmail").value;
    const senha = document.getElementById("cadastroSenha").value;

    localStorage.setItem("usuarioCadastrado", JSON.stringify({ email, senha }));
    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem("usuario");
    alert("Sessão encerrada.");
    window.location.href = "../index.html";
}

// ========================
// 🔹 PAGAMENTO (SIMULADO)
// ========================
function finalizarPagamento(event) {
    event.preventDefault();
    const numeroCartao = document.getElementById("numeroCartao").value;
    const nome = document.getElementById("nomeCartao").value;
    const validade = document.getElementById("validadeCartao").value;
    const cvv = document.getElementById("cvvCartao").value;

    if (!numeroCartao || !nome || !validade || !cvv) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const aprovado = Math.random() > 0.2; // 80% de chance de aprovação
    if (aprovado) {
        localStorage.removeItem("carrinho");
        alert("Pagamento aprovado! Seu pedido foi confirmado.");
        window.location.href = "confirmacao.html";
    } else {
        alert("Pagamento recusado. Verifique os dados e tente novamente.");
    }
}

// ========================
// 🔹 INICIALIZAÇÃO
// ========================
document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();

    if (document.getElementById("itens-carrinho")) {
        exibirCarrinho();
    }
});
