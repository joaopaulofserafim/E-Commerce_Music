/* ==========================================================
   Music Store - Script Principal
   ========================================================== */

// ========================
// VARIÁVEIS GLOBAIS
// ========================
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let usuarioLogado = JSON.parse(localStorage.getItem("usuario")) || null;

const ADMIN_EMAIL = "admin@music.com";
const ADMIN_PASSWORD = "admin123";

// ========================
// UTILITÁRIOS GERAIS
// ========================
function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

// Alerta visual (toast). Se não existir o elemento, usa alert normal.
function showAlert(mensagem, tipo = "sucesso") {
    const alerta = document.getElementById("alerta-msg");
    if (!alerta) {
        alert(mensagem);
        return;
    }

    alerta.textContent = mensagem;
    alerta.className = "alerta-popup " + tipo;
    alerta.classList.add("show");

    setTimeout(() => {
        alerta.classList.remove("show");
    }, 3000);
}

function getCaminhoProdutosJson() {
    return location.pathname.includes("/pages/")
        ? "../data/produtos.json"
        : "data/produtos.json";
}

// ========================
// CARREGAR PRODUTOS
// ========================
async function carregarProdutos() {
    try {
        const caminho = getCaminhoProdutosJson();
        const res = await fetch(caminho);
        const baseProdutos = await res.json();

        // Se o admin já tiver alterado os produtos, usamos a versão do localStorage
        const produtosAdmin = JSON.parse(localStorage.getItem("produtosAdmin"));
        if (Array.isArray(produtosAdmin) && produtosAdmin.length > 0) {
            produtos = produtosAdmin;
        } else {
            produtos = baseProdutos;
        }

        if (document.getElementById("produtos-destaque")) {
            carregarDestaques();
            carregarNovidades();
        }

        if (document.getElementById("lista-produtos")) {
            carregarCatalogo();
            inicializarFiltrosCatalogo();
        }

        if (document.getElementById("produto-detalhe")) {
            carregarDetalheProduto();
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showAlert("Não foi possível carregar os produtos.", "erro");
    }
}

// Cria o card de produto (Home e Catálogo)
function criarCard(produto) {
    const basePath = location.pathname.includes("/pages/")
        ? "produto.html?id="
        : "pages/produto.html?id=";

    const precoFormatado = Number(produto.preco).toFixed(2).replace(".", ",");

    return `
        <div class="card-produto" data-categoria="${produto.categoria || ""}">
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${precoFormatado}</p>

            <a href="${basePath + produto.id}" class="btn-ver">Ver Produto</a>
            <button class="btn-add" data-id="${produto.id}">Adicionar ao Carrinho</button>
        </div>
    `;
}

function carregarDestaques() {
    const container = document.getElementById("produtos-destaque");
    if (!container) return;
    const destaques = produtos.filter(p => p.destaque);
    container.innerHTML = destaques.map(criarCard).join("");
}

function carregarNovidades() {
    const container = document.getElementById("produtos-novos");
    if (!container) return;
    const novos = produtos.filter(p => p.novo);
    container.innerHTML = novos.map(criarCard).join("");
}

function carregarCatalogo() {
    const container = document.getElementById("lista-produtos");
    if (!container) return;
    container.innerHTML = produtos.map(criarCard).join("");
}

// Filtros de busca e categoria na página de instrumentos
function inicializarFiltrosCatalogo() {
    const buscaInput = document.getElementById("busca");
    const selectCategoria = document.getElementById("filtroCategoria");
    if (!buscaInput || !selectCategoria) return;

    function aplicarFiltro() {
        const termo = buscaInput.value.toLowerCase();
        const categoria = selectCategoria.value;
        const cards = document.querySelectorAll(".card-produto");

        cards.forEach(card => {
            const nome = card.querySelector("h3").textContent.toLowerCase();
            const catCard = (card.dataset.categoria || "").toLowerCase();

            const combinaNome = nome.includes(termo);
            const combinaCategoria = !categoria || catCard === categoria.toLowerCase();

            card.style.display = (combinaNome && combinaCategoria) ? "block" : "none";
        });
    }

    buscaInput.addEventListener("input", aplicarFiltro);
    selectCategoria.addEventListener("change", aplicarFiltro);
}

// ========================
// DETALHE DO PRODUTO
// ========================
function carregarDetalheProduto() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    if (!id) return;

    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    const img = document.getElementById("produtoImagem");
    const nome = document.getElementById("produtoNome");
    const preco = document.getElementById("produtoPreco");
    const desc = document.getElementById("produtoDescricao");
    const estoque = document.getElementById("produtoEstoque");
    const btnAdd = document.getElementById("btnAddDetalhe");

    img.src = produto.imagem;
    img.alt = produto.nome;
    nome.textContent = produto.nome;
    preco.textContent = "R$ " + Number(produto.preco).toFixed(2).replace(".", ",");
    desc.textContent = produto.descricao || "Produto sem descrição.";
    estoque.textContent = produto.estoque > 0
        ? `Estoque disponível: ${produto.estoque}`
        : "Sem estoque no momento.";

    btnAdd.addEventListener("click", () => adicionarAoCarrinho(produto));
}

