

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let usuarioLogado = JSON.parse(localStorage.getItem("usuario")) || null;

let freteAtual = 0;


function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function showAlert(mensagem, tipo = "sucesso") {
    const alerta = document.getElementById("alerta-msg");
    if (!alerta) {
        alert(mensagem);
        return;
    }

    alerta.textContent = mensagem;
    alerta.className = "alerta-popup " + tipo;
    alerta.classList.add("show");

    setTimeout(() => alerta.classList.remove("show"), 3000);
}

function mostrarMensagem(mensagem, tipo = "sucesso") {
    showAlert(mensagem, tipo);
}

function getCaminhoProdutosJson() {
    return location.pathname.includes("/pages/")
        ? "../data/produtos.json"
        : "data/produtos.json";
}

// Função para resolver caminho de imagens
function resolverCaminhoImagem(caminho) {
    if (caminho.startsWith("http")) return caminho;
    
    // Se estamos em uma página dentro de /pages/, ajusta o caminho
    if (location.pathname.includes("/pages/")) {
        return caminho.startsWith("../") ? caminho : "../" + caminho;
    }
    
    return caminho;
}

// Formata valor numérico para moeda brasileira
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}


async function carregarProdutos() {
    try {
        const res = await fetch(getCaminhoProdutosJson());
        const baseProdutos = await res.json();

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
    } catch (e) {
        console.error(e);
        showAlert("Erro ao carregar produtos.", "erro");
    }
}

function criarCard(produto) {
    const caminhoImagem = resolverCaminhoImagem(produto.imagem);
    
    return `
    <div class="card-produto" data-categoria="${produto.categoria || ''}">
        <img src="${caminhoImagem}" alt="${produto.nome}" class="produto-img">

        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${produto.preco.toFixed(2).replace(".", ",")}</p>

        <a href="${location.pathname.includes("/pages/") ? "" : "pages/"}produto.html?id=${produto.id}" class="btn-ver btn-secundario">
            Ver Produto
        </a>

        <button class="btn-add btn-destaque" onclick="adicionarAoCarrinho(${produto.id})">
            Adicionar ao Carrinho
        </button>
    </div>
    `;
}

function verProduto(id) {
    const prefixo = location.pathname.includes("/pages/") ? "" : "pages/";
    window.location.href = `${prefixo}produto.html?id=${id}`;
}

function carregarDestaques() {
    const container = document.getElementById("produtos-destaque");
    if (!container) return;
    container.innerHTML = produtos.filter(p => p.destaque).map(criarCard).join("");
}

function carregarNovidades() {
    const container = document.getElementById("produtos-novos");
    if (!container) return;
    container.innerHTML = produtos.filter(p => p.novo).map(criarCard).join("");
}

function carregarCatalogo() {
    const container = document.getElementById("lista-produtos");
    if (!container) return;
    container.innerHTML = produtos.map(criarCard).join("");
}

function inicializarFiltrosCatalogo() {
    const buscaInput = document.getElementById("busca");
    const selectCategoria = document.getElementById("filtroCategoria");
    if (!buscaInput || !selectCategoria) return;

    function aplicarFiltro() {
        const termo = buscaInput.value.toLowerCase();
        const categoria = selectCategoria.value.toLowerCase();
        const cards = document.querySelectorAll(".card-produto");

        cards.forEach(card => {
            const nome = card.querySelector("h3").textContent.toLowerCase();
            const catCard = (card.dataset.categoria || "").toLowerCase();

            const combinaNome = nome.includes(termo);
            const combinaCategoria = !categoria || catCard === categoria;

            card.style.display = (combinaNome && combinaCategoria) ? "block" : "none";
        });
    }

    buscaInput.addEventListener("input", aplicarFiltro);
    selectCategoria.addEventListener("change", aplicarFiltro);
}

