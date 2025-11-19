/* ==========================================================
    Music Store - Script Principal (Corrigido)
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

        // Home
        if (document.getElementById("produtos-destaque")) {
            carregarDestaques();
            carregarNovidades();
        }

        // Página Catálogo
        if (document.getElementById("lista-produtos")) {
            carregarCatalogo();
        }

        // Página Produto individual
        if (document.getElementById("produto-detalhe")) {
            carregarProdutoIndividual();
        }

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

// ========================
// 🔹 CRIAÇÃO DE CARDS
// ========================
function criarCard(produto) {
    return `
        <div class="card-produto">
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>

            <!-- Ajuste: link correto para página de produto -->
            <a href="produto.html?id=${produto.id}" class="btn-ver">Ver Produto</a>

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


function carregarProdutoIndividual() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    const produto = produtos.find(p => p.id === id);

    if (!produto) return;

    document.getElementById("produtoImagem").src = produto.imagem;
    document.getElementById("produtoNome").textContent = produto.nome;
    document.getElementById("produtoPreco").textContent = "R$ " + produto.preco.toFixed(2);
    document.getElementById("produtoDescricao").textContent = produto.descricao;

    // Estoque
    document.getElementById("produtoEstoque").textContent =
        produto.estoque > 0 ? `Em estoque (${produto.estoque})` : "Indisponível";

    document
        .getElementById("btnAddDetalhe")
        .setAttribute("data-id", produto.id);
}


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
    
    if (produto.estoque <= 0) {
        alert("Produto sem estoque disponível.");
        return;
    }

    const itemExistente = carrinho.find(p => p.id === produto.id);

    if (itemExistente) {
        if (itemExistente.qtd >= produto.estoque) {
            alert("Quantidade máxima do estoque atingida.");
            return;
        }
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

    const aprovado = Math.random() > 0.2;

    if (aprovado) {
    
        carrinho.forEach(item => {
            const produtoOriginal = produtos.find(p => p.id === item.id);
            if (produtoOriginal) produtoOriginal.estoque -= item.qtd;
        });

        localStorage.setItem("produtos", JSON.stringify(produtos));
        localStorage.removeItem("carrinho");

        alert("Pagamento aprovado!");
        window.location.href = "confirmacao.html";
    } else {
        alert("Pagamento recusado. Verifique os dados e tente novamente.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();

    if (document.getElementById("itens-carrinho")) {
        exibirCarrinho();
    }
});
