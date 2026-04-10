const Pages = (() => {

    function login() {
        const loginForm = document.getElementById('loginForm');
        
        // garante que o formulário existe na tela antes de adicionar o evento
        if (!loginForm) {
            return;
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usuario = document.getElementById('usuario').value;
            const senha = document.getElementById('senha').value;

            try {
                const response = await fetch('http://localhost:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ usuario: usuario, senha: senha })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    Auth.setToken(data.access_token)
                    Topbar.refresh();
                    CardActions.refresh()

                    Router.navigate('/visualizar'); 
                } else {
                    alert('Usuario ou senha incorretos!');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }


    function anunciar() {
        const dataInput = document.getElementById("dataEncontro");

        // se não estiver na página, sai
        if (!dataInput) {
            return;
        }

        // auto preencher data
        const hoje = new Date().toISOString().split("T")[0];
        dataInput.value = hoje;
    }

    function visualizar() {

        function initItemsPage(items = []) {
            const grid        = document.getElementById('items-grid');
            const countEl     = document.getElementById('items-count');
            const lightbox    = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lbClose     = document.getElementById('lightbox-close');
            const filterBtns    = document.querySelectorAll('.filter-btn');
            const categoryBtns  = document.querySelectorAll('.category-btn');

            let currentFilter   = 'all';
            let currentCategory = 'all';

            /* ─── Utilitários ─── */

            function formatDate(dateStr) {
                if (!dateStr) return '';
                const d = new Date(dateStr + 'T00:00:00');
                return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            function escHtml(str) {
                const d = document.createElement('div');
                d.textContent = str;
                return d.innerHTML;
            }

            /* ─── Carrossel ─── */

            function buildCarousel(images, itemId) {
                if (!images || images.length === 0) {
                    return `
                        <div class="carousel">
                            <div class="carousel__placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="M21 15l-5-5L5 21"/>
                                </svg>
                                <span>Sem imagem</span>
                            </div>
                        </div>`;
                }

                const slides = images.map((src, i) => `
                    <div class="carousel__slide" data-index="${i}" data-src="${escHtml(src)}" role="button" tabindex="0" aria-label="Expandir imagem ${i + 1}">
                        <img src="${escHtml(src)}" alt="Foto ${i + 1}" loading="lazy">
                    </div>`).join('');

                const dots = images.length > 1
                    ? `<div class="carousel__dots" role="tablist">
                           ${images.map((_, i) => `<button class="carousel__dot${i === 0 ? ' active' : ''}" role="tab" aria-label="Imagem ${i + 1}" data-dot="${i}"></button>`).join('')}
                       </div>`
                    : '';

                const nav = images.length > 1
                    ? `<button class="carousel__btn carousel__btn--prev" aria-label="Anterior">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                       </button>
                       <button class="carousel__btn carousel__btn--next" aria-label="Próxima">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
                       </button>`
                    : '';

                const counter = images.length > 1
                    ? `<span class="carousel__counter">1 / ${images.length}</span>`
                    : '';

                return `
                    <div class="carousel" id="carousel-${itemId}" data-current="0" data-total="${images.length}">
                        <div class="carousel__track">${slides}</div>
                        ${nav}
                        ${dots}
                        ${counter}
                    </div>`;
            }

            function bindCarousel(carouselEl) {
                const track   = carouselEl.querySelector('.carousel__track');
                const prevBtn = carouselEl.querySelector('.carousel__btn--prev');
                const nextBtn = carouselEl.querySelector('.carousel__btn--next');
                const dotsEl  = carouselEl.querySelectorAll('.carousel__dot');
                const counter = carouselEl.querySelector('.carousel__counter');
                const total   = parseInt(carouselEl.dataset.total, 10);

                function goTo(index) {
                    carouselEl.dataset.current = index;
                    track.style.transform = `translateX(-${index * 100}%)`;
                    dotsEl.forEach((d, i) => d.classList.toggle('active', i === index));
                    if (counter) counter.textContent = `${index + 1} / ${total}`;
                    if (prevBtn) prevBtn.disabled = index === 0;
                    if (nextBtn) nextBtn.disabled = index === total - 1;
                }

                if (prevBtn) prevBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const cur = parseInt(carouselEl.dataset.current, 10);
                    if (cur > 0) goTo(cur - 1);
                });

                if (nextBtn) nextBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const cur = parseInt(carouselEl.dataset.current, 10);
                    if (cur < total - 1) goTo(cur + 1);
                });

                dotsEl.forEach(dot => dot.addEventListener('click', e => {
                    e.stopPropagation();
                    goTo(parseInt(dot.dataset.dot, 10));
                }));

                // Swipe
                let startX = null;
                track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
                track.addEventListener('touchend', e => {
                    if (startX === null) {
                        return;
                    }
                    const delta = startX - e.changedTouches[0].clientX;
                    const cur = parseInt(carouselEl.dataset.current, 10);
                    if (Math.abs(delta) > 40) {
                        if (delta > 0 && cur < total - 1) goTo(cur + 1);
                        if (delta < 0 && cur > 0)         goTo(cur - 1);
                    }
                    startX = null;
                }, { passive: true });

                // Estado inicial dos botões
                if (prevBtn) prevBtn.disabled = true;
                if (nextBtn && total <= 1) nextBtn.disabled = true;

                // Click em slide → lightbox
                carouselEl.querySelectorAll('.carousel__slide').forEach(slide => {
                    const open = () => openLightbox(slide.dataset.src);
                    slide.addEventListener('click', open);
                    slide.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
                });
            }

            /* ─── Lightbox ─── */

            function openLightbox(src) {
                lightboxImg.src = src;
                lightbox.classList.add('open');
                document.body.style.overflow = 'hidden';
                lbClose.focus();
            }

            function closeLightbox() {
                lightbox.classList.remove('open');
                document.body.style.overflow = '';
                lightboxImg.src = '';
            }

            lbClose.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

            /* ─── Renderização ─── */

            const CATEGORY_LABELS = {
                acessorio:  { label: 'Acessório',      icon: '👜' },
                eletronico: { label: 'Eletrônico',     icon: '📱' },
                documento:  { label: 'Documento',      icon: '📄' },
                roupa:      { label: 'Roupa/Calçado',  icon: '👕' },
                outros:     { label: 'Outros',         icon: '📦' },
            };

            function renderCard(item) {
                const statusLabel = item.status === 1 ? 'Devolvido' : 'Perdido';
                const statusClass = item.status === 1 ? 'found' : 'lost';
                const cat = item.category && CATEGORY_LABELS[item.category]
                    ? CATEGORY_LABELS[item.category]
                    : null;

                const adminActions = item.status === 1 // ← só isso, sem a linha do authed
                    ? CardActions.render(item.id, { hideReturn: true })
                    : CardActions.render(item.id); 

                return `
                    <article class="item-card" role="listitem" data-status="${item.status}" data-id="${item.id}">
                        <div style="position:relative">
                            <span class="item-card__badge item-card__badge--${statusClass}">${statusLabel}</span>
                            ${buildCarousel(item.images, item.id)}
                        </div>
                        <div class="item-card__body">
                            ${cat ? `<span class="item-card__category">${cat.icon} ${cat.label}</span>` : ''}
                            <h3 class="item-card__title">${escHtml(item.title)}</h3>
                            <p  class="item-card__desc">${escHtml(item.desc)}</p>
                            <div class="item-card__meta">
                                <span class="item-card__date">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                                        <line x1="3"  y1="10" x2="21" y2="10"/>
                                    </svg>
                                    ${formatDate(item.date)}
                                </span>
                            </div>
                            ${adminActions}
                        </div>
                    </article>`;
            }

            function renderEmpty() {
                return `
                    <div class="items-empty">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <strong>Nenhum item encontrado</strong>
                        <p>Tente outro filtro ou volte mais tarde.</p>
                    </div>`;
            }

            function applyFilters() {
                let filtered = [...items];

                // currentFilter: 'all' | 0 (perdido) | 1 (devolvido)
                if (currentFilter !== 'all')
                    filtered = filtered.filter(i => i.status === currentFilter);

                if (currentCategory !== 'all')
                    filtered = filtered.filter(i => i.category === currentCategory);

                // Na visualização "Todos": perdidos (0) primeiro, devolvidos (1) depois
                if (currentFilter === 'all') {
                    filtered.sort((a, b) => a.status - b.status);
                }

                countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;

                if (filtered.length === 0) {
                    grid.innerHTML = renderEmpty();
                    return;
                }

                grid.innerHTML = filtered.map(renderCard).join('');

                // Animação escalonada
                grid.querySelectorAll('.item-card').forEach((card, i) => {
                    card.style.animationDelay = `${i * 60}ms`;
                });

                // Bind carrosséis
                grid.querySelectorAll('.carousel').forEach(bindCarousel);

                CardActions.bind(grid, {
                    onEdit:   (id) => { window.location.hash = `#/editar?id=${id}`; },
                    onReturn: (id) => { window.location.hash = `#/devolucao?id=${id}`;},
                    onRemove: async (id) => {
                                try {
                                    const response = await fetch(`http://localhost:8000/items/${id}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${Auth.getToken()}`
                                        }
                                    });

                                    if (!response.ok) {
                                        throw new Error('Erro ao remover item');
                                    }

                                    // remove da tela
                                    const card = document.querySelector(`.item-card[data-id="${id}"]`);
                                    if (card) card.remove();

                                    alert('Item removido com sucesso!');
                                } catch (error) {
                                    console.error(error);
                                    alert('Erro ao remover item');
                                }
                            }
                });
            }

            /* ─── Filtros de status ─── */

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const val = btn.dataset.filter;
                    currentFilter = val === 'all' ? 'all' : parseInt(val, 10);
                    applyFilters();
                });
            });

            /* ─── Filtros de categoria ─── */

            categoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    categoryBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentCategory = btn.dataset.category;
                    applyFilters();
                });
            });

            /* ─── Fade de scroll ─── */

            function bindScrollFade(el) {
                function update() {
                    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
                    el.classList.toggle('has-overflow', el.scrollWidth > el.clientWidth && !atEnd);
                }
                const ro = new ResizeObserver(update);
                ro.observe(el);
                el.addEventListener('scroll', update, { passive: true });
                // fontes async (Syne, DM Sans) alargam os botões após o layout inicial
                document.fonts.ready.then(update);
            }
            
            /* ─── Init ─── */
            applyFilters();
            bindScrollFade(document.querySelector('.items-filters'));
            bindScrollFade(document.querySelector('.items-categories'));
            Topbar.refresh()

        } // fim initItemsPage

        const _DEMO_ITEMS = [
            // status: 0 = perdido | 1 = devolvido
            {
                id: 1, status: 0, category: 'acessorio',
                title: 'Carteira preta couro',
                desc: 'Carteira masculina de couro preta, perdida próximo ao bloco D na quinta-feira. Contém documentos.',
                images: [
                    'https://img.irroba.com.br/fit-in/600x600/filters:fill(transparent):quality(80)/diferutt/catalog/carteiras-e-cintos/carteira-809-preto-01.png',
                    'https://img.irroba.com.br/fit-in/600x600/filters:fill(fff):quality(80)/claudine/catalog/z-layout-novo/produtos/vestuario-e-acessorios/carteiras/c001/ton-4948.jpg',
                ],
                date: '2025-03-07',
            },
            {
                id: 2, status: 1, category: 'acessorio',
                title: 'Óculos de grau roxo',
                desc: 'Encontrado na biblioteca, armação roxa com lentes de grau. Está na secretaria aguardando o dono.',
                images: [
                    'https://photos.enjoei.com.br/armacao-oculos-para-grau-roxo-104703522/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy85NTgxOTIwL2RmZDljOWFjMmNiMmI0ZTdkYzc2OGZiMWIwZjdiNjU3LmpwZw',
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdSWXVXsH8VLt0FDmpi_TWR_J6HC0anuD76g&s',
                ],
                date: '2025-03-08',
            },
            {
                id: 3, status: 0, category: 'outros',
                title: 'Chave com chaveiro de gatinho',
                desc: 'Molho de chaves com chaveiro de gato laranja. Perdido na quinta-feira. Procure a coordenação.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5bi0k1-0HfKwLX9GZ1y9C6QDylk-yOorUPg&s',
                    'https://m.media-amazon.com/images/I/61P-dIkNWCL.jpg'
                ],
                date: '2025-03-06',
            },
            {
                id: 4, status: 1, category: 'outros',
                title: 'Guarda-chuva azul marinho',
                desc: 'Achado no corredor do laboratório de informática após a aula de quinta. Grande, cabo preto.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIkvs8CeNicXIE-wmc456JDnG7n6rLmaDmiQ&s',
                    'https://florenca.ind.br/wp-content/uploads/2023/03/FL017-Azul-Marinho-scaled.jpg0',
                ],
                date: '2025-03-09',
            },
            {
                id: 5, status: 0, category: 'eletronico',
                title: 'Celular Samsung preto',
                desc: 'Smartphone Samsung Galaxy preto, perdido na cantina na segunda-feira. Tela com case transparente.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAPgjjH2XXswGqka68lyOyFAEUnLGr6tK73w&s',
                    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
                ],
                date: '2025-03-05',
            },
            {
                id: 6, status: 1, category: 'eletronico',
                title: 'Notebook prata',
                desc: 'Notebook prata encontrado na sala 204 após aula de cálculo. Está na coordenação do curso.',
                images: [
                    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
                    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80',
                ],
                date: '2025-03-08',
            },
            {
                id: 7, status: 0, category: 'documento',
                title: 'Carteira de estudante UFPB',
                desc: 'Carteira de estudante perdida próximo ao RU na terça. Nome: João Silva, matrícula 20220012345.',
                images: [
                    'https://www.moviearte.com.br/uploads/imagens_editor_texto/CARTEIRAESTUDANTE.webp',
                ],
                date: '2025-03-04',
            },
            {
                id: 8, status: 0, category: 'roupa',
                title: 'Tênis Puma branco nº 42',
                desc: 'Tênis Puma branco tamanho 42, esquecido no vestiário do ginásio na quarta-feira.',
                images: [
                    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
                    'https://images.tcdn.com.br/img/img_prod/1247978/tenis_puma_masculino_court_classic_clean_40444001_branco_20951_1_534fec29afe4ef40fed1af7a77998c92.jpg'
                ],
                date: '2025-03-06',
            },
            {
                id: 9, status: 1, category: 'roupa',
                title: 'Moletom cinza universitário',
                desc: 'Moletom cinza com capuz encontrado na biblioteca. Sem identificação. Retirar na secretaria.',
                images: [
                    'https://photos.enjoei.com.br/moletom-cinza-universidade-de-pittsburgh-tamanho-m-107095019/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy8zNzU2MjI1NC84NDVlNjU3NjVlZTBhMzQyNzFiMzIxNWExMWI2NWYwZS5qcGc',
                ],
                date: '2025-03-07',
            },
        ];


        // Buscar dados reais do backend
        async function carregarItens() {
            try {
                const token = Auth.getToken?.();

                const response = await fetch('http://localhost:8000/items', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });

                if (!response.ok) {
                    console.error('Erro ao carregar itens:', response.status);
                    initItemsPage([]);
                    return;
                }

                const itensData = await response.json();

                // Transformar dados do backend para o formato esperado pela UI
                const itensMapeados = itensData.map(item => ({
                    id: item.id,
                    status: item.devolvido ? 1 : 0, // 0 = perdido, 1 = devolvido
                    category: item.categoria,
                    title: item.nome,
                    desc: item.descricao || '',
                    images: item.imagens.map(img => `http://localhost:8000/images/${img}`),
                    date: item.data_encontro,
                }));

                initItemsPage(itensMapeados);
            } catch (error) {
                console.error('Erro na conexão com o backend:', error);
                initItemsPage([]);
            }
        }

        // Carregar itens ao inicializar a página
        carregarItens();
        Topbar.refresh();
        CardActions.refresh()

    } // fim visualizar

    function anunciar() {

        const dataInput = document.getElementById("data_encontro");
        if (!dataInput) {
            console.log('Campo data_encontro não encontrado');
            return;
        }

        // auto preencher data
        const hoje = new Date().toISOString().split("T")[0];
        dataInput.value = hoje;

        // Configurar preview das imagens
        const previewFoto = document.getElementById('previewFoto');
        const fotoInput = document.getElementById('fotoInput');
        
        if (previewFoto && fotoInput) {
            fotoInput.addEventListener('change', (e) => {
                previewFoto.innerHTML = '';
                Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style.width = '120px';
                        img.style.height = '120px';
                        img.style.objectFit = 'cover';
                        img.style.marginRight = '8px';
                        img.style.borderRadius = '5px';
                        previewFoto.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            });
        }

        // Configurar event listener do formulário de envio
        const form = document.getElementById('anunciarForm');
        if (form) {
            configurarSubmitAnunciar(form);
        }
    }

    // Função para configurar o submit do anúncio
    function configurarSubmitAnunciar(form) {
        // Remover listeners anteriores para evitar duplicação
        form.onsubmit = null;
        
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            // Log dos valores dos campos
            const nome = document.getElementById('nome').value;
            const local = document.getElementById('local_encontro').value;
            const descricao = document.getElementById('descricao').value;
            const categoria = document.getElementById('categoria').value;
            const data = document.getElementById('data_encontro').value;
            const fotos = document.getElementById('fotoInput').files;
            // Validar se todos os campos obrigatórios estão preenchidos
            if (!nome || !local || !categoria || !data) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }

            if (fotos.length === 0) {
                alert('Selecione pelo menos uma foto!');
                return;
            }

            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('local_encontro', local);
            formData.append('descricao', descricao || '');
            formData.append('categoria', categoria);
            formData.append('data_encontro', data);

            Array.from(fotos).forEach(file => formData.append('imagens', file));

            try {
                const token = Auth.getToken?.();

                if (!token) {
                    alert('Você precisa estar logado para cadastrar um item!');
                    Router.navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:8000/items', {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });

                if (response.ok) {
                    alert('Item cadastrado com sucesso!');
                    Router.navigate('/visualizar');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    alert(`Erro ao cadastrar item: ${errorData.detail || response.statusText}`);
                }
            } catch (error) {
                console.error('Erro na requisição de cadastro:', error);
                alert('Erro de conexão com o servidor. Tente novamente.');
            }
        });
    }

    function devolucao() {
        const dataInput = document.getElementById("dataDevolucao");
        const telInput = document.getElementById("telefone");
        const nomeInput = document.getElementById("nomeResgatante");
        const tipoInput = document.getElementById("tipoResgatante");

        // se não estiver na página, sai
        if (!dataInput || !telInput) {
            return;
        }

        // pegar ID do item na URL
        const hash = window.location.hash.replace("#", "");
        const [, query] = hash.split('?');
        const params = Object.fromEntries(new URLSearchParams(query || ''));
        const itemId = params.id;


        // auto preencher data
        const hoje = new Date().toISOString().split("T")[0];
        dataInput.value = hoje;

        // máscara telefone
        telInput.addEventListener("input", () => {
            let v = telInput.value.replace(/\D/g, "");

            if (v.length > 11) v = v.slice(0, 11);

            if (v.length > 10) {
                v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
            } else if (v.length > 6) {
                v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
            } else if (v.length > 2) {
                v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
            } else {
                v = v.replace(/^(\d*)/, "($1");
            }

            telInput.value = v;
        });

        // SUBMIT
        document.getElementById("formDevolucao").addEventListener("submit", async (e) => {
            e.preventDefault();

            try {
                const token = Auth.getToken?.();

                const formData = new FormData();
                formData.append("data_devolucao", dataInput.value);
                formData.append("nome_resgatante", nomeInput.value);
                formData.append("telefone_resgatante", telInput.value);
                formData.append("tipo_resgatante", tipoInput.value);

                const response = await fetch(`http://localhost:8000/items/${itemId}`, {
                    method: "PUT",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData
                });

                if (response.ok) {
                    alert("Item devolvido com sucesso!");
                    window.location.hash = "#/visualizar";
                } else {
                    const error = await response.json();
                    alert(error.detail || "Erro ao devolver item");
                }

            } catch (err) {
                console.error(err);
                alert("Erro de conexão");
            }
        }); 
    }

    
    function editar() {
        // Capturar ID do item da URL (query string)
        const hash = window.location.hash.replace("#", "");
        const [, query] = hash.split('?');
        const params = Object.fromEntries(new URLSearchParams(query || ''));
        const itemId = params.id;

        if (!itemId) {
            alert('ID do item não informado');
            window.location.hash = '#/visualizar';
            return;
        }

        const form = document.getElementById('editarForm');
        if (!form) {
            return;
        }

        // Buscar dados do item no backend
        async function carregarDados() {
            try {
                const token = Auth.getToken?.();
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                
                const response = await fetch(`http://localhost:8000/items/${itemId}`, {
                    method: 'GET',
                    headers
                });

                if (!response.ok) {
                    alert('Erro ao carregar dados do item');
                    window.location.hash = '#/visualizar';
                    return;
                }
                

                const item = await response.json();

                // Pré-preencher os campos
                document.getElementById('nome').value = item.nome || '';
                document.getElementById('local_encontro').value = item.local_encontro || '';
                document.getElementById('descricao').value = item.descricao || '';
                document.getElementById('categoria').value = item.categoria || '';
                document.getElementById('data_encontro').value = item.data_encontro || '';

                // Exibir imagens atuais
                const previewContainer = document.getElementById('previewContainer');
                previewContainer.innerHTML = '';

                if (item.imagens && item.imagens.length > 0) {
                    const titulo = document.createElement('p');
                    titulo.style.width = '100%';
                    titulo.style.marginBottom = '10px';
                    titulo.textContent = 'Imagens atuais:';
                    previewContainer.appendChild(titulo);

                    item.imagens.forEach((img, index) => {
                        const container = document.createElement('div');
                        container.style.position = 'relative';
                        container.style.display = 'inline-block';

                        // MARCA como antiga
                        container.setAttribute('data-antiga', 'true');

                        const imgEl = document.createElement('img');
                        imgEl.src = `http://localhost:8000/images/${img}`;
                        imgEl.style.width = '120px';
                        imgEl.style.height = '120px';
                        imgEl.style.objectFit = 'cover';
                        imgEl.style.borderRadius = '8px';

                        container.appendChild(imgEl);
                        previewContainer.appendChild(container);
                    });
                }

            } catch (error) {
                console.error('Erro ao carregar item:', error);
                alert('Erro de conexão com o servidor');
                window.location.hash = '#/visualizar';
            }
        }

        // Carregar dados ao iniciar
        carregarDados();
        

        // Preview das novas imagens (se o usuário selecionar)
        document.getElementById('fotoInput').addEventListener('change', (e) => {
            const files = e.target.files;
            const previewContainer = document.getElementById('previewContainer');

            // Remove preview de imagens antigas
            const antigas = previewContainer.querySelectorAll('[data-antiga="true"]');
            antigas.forEach(p => p.remove());

            // Remove previews de imagens selecionadas que foram descartadas
            const previewsNovas = previewContainer.querySelectorAll('[data-nova="true"]');
            previewsNovas.forEach(p => p.remove());

            // Adicionar novos previews
            Array.from(files).forEach((file) => {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const container = document.createElement('div');
                    container.style.position = 'relative';
                    container.style.display = 'inline-block';
                    container.setAttribute('data-nova', 'true');

                    const imgEl = document.createElement('img');
                    imgEl.src = event.target.result;
                    imgEl.style.width = '120px';
                    imgEl.style.height = '120px';
                    imgEl.style.objectFit = 'cover';
                    imgEl.style.borderRadius = '8px';
                    imgEl.style.opacity = '0.7';

                    const indicador = document.createElement('span');
                    indicador.textContent = '🆕';
                    indicador.style.position = 'absolute';
                    indicador.style.top = '5px';
                    indicador.style.right = '5px';
                    indicador.style.fontSize = '20px';

                    container.appendChild(imgEl);
                    container.appendChild(indicador);
                    previewContainer.appendChild(container);
                };

                reader.readAsDataURL(file);
            });
        });

        // Submeter o formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();

            // Adicionar campos de texto
            formData.append('nome', document.getElementById('nome').value);
            formData.append('local_encontro', document.getElementById('local_encontro').value);
            formData.append('descricao', document.getElementById('descricao').value);
            formData.append('categoria', document.getElementById('categoria').value);
            formData.append('data_encontro', document.getElementById('data_encontro').value);

            // Adicionar novas imagens (se houver)
            const files = document.getElementById('fotoInput').files;
            if (files.length > 0) {
                Array.from(files).forEach((file) => {
                    formData.append('imagens', file);
                });
            }

            try {
                const token = Auth.getToken?.();

                const response = await fetch(`http://localhost:8000/items/${itemId}`, {
                    method: 'PUT',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });

                if (response.ok) {
                    alert('Item atualizado com sucesso!');
                    window.location.hash = '#/visualizar';
                } else {
                    const error = await response.json();
                    alert(`Erro ao atualizar: ${error.detail || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                alert('Erro de conexão com o servidor');
            }
        });
    }

    return {
        login,
        anunciar,
        visualizar,
        devolucao,
        editar
    };

})();