function carregarDetalheProduto() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    if (!id) return;

    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    const caminhoImagem = resolverCaminhoImagem(produto.imagem);

    const container = document.getElementById("produto-detalhe");
    container.innerHTML = `
        <div id="detalhe-produto">
            <img src="${caminhoImagem}" alt="${produto.nome}" class="img-produto">

            <div class="info-produto">
                <h2>${produto.nome}</h2>
                <p class="preco">R$ ${Number(produto.preco).toFixed(2).replace(".", ",")}</p>
                <p class="estoque">
                    Estoque disponível: ${typeof produto.estoque === "number" ? produto.estoque : "Consultar"}
                </p>

                <h3>Descrição</h3>
                <p>
                    ${produto.descricao || "Instrumento de alta qualidade, excelente para quem busca um som equilibrado e acabamento profissional."}
                </p>

                <button class="btn-destaque" id="btnAddDetalhe">
                    Adicionar ao Carrinho
                </button>
            </div>
        </div>
    `;

    document.getElementById("btnAddDetalhe")
        .addEventListener("click", () => adicionarAoCarrinho(produto.id));
}

function adicionarAoCarrinho(id) {
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) {
        showAlert("Produto não encontrado.", "erro");
        return;
    }

    // Verifica estoque
    if (produto.estoque !== undefined && produto.estoque <= 0) {
        showAlert("Produto sem estoque disponível.", "erro");
        return;
    }

    const itemExistente = carrinho.find(p => p.id === id);

    if (itemExistente) {
        // Verifica se há estoque suficiente
        if (produto.estoque !== undefined && itemExistente.qtd >= produto.estoque) {
            showAlert("Quantidade máxima em estoque atingida.", "erro");
            return;
        }
        itemExistente.qtd += 1;
    } else {
        carrinho.push({
            ...produto,
            qtd: 1
        });
    }

    salvarCarrinho();
    showAlert("Produto adicionado ao carrinho!", "sucesso");
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(p => p.id !== id);
    salvarCarrinho();
    exibirCarrinho();
    showAlert("Produto removido do carrinho.", "sucesso");
}

function exibirCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalContainer = document.getElementById("total-carrinho");
    if (!container || !totalContainer) return;

    if (!carrinho.length) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
        totalContainer.textContent = "Total: R$ 0,00";
        return;
    }

    container.innerHTML = carrinho.map(p => {
        const caminhoImagem = resolverCaminhoImagem(p.imagem);
        return `
        <div class="item-carrinho">
            <img src="${caminhoImagem}" alt="${p.nome}">
            <div class="info-carrinho">
                <h3>${p.nome}</h3>
                <p>Quantidade: ${p.qtd}</p>
                <p class="preco">R$ ${(p.preco * p.qtd).toFixed(2).replace(".", ",")}</p>
            </div>
            <button class="btn-remover" onclick="removerDoCarrinho(${p.id})">Remover</button>
        </div>
    `}).join("");

    const total = carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0);
    totalContainer.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
}

function irParaPagamento() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
        showAlert("Você precisa estar logado para finalizar a compra.", "erro");
        window.location.href = "login.html";
        return;
    }

    if (!carrinho.length) {
        showAlert("Seu carrinho está vazio.", "erro");
        return;
    }

    window.location.href = "pagamento.html";
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

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert("Digite um e-mail válido.", "erro");
        return;
    }

    // Validação de senha
    if (senha.length < 6) {
        showAlert("A senha deve ter no mínimo 6 caracteres.", "erro");
        return;
    }

    const usuario = { nome, email, senha, isAdmin: false };
    localStorage.setItem("usuarioCadastrado", JSON.stringify(usuario));

    showAlert("Cadastro realizado com sucesso!");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    // Verifica se é o admin hardcoded
    if (email === "admin@admin.com" && senha === "admin") {
        const adminUser = { nome: "Administrador", email: "admin", senha: "admin", isAdmin: true };
        localStorage.setItem("usuario", JSON.stringify(adminUser));
        showAlert("Login realizado com sucesso!");
        
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 800);
        return;
    }

    // Verifica usuários cadastrados normalmente
    const usuario = JSON.parse(localStorage.getItem("usuarioCadastrado"));

    if (!usuario || usuario.email !== email || usuario.senha !== senha) {
        showAlert("E-mail ou senha incorretos.", "erro");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify(usuario));
    showAlert("Login realizado com sucesso!");

    setTimeout(() => {
        window.location.href = "../index.html";
    }, 800);
}

