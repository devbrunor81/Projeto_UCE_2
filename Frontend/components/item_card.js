const CardActions = (() => {

    // ─── Helper de auth ───────────────────────────────────────────
    function _isAuthed() {
        return Auth.isAuthed();
    }
    // ─── Ícones SVG inline ────────────────────────────────────────
    const ICON_EDIT = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;

    const ICON_REMOVE = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>`;
    const ICON_RETURN = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`;

    // ─── API pública ──────────────────────────────────────────────

    /**
     * Retorna o HTML dos botões de ação para um card.
     * Retorna string vazia se o usuário não estiver autenticado.
     *
     * @param {number|string} itemId  - ID do item
     * @returns {string} HTML pronto para injetar no card
     */
    function render(itemId, options = {}) {
        if (!_isAuthed()) return '';

        const { hideReturn } = options;

        return `
            <div class="item-card__actions">
                ${!hideReturn ? `
                <button
                    class="item-card__btn item-card__btn--return"
                    data-id="${itemId}"
                    aria-label="Devolver item">
                    ${ICON_RETURN} Devolver
                </button>
                ` : ''}
                <button
                    class="item-card__btn item-card__btn--edit"
                    data-id="${itemId}"
                    aria-label="Alterar item">
                    ${ICON_EDIT} Alterar
                </button>
                <button
                    class="item-card__btn item-card__btn--remove"
                    data-id="${itemId}"
                    aria-label="Remover item">
                    ${ICON_REMOVE}
                </button>
            </div>`;
    }

    /**
     * Faz bind dos eventos de clique nos botões de ação dentro de um container.
     * Deve ser chamado após os cards serem inseridos no DOM.
     *
     * @param {Element} containerEl              - Elemento pai que contém os cards
     * @param {{ onReturn: Function, nonEdit: Function, onRemove: Function }} callbacks
     */
    function bind(containerEl, { onReturn, onEdit, onRemove } = {}) {
        containerEl.querySelectorAll('.item-card__btn--edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (typeof onEdit === 'function') onEdit(id);
            });
        });

        containerEl.querySelectorAll('.item-card__btn--remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                if (confirm('Remover este item?')) {
                    if (typeof onRemove === 'function') onRemove(id);
                }
            });
        });

        containerEl.querySelectorAll('.item-card__btn--return').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (typeof onReturn === 'function') onReturn(id);
            });
        });
    }

    function refresh() {
        document.querySelectorAll('.item-card').forEach(card => {
            const id = card.dataset.id;
            const actionsEl = card.querySelector('.item-card__actions');

            if (!_isAuthed()) {
                // remove os botões se existirem
                actionsEl?.remove();
            } else if (!actionsEl) {
                // adiciona os botões se não existirem
                card.querySelector('.item-card__body').insertAdjacentHTML('beforeend', render(id));
            }
        });
    }

    return { render, bind, refresh };

})();