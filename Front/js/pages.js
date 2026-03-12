const Pages = (() => {

    function login() {

    }

    function anunciar() {
        const form = document.getElementById('anunciar-form');
        const mensagemDiv = document.getElementById('mensagem');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const item = {
                nome: formData.get('nome'),
                descricao: formData.get('descricao'),
                data_encontro: formData.get('data_encontro'),
                retirado: formData.get('retirado') === 'on'
            };

            try {
                const response = await fetch(`${CONFIG.API_URL}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(item)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const resultado = await response.json();
                
                // Sucesso
                mensagemDiv.textContent = `✅ Item anunciado com sucesso! (ID: ${resultado.id})`;
                mensagemDiv.className = 'sucesso';
                mensagemDiv.style.display = 'block';

                // Limpar formulário
                form.reset();

                // Redirecionar após 2 segundos
                setTimeout(() => {
                    Router.navigate('/visualizar');
                }, 2000);

            } catch (error) {
                console.error('Erro ao anunciar:', error);
                mensagemDiv.textContent = `❌ Erro ao anunciar item: ${error.message}`;
                mensagemDiv.className = 'erro';
                mensagemDiv.style.display = 'block';
            }
        });
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
                    if (startX === null) return;
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
                acessorio: { label: 'Acessório',     icon: '👜' },
                eletronico: { label: 'Eletrônico',   icon: '📱' },
                documento:  { label: 'Documento',    icon: '📄' },
                roupa:      { label: 'Roupa/Calçado',icon: '👕' },
                outros:     { label: 'Outros',       icon: '📦' },
            };

            function renderCard(item) {
                const statusLabel = item.status === 'found' ? 'Achado' : 'Perdido';
                const statusClass = item.status === 'found' ? 'found' : 'lost';
                const cat = item.category && CATEGORY_LABELS[item.category]
                    ? CATEGORY_LABELS[item.category]
                    : null;

                return `
                    <article class="item-card" role="listitem" data-status="${item.retirado}" data-id="${item.id}">
                        <div style="position:relative">
                            <span class="item-card__badge item-card__badge--${statusClass}">${statusLabel}</span>
                            ${buildCarousel(item.images, item.id)}
                        </div>
                        <div class="item-card__body">
                            ${cat ? `<span class="item-card__category">${cat.icon} ${cat.label}</span>` : ''}
                            <h3 class="item-card__title">${escHtml(item.nome)}</h3>
                            <p  class="item-card__desc">${escHtml(item.descricao)}</p>
                            <div class="item-card__meta">
                                <span class="item-card__date">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                                        <line x1="3"  y1="10" x2="21" y2="10"/>
                                    </svg>
                                    ${formatDate(item.data_encontro)}
                                </span>
                            </div>
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
                let filtered = items;

                if (currentFilter !== 'all')
                    filtered = filtered.filter(i => i.status === currentFilter);

                if (currentCategory !== 'all')
                    filtered = filtered.filter(i => i.category === currentCategory);

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
            }

            /* ─── Filtros de status ─── */

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
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

            /* ─── Init ─── */
            applyFilters();

        } // fim initItemsPage

        const _DEMO_ITEMS = [
            {
                id: 1, status: 'lost', category: 'acessorio',
                title: 'Carteira preta couro',
                desc: 'Carteira masculina de couro preta, perdida próximo ao bloco D na quinta-feira. Contém documentos.',
                images: [
                    'https://img.irroba.com.br/fit-in/600x600/filters:fill(transparent):quality(80)/diferutt/catalog/carteiras-e-cintos/carteira-809-preto-01.png',
                    'https://img.irroba.com.br/fit-in/600x600/filters:fill(fff):quality(80)/claudine/catalog/z-layout-novo/produtos/vestuario-e-acessorios/carteiras/c001/ton-4948.jpg',
                ],
                date: '2025-03-07',
            },
            {
                id: 2, status: 'found', category: 'acessorio',
                title: 'Óculos de grau roxo',
                desc: 'Encontrado na biblioteca, armação roxa com lentes de grau. Está na secretaria aguardando o dono.',
                images: [
                    'https://photos.enjoei.com.br/armacao-oculos-para-grau-roxo-104703522/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy85NTgxOTIwL2RmZDljOWFjMmNiMmI0ZTdkYzc2OGZiMWIwZjdiNjU3LmpwZw',
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdSWXVXsH8VLt0FDmpi_TWR_J6HC0anuD76g&s',
                ],
                date: '2025-03-08',
            },
            {
                id: 3, status: 'lost', category: 'outros',
                title: 'Chave com chaveiro de gatinho',
                desc: 'Molho de chaves com chaveiro de gato laranja. Perdido na quinta-feira. Procure a coordenação.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5bi0k1-0HfKwLX9GZ1y9C6QDylk-yOorUPg&s',
                    'https://m.media-amazon.com/images/I/61P-dIkNWCL.jpg'
                ],
                date: '2025-03-06',
            },
            {
                id: 4, status: 'found', category: 'outros',
                title: 'Guarda-chuva azul marinho',
                desc: 'Achado no corredor do laboratório de informática após a aula de quinta. Grande, cabo preto.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIkvs8CeNicXIE-wmc456JDnG7n6rLmaDmiQ&s',
                    'https://florenca.ind.br/wp-content/uploads/2023/03/FL017-Azul-Marinho-scaled.jpg0',
                ],
                date: '2025-03-09',
            },
            {
                id: 5, status: 'lost', category: 'eletronico',
                title: 'Celular Samsung preto',
                desc: 'Smartphone Samsung Galaxy preto, perdido na cantina na segunda-feira. Tela com case transparente.',
                images: [
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAPgjjH2XXswGqka68lyOyFAEUnLGr6tK73w&s',
                    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
                ],
                date: '2025-03-05',
            },
            {
                id: 6, status: 'found', category: 'eletronico',
                title: 'Notebook prata',
                desc: 'Notebook prata encontrado na sala 204 após aula de cálculo. Está na coordenação do curso.',
                images: [
                    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
                    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80',
                ],
                date: '2025-03-08',
            },
            {
                id: 7, status: 'lost', category: 'documento',
                title: 'Carteira de estudante UFPB',
                desc: 'Carteira de estudante perdida próximo ao RU na terça. Nome: João Silva, matrícula 20220012345.',
                images: [
                    'https://www.moviearte.com.br/uploads/imagens_editor_texto/CARTEIRAESTUDANTE.webp',
                ],
                date: '2025-03-04',
            },
            {
                id: 8, status: 'lost', category: 'roupa',
                title: 'Tênis Puma branco nº 42',
                desc: 'TênisPuma branco tamanho 42, esquecido no vestiário do ginásio na quarta-feira.',
                images: [
                    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
                    'https://images.tcdn.com.br/img/img_prod/1247978/tenis_puma_masculino_court_classic_clean_40444001_branco_20951_1_534fec29afe4ef40fed1af7a77998c92.jpg'
                ],
                date: '2025-03-06',
            },
            {
                id: 9, status: 'found', category: 'roupa',
                title: 'Moletom cinza universitário',
                desc: 'Moletom cinza com capuz encontrado na biblioteca. Sem identificação. Retirar na secretaria.',
                images: [
                    'https://photos.enjoei.com.br/moletom-cinza-universidade-de-pittsburgh-tamanho-m-107095019/800x800/czM6Ly9waG90b3MuZW5qb2VpLmNvbS5ici9wcm9kdWN0cy8zNzU2MjI1NC84NDVlNjU3NjVlZTBhMzQyNzFiMzIxNWExMWI2NWYwZS5qcGc',
                ],
                date: '2025-03-07',
            },
        ];

        // ✅ Buscar dados do backend
        async function loadItems() {
            try {
                const response = await fetch(`${CONFIG.API_URL}/items`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const items = await response.json();
                initItemsPage(items);
            } catch (error) {
                console.error('Erro ao carregar items:', error);
            }
        }

        loadItems();

    } // fim visualizar

    return {
        login,
        anunciar,
        visualizar,
    };

})();