function logout() {
    localStorage.removeItem("usuario");
    showAlert("Sessão encerrada.");
    setTimeout(() => {
        if (location.pathname.includes("/pages/")) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "index.html";
        }
    }, 600);
}

function recuperarSenha() {
    const usuario = JSON.parse(localStorage.getItem("usuarioCadastrado"));
    if (!usuario) {
        showAlert("Nenhum cadastro encontrado.", "erro");
        return;
    }
    showAlert(`Enviamos um link de recuperação para: ${usuario.email}`);
}

function handleGoogleCredentialResponse(response) {
    try {
        const partes = response.credential.split(".");
        const payload = JSON.parse(atob(partes[1]));

        const email = payload.email;
        const nome = payload.name || "Usuário Google";

        const usuario = {
            nome,
            email,
            senha: "",
            isAdmin: false
        };

        localStorage.setItem("usuario", JSON.stringify(usuario));
        showAlert("Login com Google realizado!");

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 800);
    } catch (e) {
        console.error(e);
        showAlert("Erro ao processar login com Google.", "erro");
    }
}


async function buscarCEP() {
    const cepInput = document.getElementById("cep");
    if (!cepInput) return;

    let cep = cepInput.value.replace(/\D/g, "");
    if (cep.length !== 8) {
        // Simulação de preenchimento de endereço se o CEP for inválido (para fins de teste)
        document.getElementById("logradouro").value = 'Rua dos Instrumentos, 123';
        document.getElementById("bairro").value = 'Centro Musical';
        document.getElementById("cidade").value = 'São Paulo';
        document.getElementById("uf").value = 'SP';
        showAlert("CEP inválido. Preenchendo com endereço de teste.", "erro");
        return;
    }

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await res.json();

        if (dados.erro) {
            showAlert("CEP não encontrado.", "erro");
            return;
        }

        document.getElementById("logradouro").value = dados.logradouro || "";
        document.getElementById("bairro").value = dados.bairro || "";
        document.getElementById("cidade").value = dados.localidade || "";
        document.getElementById("uf").value = dados.uf || "";

        showAlert("Endereço preenchido pelo CEP.");
    } catch (e) {
        console.error(e);
        showAlert("Erro ao buscar CEP.", "erro");
    }
}



function finalizarPagamento(event) {
    event.preventDefault();

    if (!carrinho.length) {
        showAlert("Seu carrinho está vazio.", "erro");
        return;
    }

    const forma = document.getElementById("formaPagamento").value;
    const tipoFrete = document.getElementById("tipoFrete").value;

    if (!forma || !tipoFrete) {
        showAlert("Por favor, preencha todos os campos obrigatórios (Forma de Pagamento e Frete).", "erro");
        return;
    }

    if (forma === "cartao") {
        const numero = document.getElementById("numeroCartao").value;
        const nome = document.getElementById("nomeCartao").value;
        const val = document.getElementById("validadeCartao").value;
        const cvv = document.getElementById("cvvCartao").value;
        if (!numero || !nome || !val || !cvv) {
            showAlert("Preencha todos os dados do cartão.", "erro");
            return;
        }
    }

    // Simulação de processamento de pagamento
    const aprovado = Math.random() > 0.2;
    if (!aprovado) {
        showAlert("Pagamento recusado. Tente novamente.", "erro");
        return;
    }

    // Se aprovado, salva os dados do pedido
    const dadosPedido = {
        produtos: carrinho.map(p => ({ nome: p.nome, qtd: p.qtd, preco: p.preco })),
        endereco: {
            cep: document.getElementById("cep").value,
            logradouro: document.getElementById("logradouro").value,
            bairro: document.getElementById("bairro").value,
            cidade: document.getElementById("cidade").value,
            uf: document.getElementById("uf").value
        },
        pagamento: {
            forma: forma
        },
        frete: {
            tipo: tipoFrete
        },
        valores: {
            subtotal: carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0),
            frete: tipoFrete === 'normal' ? 35.00 : tipoFrete === 'expresso' ? 75.00 : 0,
            total: carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0) + (tipoFrete === 'normal' ? 35.00 : tipoFrete === 'expresso' ? 75.00 : 0)
        }
    };
    
    localStorage.setItem('dadosPedido', JSON.stringify(dadosPedido));
    
    showAlert("Pagamento aprovado! Pedido confirmado.");
    
    // Limpar carrinho e redirecionar após um pequeno delay
    setTimeout(() => {
        carrinho = [];
        salvarCarrinho();
        window.location.href = "confirmacao.html";
    }, 1200);
}

