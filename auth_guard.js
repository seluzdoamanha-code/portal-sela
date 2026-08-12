// Proteção de Rota (Auth Guard)
// Deve ser carregado no <head> de TODAS as páginas do portal (exceto login.html)

const GUARD_SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const GUARD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

// Inicializa cliente isolado para o guard (caso o da página demore)
const authDb = window.supabase.createClient(GUARD_SUPABASE_URL, GUARD_SUPABASE_KEY);

async function checkAuth() {
    // 0. Redirecionamento Mobile
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    if (!filename.startsWith('m_') && filename !== 'login.html') {
        if (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Mapeia para a equivalente mobile se existir
            const mobileMap = {
                'index.html': 'm_index.html',
                'pessoas.html': 'm_pessoas.html',
                'perfil.html': 'm_perfil.html',
                'atividades.html': 'm_atividades.html',
                'entidade.html': 'm_atividades.html',
                'config.html': 'm_config.html'
            };
            
            if (mobileMap[filename]) {
                window.location.replace(mobileMap[filename] + window.location.search + window.location.hash);
                return;
            }
        }
    }

    // 1. Pega a sessão atual
    const { data: { session }, error: sessionError } = await authDb.auth.getSession();
    
    if (sessionError || !session) {
        // Se a URL original tiver um erro do Supabase (no hash ou query), passamos para o login.js
        if (window.location.href.includes('error=')) {
            const errorPart = window.location.hash || window.location.search;
            window.location.replace('login.html' + errorPart.replace('#', '?'));
        } else {
            window.location.replace('login.html');
        }
        return;
    }

    // 2. Se tem sessão, mas a Microsoft/Google não enviou o e-mail
    const email = session.user.email;
    if (!email) {
        await authDb.auth.signOut();
        window.location.replace('login.html?error=sem_email');
        return;
    }

    // 3. Checa se o e-mail está na tabela usuarios_autorizados
    const { data: whitelist, error: dbError } = await authDb
        .from('usuarios_autorizados')
        .select('*')
        .eq('email', email)
        .single();

    if (dbError || !whitelist) {
        // Usuário tem conta Google/MS, mas não tem permissão na SELA
        await authDb.auth.signOut();
        window.location.replace('login.html?error=nao_autorizado&email=' + encodeURIComponent(email || 'desconhecido'));
        return;
    }

    // 4. Usuário autorizado! 
    // Vamos injetar os dados dele no localStorage para o sidebar.js puxar
    const userProfile = {
        nome: whitelist.nome || session.user.user_metadata.full_name || 'Trabalhador SELA',
        foto: session.user.user_metadata.avatar_url || 'https://ui-avatars.com/api/?name=Sela&background=random',
        email: email,
        nivel_acesso: whitelist.nivel_acesso || 'comum'
    };
    localStorage.setItem('sela_user_profile', JSON.stringify(userProfile));
}

// Executa imediatamente
checkAuth();

// Funções globais de permissão
window.podeEditarPessoas = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'secretaria');
    } catch(e) {
        return false;
    }
};

window.podeEditarAssistidas = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        // Permite admin, secretaria e se precisarem adicionar grupo assistencia depois
        return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'secretaria' || prof.nivel_acesso === 'assistencia');
    } catch(e) {
        return false;
    }
};
