document.addEventListener('DOMContentLoaded', function() {
    const produtosLista = document.getElementById('produtos-lista');
    const pagination = document.getElementById('pagination');
    const applyFiltersButton = document.getElementById('apply-filters');
    const removeFiltersButton = document.getElementById('remove-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const anuncioContainer = document.getElementById('anuncio-container');

    let currentPage = 1;
    const produtosPorPagina = 50;
    let totalPages = 1;
    let todosProdutos = [];
    let filtrosAtuais = {};

    const categoriasAPI = [
        { category_id: 'MLB263532', seller_id: '178701040' },
        { category_id: 'MLB2527', seller_id: '178701040' },
        { category_id: 'MLB2528', seller_id: '178701040' },
        { category_id: 'MLB5550', seller_id: '178701040' },
        { category_id: 'MLB269932', seller_id: '178701040' },
        { category_id: 'MLB439064', seller_id: '178701040' }
    ];

    async function carregarProdutos(page = 1) {
        try {
            const produtosJSON = await fetch('./produtosfinais.json').then(res => res.json());
            todosProdutos = [...produtosJSON.results];

            for (const categoria of categoriasAPI) {
                const apiUrl = `https://api.mercadolibre.com/sites/MLB/search?category=${categoria.category_id}&seller_id=${categoria.seller_id}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                todosProdutos = [...todosProdutos, ...data.results];
            }

            const produtosFiltrados = aplicarFiltros(todosProdutos);
            totalPages = Math.ceil(produtosFiltrados.length / produtosPorPagina);
            const produtosPagina = produtosFiltrados.slice((page - 1) * produtosPorPagina, page * produtosPorPagina);

            if (produtosPagina.length > 0) {
                exibirProdutos(produtosPagina);
                gerarPaginacao();
            } else {
                produtosLista.innerHTML = '<p>Nenhum produto encontrado.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            produtosLista.innerHTML = '<p>Erro ao carregar os produtos. Tente novamente mais tarde.</p>';
        }
    }

    function aplicarFiltros(produtos) {
        return produtos.filter(produto => {
            let condicaoPreco = true;
            let condicaoBusca = true;

            if (filtrosAtuais.price) {
                if (filtrosAtuais.price === '3500-INF') {
                    condicaoPreco = produto.price >= 3500;
                } else {
                    const [min, max] = filtrosAtuais.price.split('-').map(Number);
                    condicaoPreco = produto.price >= min && produto.price <= max;
                }
            }

            if (filtrosAtuais.query) {
                const query = filtrosAtuais.query.toLowerCase();
                condicaoBusca = produto.title.toLowerCase().includes(query);
            }

            return condicaoPreco && condicaoBusca;
        });
    }

    function exibirProdutos(produtos) {
        produtosLista.innerHTML = '';
        produtos.forEach(produto => {
            const produtoElement = document.createElement('div');
            produtoElement.classList.add('produto', 'col-md-4');
            
            const imgUrl = produto.thumbnail.replace('I.jpg', 'B.jpg');

            produtoElement.innerHTML = `
                <img loading="lazy" src="${imgUrl}" alt="${produto.title}">
                <h3>${produto.title}</h3>
                <p>${produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <a href="${produto.permalink}" class="btn btn-primary" target="_blank">Comprar pelo Mercado Livre e Shops</a>
            `;
            produtosLista.appendChild(produtoElement);
        });
    }

    function gerarPaginacao() {
        pagination.innerHTML = '';
        let paginationHTML = '';

        const inicioPagina = Math.max(1, currentPage - 4);
        const fimPagina = Math.min(totalPages, currentPage + 5);

        for (let i = inicioPagina; i <= fimPagina; i++) {
            paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                                    <a class="page-link" href="#">${i}</a></li>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<li class="page-item">
                                    <a class="page-link" href="#">Seguinte</a>
                               </li>`;
        }

        pagination.innerHTML = paginationHTML;

        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const selectedPage = parseInt(this.innerText);

                currentPage = isNaN(selectedPage) ? Math.min(totalPages, currentPage + 1) : selectedPage;

                carregarProdutos(currentPage);
            });
        });
    }

    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            const selectedPrice = document.querySelector('input[name="price"]:checked');
            filtrosAtuais.price = selectedPrice ? selectedPrice.value : "";
            currentPage = 1;
            carregarProdutos(currentPage);
        });
    }

    if (removeFiltersButton) {
        removeFiltersButton.addEventListener('click', function() {
            filtrosAtuais = {};
            currentPage = 1;
            document.querySelectorAll('input[name="price"]').forEach(input => { input.checked = false; });
            carregarProdutos(currentPage);
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            filtrosAtuais.query = searchInput.value.trim();
            currentPage = 1;
            carregarProdutos(currentPage);
        });
    }

    async function carregarAnunciosDestaque() {
        try {
            const response = await fetch('./produtosfinais.json');
            if (!response.ok) throw new Error('Erro ao carregar o arquivo produtosfinais.json');

            const produtos = await response.json();
            function exibirAnuncios() {
                anuncioContainer.innerHTML = '';
                const produtosAleatorios = produtos.results.sort(() => 0.5 - Math.random()).slice(0, 2);

                produtosAleatorios.forEach(produto => {
                    const anuncioDiv = document.createElement('div');
                    anuncioDiv.classList.add('anuncio');

                    anuncioDiv.innerHTML = `
                        <img src="${produto.thumbnail}" alt="${produto.title}">
                        <h6>${produto.title}</h6>
                        <p>R$ ${produto.price.toFixed(2)}</p>
                        <a href="${produto.permalink}" class="btn btn-primary btn-sm" target="_blank">Ver Mais</a>
                    `;
                    anuncioContainer.appendChild(anuncioDiv);
                });
            }

            exibirAnuncios();
            setInterval(exibirAnuncios, 5 * 60 * 1000);
        } catch (error) {
            console.error('Erro ao carregar anúncios:', error);
            anuncioContainer.innerHTML = '<p>Erro ao carregar os anúncios em destaque. Tente novamente mais tarde.</p>';
        }
    }

    carregarProdutos();
    carregarAnunciosDestaque();
});