// Função para popular o resumo do pedido na página de pagamento
function popularResumoPedido() {
    const resumoItensDiv = document.getElementById('resumo-itens');
    const resumoSubtotalSpan = document.getElementById('resumo-subtotal');
    const resumoTotalFinalSpan = document.getElementById('resumo-total-final');
    const resumoFreteSpan = document.getElementById('resumo-frete');
    
    if (!resumoItensDiv || !resumoSubtotalSpan) return;

    resumoItensDiv.innerHTML = '';
    let subtotal = 0;

    if (carrinho.length === 0) {
        resumoItensDiv.innerHTML = '<p class="resumo-vazio">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach(item => {
            const itemTotal = item.preco * item.qtd;
            subtotal += itemTotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('resumo-item');
            itemDiv.innerHTML = `
                <span class="resumo-item-nome">${item.nome} (x${item.qtd})</span>
                <span class="resumo-item-preco">${formatarMoeda(itemTotal)}</span>
            `;
            resumoItensDiv.appendChild(itemDiv);
        });
    }

    resumoSubtotalSpan.textContent = formatarMoeda(subtotal);
    
    // Inicializa o frete e total final com o subtotal
    resumoFreteSpan.textContent = formatarMoeda(0);
    resumoTotalFinalSpan.textContent = formatarMoeda(subtotal);
    
    // Atualiza o resumo do frete no formulário
    const freteResumoForm = document.querySelector('.pagamento-frete-resumo .valor-frete');
    const totalResumoForm = document.querySelector('.pagamento-frete-resumo .valor-total');
    if (freteResumoForm) freteResumoForm.textContent = formatarMoeda(0);
    if (totalResumoForm) totalResumoForm.textContent = formatarMoeda(subtotal);
}

// Função para calcular o frete e atualizar os totais
function calcularFrete() {
    const tipoFrete = document.getElementById('tipoFrete').value;
    const resumoSubtotalSpan = document.getElementById('resumo-subtotal');
    const resumoTotalFinalSpan = document.getElementById('resumo-total-final');
    const resumoFreteSpan = document.getElementById('resumo-frete');
    
    let frete = 0;
    const subtotal = carrinho.reduce((acc, p) => acc + p.preco * p.qtd, 0);

    if (tipoFrete === 'normal') {
        frete = 35.00;
    } else if (tipoFrete === 'expresso') {
        frete = 75.00;
    }

    const totalFinal = subtotal + frete;

    // Atualiza o resumo do pedido
    if (resumoFreteSpan) resumoFreteSpan.textContent = formatarMoeda(frete);
    if (resumoTotalFinalSpan) resumoTotalFinalSpan.textContent = formatarMoeda(totalFinal);

    // Atualiza o resumo do frete no formulário
    const freteResumoForm = document.querySelector('.pagamento-frete-resumo .valor-frete');
    const totalResumoForm = document.querySelector('.pagamento-frete-resumo .valor-total');
    if (freteResumoForm) freteResumoForm.textContent = formatarMoeda(frete);
    if (totalResumoForm) totalResumoForm.textContent = formatarMoeda(totalFinal);
}

