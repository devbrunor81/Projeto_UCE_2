
const Topbar = (() => {

    // ─── Helpers de auth ──────────────────────────────────────────
    function _isAuthed() {
        if (typeof Auth !== 'undefined' && Auth.isAuthed) return Auth.isAuthed();
        return !!localStorage.getItem('token');
    }

    function _logout() {
        if (typeof Auth !== 'undefined' && Auth.logout) {
            Auth.logout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('aep_token');
            localStorage.removeItem('aep_user');
        }
    }

    // ─── Templates HTML ───────────────────────────────────────────
    function _html() {
        return `
            <header class="topbar" id="topbar">

                <a href="/" class="topbar__brand">
                    
                    <div class="topbar__left">
                        <img
                            class="topbar__logo"
                            src="https://www.ufpb.br/acessoainformacao/contents/imagens/logo/brasaooficial.png/@@images/c7c5e93b-c273-4503-a760-64c83b712fef.png"
                            alt="Logo UFPB"
                            onerror="this.style.display='none'"
                        >
                        <div class="topbar__ufpb">UFPB</div>
                    </div>

                    <div class="topbar__title">
                        Achados &amp; Perdidos
                    </div>

                </a>

                <nav class="topbar__actions" id="topbar-actions"></nav>

            </header>`;
    }

function _actionsHtml(authed) {
    if (authed) {

        return `
            <a class="topbar__btn topbar__btn--primary" href="#/anunciar">
                + Novo Item
            </a>

            <div class="topbar__user">
                <button class="topbar__btn topbar__btn--ghost topbar__btn--user" id="topbar-user-btn">
                    Usuário ▼
                </button>

                <div class="topbar__dropdown">
                    <button class="topbar__dropdown-item" data-action="update">
                        Atualizar credenciais
                    </button>
                    <button class="topbar__dropdown-item" data-action="logout">
                        Sair
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <a class="topbar__btn topbar__btn--ghost" href="#/login">
            Login
        </a>`;
}

    // ─── Render das actions ───────────────────────────────────────
    function _renderActions() {
        const actionsEl = document.getElementById('topbar-actions');
        if (!actionsEl) return;

        const authed = _isAuthed();
        actionsEl.innerHTML = _actionsHtml(authed);

        if (authed) {
            const userBox = document.querySelector('.topbar__user');
            const btn = document.getElementById('topbar-user-btn');

            // abrir/fechar dropdown
            btn?.addEventListener('click', () => {
                userBox.classList.toggle('open');
            });

            // ações
            userBox?.querySelectorAll('.topbar__dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;

                    if (action === 'logout') {
                        _logout();
                        CardActions.refresh();
                        refresh();
                    }

                    if (action === 'update') {
                        Router.navigate('/credenciais');
                    }
                });
            });

            // fechar ao clicar fora
            document.addEventListener('click', (e) => {
                if (!userBox.contains(e.target)) {
                    userBox.classList.remove('open');
                }
            });
        }
    }

    // ─── API pública ──────────────────────────────────────────────

    /**
     * Monta a topbar dentro do elemento #topbar-root.
     * Se não existir, insere no topo do <body>.
     */
    function init() {
        const root = document.getElementById('topbar-root') ?? document.body;
        // Evita duplicar se já existir
        if (document.getElementById('topbar')) {
            _renderActions();
            return;
        }
        root.insertAdjacentHTML('afterbegin', _html());
        _renderActions();
    }

    /**
     * Re-renderiza apenas os botões de ação, sem recriar toda a topbar.
     * Chamar após login/logout.
     */
    function refresh() {
        _renderActions();
    }

    return { init, refresh };

})();