
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
                <img
                    class="topbar__logo"
                    src="https://www.ccsa.ufpb.br/ufpb/contents/noticias/nota-de-repudio/logo-ufpb.png/@@images/6ab839bc-0d0c-4f09-8325-698542f409fe.png"
                    alt="Logo UFPB"
                    onerror="this.style.display='none'"
                >
                <div class="topbar__name">
                    UFPB
                    <span>Achados &amp; Perdidos</span>
                </div>
                <nav class="topbar__actions" id="topbar-actions" aria-label="Ações do usuário">
                    <!-- preenchido por _renderActions() -->
                </nav>
            </header>`;
    }

    function _actionsHtml(authed) {
        if (authed) {
            return `
                <a class="topbar__btn topbar__btn--primary" href="#/anunciar" aria-label="Criar novo anúncio">
                    + Novo Item
                </a>
                <button class="topbar__btn topbar__btn--ghost topbar__btn--icon" id="topbar-btn-logout" aria-label="Sair da conta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                </button>
                `
        }
        return `
            <a class="topbar__btn topbar__btn--ghost" href="#/login" aria-label="Fazer login">
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
            document.getElementById('topbar-btn-logout')?.addEventListener('click', () => {
                Auth.logout();
                CardActions.refresh();
                refresh();
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