// Função para exibir/ocultar campos de pagamento
function toggleCamposPagamento() {
    const formaPagamento = document.getElementById('formaPagamento');
    const dadosCartaoDiv = document.getElementById('dados-cartao');
    const instrucoesPixDiv = document.getElementById('instrucoes-pix');
    const instrucoesBoletoDiv = document.getElementById('instrucoes-boleto');
    
    if (!formaPagamento || !dadosCartaoDiv || !instrucoesPixDiv || !instrucoesBoletoDiv) return;

    // Oculta todos os containers primeiro
    dadosCartaoDiv.style.display = 'none';
    instrucoesPixDiv.style.display = 'none';
    instrucoesBoletoDiv.style.display = 'none';

    // Remove o atributo required de todos os campos de cartão
    dadosCartaoDiv.querySelectorAll('input').forEach(input => input.removeAttribute('required'));

    // Exibe o container correto e adiciona required se for cartão
    switch (formaPagamento.value) {
        case 'cartao':
            dadosCartaoDiv.style.display = 'block';
            dadosCartaoDiv.querySelectorAll('input').forEach(input => input.setAttribute('required', ''));
            break;
        case 'pix':
            instrucoesPixDiv.style.display = 'block';
            break;
        case 'boleto':
            instrucoesBoletoDiv.style.display = 'block';
            break;
    }
}

// Função de simulação para gerar boleto
function gerarBoleto() {
    showAlert('Boleto gerado com sucesso! (Simulação)', 'sucesso');
    // Aqui seria a lógica real para gerar e abrir o PDF do boleto
}

// Adicionar event listener para a forma de pagamento
document.addEventListener('DOMContentLoaded', () => {
    // Se estiver na página de pagamento, popular o resumo e adicionar listeners
    if (window.location.pathname.includes('pagamento.html')) {
        popularResumoPedido();
        const formaPagamento = document.getElementById('formaPagamento');
        const tipoFrete = document.getElementById('tipoFrete');
        
        if (formaPagamento) formaPagamento.addEventListener('change', toggleCamposPagamento);
        if (tipoFrete) tipoFrete.addEventListener('change', calcularFrete);
        
        toggleCamposPagamento(); // Inicializa o estado dos campos de pagamento
        calcularFrete(); // Inicializa o cálculo do frete
    }
});


document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();

    if (document.getElementById("itens-carrinho")) {
        exibirCarrinho();
    }
    
   
});


function atualizarNavbarAuth() {
    const btnAuth = document.getElementById("btn-auth");
    const btnAdmin = document.getElementById("btn-admin");
    
    // Verifica se o usuário está logado
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    
    if (btnAuth) {
        if (usuario) {
            // Usuário logado: mostra "Sair"
            btnAuth.textContent = "Sair";
            btnAuth.href = "#";
            btnAuth.onclick = function(e) {
                e.preventDefault();
                logout();
            };
        } else {
            // Usuário não logado: mostra "Entrar"
            btnAuth.textContent = "Entrar";
            
            // Define o caminho correto baseado na localização da página
            if (location.pathname.includes("/pages/")) {
                btnAuth.href = "login.html";
            } else {
                btnAuth.href = "pages/login.html";
            }
            
            btnAuth.onclick = null;
        }
    }
    
    // Controla a visibilidade do botão Admin
    if (btnAdmin) {
        if (usuario && usuario.isAdmin) {
            // Mostra o botão Admin apenas para administradores
            btnAdmin.style.display = "inline";
        } else {
            // Oculta o botão Admin para usuários comuns
            btnAdmin.style.display = "none";
        }
    }
}

// Chama a função ao carregar a página
document.addEventListener("DOMContentLoaded", atualizarNavbarAuth);
