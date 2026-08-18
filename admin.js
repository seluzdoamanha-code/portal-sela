const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
// As chaves são pegas do config.js que é importado antes
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, window.SUPABASE_KEY_CONFIG || 'eyJhbG...') : null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificação de Acesso Global
    await verificarAcessoAdmin();
});

async function verificarAcessoAdmin() {
    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const userEmail = session.user.email;
        const { data: userProfile, error } = await db
            .from('pessoas')
            .select('nivel_acesso')
            .eq('email', userEmail)
            .single();

        if (error || !userProfile || userProfile.nivel_acesso !== 'admin') {
            alert('Acesso negado: Esta área é restrita para administradores globais.');
            window.location.href = 'index.html'; // Redireciona para um local seguro
            return;
        }

        // Tudo certo! É admin. Mostra o conteúdo.
        document.getElementById('adminContent').style.display = 'block';

    } catch (e) {
        console.error('Erro ao verificar acesso admin:', e);
        window.location.href = 'index.html';
    }
}

// Controle de Abas
window.switchTab = function(tabId) {
    // Remove active de todas as abas (botões)
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(t => t.classList.remove('active'));

    // Remove active de todos os conteúdos
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));

    // Adiciona active no botão clicado
    // Como os botões chamam switchTab('id'), e têm onclick correspondente,
    // vamos pegar o target baseado num map ou pelo event, 
    // mas de forma mais fácil: procurar o botão que tem onclick="switchTab('id')"
    const btn = document.querySelector(`.admin-tab[onclick="switchTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');

    // Adiciona active no conteúdo alvo
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (targetContent) targetContent.classList.add('active');
};