// ========================
// CARRINHO
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
    if (!produto) return;

    const itemExistente = carrinho.find(p => p.id === produto.id);

    // validação simples de estoque (não deixa passar do estoque)
    if (produto.estoque && itemExistente && itemExistente.qtd >= produto.estoque) {
        showAlert("Estoque insuficiente para este produto.", "erro");
        return;
    }

    if (itemExistente) {
        itemExistente.qtd += 1;
    } else {
        carrinho.push({ ...produto, qtd: 1 });
    }

    salvarCarrinho();
    showAlert("Produto adicionado ao carrinho!");
    exibirCarrinho(); // atualiza se estiver na página de carrinho
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(p => p.id != id);
    salvarCarrinho();
    exibirCarrinho();
    showAlert("Item removido do carrinho.", "sucesso");
}

function exibirCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalContainer = document.getElementById("total-carrinho");
    if (!container || !totalContainer) return;

    if (carrinho.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
        totalContainer.textContent = "Total: R$ 0,00";
        return;
    }

    container.innerHTML = carrinho
        .map(
            (p) => `
            <div class="item-carrinho">
                <span>${p.nome}</span>
                <span>Qtd: ${p.qtd}</span>
                <span>R$ ${(p.preco * p.qtd).toFixed(2).replace(".", ",")}</span>
                <button class="remover-item btn-remover" data-id="${p.id}">Remover</button>
            </div>`
        )
        .join("");

    const total = carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0);
    totalContainer.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
}

// usado na página de carrinho para ir ao pagamento
function irParaPagamento() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
        showAlert("Você precisa estar logado para finalizar a compra.", "erro");
        const base = location.pathname.includes("/pages/") ? "" : "pages/";
        window.location.href = base + "login.html";
        return;
    }

    if (!carrinho.length) {
        showAlert("Seu carrinho está vazio.", "erro");
        return;
    }

    const base = location.pathname.includes("/pages/") ? "" : "pages/";
    window.location.href = base + "pagamento.html";
}

// ========================
// LOGIN / CADASTRO
// ========================
function login(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value.trim();

    const base = location.pathname.includes("/pages/") ? "" : "pages/";

    // Login de administrador
    if (email === ADMIN_EMAIL && senha === ADMIN_PASSWORD) {
        usuarioLogado = {
            nome: "Administrador",
            email,
            isAdmin: true
        };
        localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
        window.location.href = base + "admin.html";
        return;
    }

    const usuarioCadastrado = JSON.parse(localStorage.getItem("usuarioCadastrado"));

    if (!usuarioCadastrado || usuarioCadastrado.email !== email || usuarioCadastrado.senha !== senha) {
        showAlert("E-mail ou senha inválidos.", "erro");
        return;
    }

    usuarioLogado = {
        nome: usuarioCadastrado.nome,
        email: usuarioCadastrado.email,
        isAdmin: false
    };
    localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
    showAlert("Login realizado com sucesso!");
    setTimeout(() => {
        window.location.href = base + "index.html";
    }, 800);
}

