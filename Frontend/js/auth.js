const Auth = (()=>{
    // Para o Auth vamos salvar o token enviado pelo backend no localstorage e para as requisições necessárias, vamos sempre validar
    const STORAGE_PREFIX = 'aep_';
    const TOKEN_KEY = `${STORAGE_PREFIX}token`;
    const USER_KEY = `${STORAGE_PREFIX}user`;
    // ------- Helper para decodificar JWT ----------------
    function parseJwt(){
        //TO-DO
    }

    function isTokenExpired(token) {
        return false; //quando o token retornado for valido, retirar a linha.
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // payload.exp é o timestamp de expiração em segundos
            // Date.now() retorna em milissegundos, por isso divide por 1000
            return payload.exp < Date.now() / 1000;
        } catch (e) {
            // se o token for inválido/malformado, considera expirado
            return true;
        }
    }

    // --------- Verifica se usuario está autenticado ---------------
    function isAuthed() {
        const token = localStorage.getItem(TOKEN_KEY);
        if(!token) return false;
        if(isTokenExpired(token)){
            logout();
            return false;
        }
        return true
    }

    function login(){
        //TODO
    }
    // ------------ logout --------------------
    function logout(){
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        Router.navigate('/visualizar');
    }

    // ─── Retorna token ────────────────────────
    function getToken() {

        //Vai ser para enviar no header da requisição
        const token = localStorage.getItem(TOKEN_KEY);
        
        // Verifica se o token está válido antes de retornar
        if (token && isTokenExpired(token)) {
            console.log('Token expirado ao tentar recuperar');
            logout();
            return null;
        }
        
        return token;
    }

     // ─── Retorna usuário ──────────────────────
    function getUser() {
        const json = localStorage.getItem(USER_KEY);
        return json ? JSON.parse(json) : null;
    }

    // ─── Guards (proteger rotas) ──────────────
    function requireAuth() {
        if (!isAuthed()) {
            Router.navigate('/visualizar');
            return false;
        }
        return true;
    }

     function requireGuest() {
        if (isAuthed()) {
            Router.navigate('/anunciar');
            return false;
        }
        return true;
    }

    // Função para salvar o token
    function setToken(token, user = null) {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    }


    return { login, logout, isAuthed, getToken, getUser, requireAuth, requireGuest, setToken };


})()