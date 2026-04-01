const Router = (() =>{
    /**
     * Rotas Disponíveis
     */

    const routes = {
        '/login':{
            template: 'pages/login.html',
            init: () => Pages?.login?.(),
            guard: null,
        },
        '/anunciar':{
            template: 'pages/anunciar.html',
            init: ()=> Pages?.anunciar?.(),
            guard: () => Auth.requireAuth()
        },
        '/visualizar':{
            template: 'pages/visualizar.html',
            init: () => Pages?.visualizar?.(),
            guard:null
        },
        '/devolucao':{
            template: 'pages/devolucao.html',
            init: ()=> Pages?.devolucao?.(),
            guard: () => Auth.requireAuth()
        }
    }

    const appEl = document.getElementById('app')

    //--------- Cache de templates ---------
    const cache = {}

    async function fetchTemplate(path){
        if(cache[path]) return cache[path];
        const res = await fetch(path);
        const html = await res.text();

        cache[path] = html;

        return html;
    }
    //------------ Parse da Url Atual ------
    function parseUrl(){
        const hash = window.location.hash.replace("#","") || "/";
        const [path, query] = hash.split('?');
        const params = Object.fromEntries(new URLSearchParams(query||''));
        return {path:path || '/',params};
    }

    //------------ Render --------------
    async function render(){
        const {path,params} = parseUrl();
        const route = routes[path] || routes['/visualizar'];

        // A proxima linha é para garantir autenticação
        if(route.guard && !route.guard()) return;
        // A partir daqui o usuário está autenticado, pode-se colocar uma toolbar ou opções para cadastro de anuncio


        //Template de visualização da pagina
        const templateHtml = await fetchTemplate(route.template);

        //Inserir template na página, montando layout
        appEl.innerHTML = templateHtml;

        if(route.init)route.init();
    }

    //------------ Navegação -------------
    function navigate(path){
        window.location.hash = path;
    }

    //------------- Inicializa -------------
    function init(){
        window.addEventListener('hashchange', render);

        // Captura cliques em <a href="#/..."> sem reload
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#/"]');
            if (link) {
                e.preventDefault();
                navigate(link.getAttribute('href').replace('#', ''));
            }
        });

        // Render inicial
        render();
    }

    return {navigate,init};
})();