function cadastro(event) {
    event.preventDefault();
    const nome = document.getElementById("cadastroNome").value.trim();
    const email = document.getElementById("cadastroEmail").value.trim();
    const senha = document.getElementById("cadastroSenha").value.trim();

    if (!nome || !email || !senha) {
        showAlert("Preencha todos os campos.", "erro");
        return;
    }

    localStorage.setItem(
        "usuarioCadastrado",
        JSON.stringify({ nome, email, senha, isAdmin: false })
    );

    showAlert("Cadastro realizado com sucesso! Faça login.");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

function logout() {
    localStorage.removeItem("usuario");
    usuarioLogado = null;

    const base = location.pathname.includes("/pages/") ? "../" : "";
    showAlert("Sessão encerrada.");
    setTimeout(() => {
        window.location.href = base + "index.html";
    }, 600);
}

// Recuperar senha (simulado)
function recuperarSenha() {
    const usuario = JSON.parse(localStorage.getItem("usuarioCadastrado"));
    if (!usuario) {
        showAlert("Nenhum cadastro encontrado.", "erro");
        return;
    }

    showAlert(`Enviamos um link de recuperação para: ${usuario.email}`);
}

// ========================
// LOGIN COM GOOGLE (GIS)
// ========================
/* Esta função é chamada pelo script do Google (login com Gmail).
   Substitua o CLIENT_ID no HTML de login. */
function handleGoogleCredentialResponse(response) {
    try {
        const partes = response.credential.split(".");
        const payload = JSON.parse(atob(partes[1]));

        const email = payload.email;
        const nome = payload.name || "Usuário Google";

        usuarioLogado = {
            nome,
            email,
            isAdmin: email === ADMIN_EMAIL
        };

        localStorage.setItem("usuario", JSON.stringify(usuarioLogado));

        const base = location.pathname.includes("/pages/") ? "" : "pages/";
        showAlert("Login com Google realizado!");
        setTimeout(() => {
            window.location.href = base + "index.html";
        }, 800);
    } catch (e) {
        console.error(e);
        showAlert("Erro ao processar login com Google.", "erro");
    }
}

// ========================
// PAGAMENTO (SIMULADO)
// ========================
function finalizarPagamento(event) {
    event.preventDefault();

    if (!carrinho.length) {
        showAlert("Seu carrinho está vazio.", "erro");
        return;
    }

    const numeroCartao = document.getElementById("numeroCartao").value;
    const nome = document.getElementById("nomeCartao").value;
    const validade = document.getElementById("validadeCartao").value;
    const cvv = document.getElementById("cvvCartao").value;

    if (!numeroCartao || !nome || !validade || !cvv) {
        showAlert("Preencha todos os campos do pagamento.", "erro");
        return;
    }

    const aprovado = Math.random() > 0.2; // 80% de chance de aprovação
    if (!aprovado) {
        showAlert("Pagamento recusado. Verifique os dados e tente novamente.", "erro");
        return;
    }

    // Atualiza estoque (simulado via localStorage)
    let produtosSalvos = JSON.parse(localStorage.getItem("produtosAdmin"));
    if (!Array.isArray(produtosSalvos) || !produtosSalvos.length) {
        produtosSalvos = [...produtos];
    }

    carrinho.forEach(item => {
        const prod = produtosSalvos.find(p => p.id === item.id);
        if (prod && typeof prod.estoque === "number") {
            prod.estoque = Math.max(0, prod.estoque - item.qtd);
        }
    });

    localStorage.setItem("produtosAdmin", JSON.stringify(produtosSalvos));

    // Limpa carrinho
    carrinho = [];
    salvarCarrinho();

    showAlert("Pagamento aprovado! Pedido confirmado.");
    setTimeout(() => {
        const base = location.pathname.includes("/pages/") ? "" : "pages/";
        window.location.href = base + "confirmacao.html";
    }, 1200);
}

// ========================
// INICIALIZAÇÃO
// ========================
document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();

    if (document.getElementById("itens-carrinho")) {
        exibirCarrinho();
    }
});
