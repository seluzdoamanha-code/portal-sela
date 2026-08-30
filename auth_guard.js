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

    // 3.5 Tentar buscar o nome_curto na tabela pessoas
    let nomeCurtoPessoa = null;
    let pessoaId = null;
    try {
        const { data: pessoaData } = await authDb
            .from('pessoas')
            .select('id, nome_curto')
            .eq('email', email)
            .single();
        if (pessoaData) {
            nomeCurtoPessoa = pessoaData.nome_curto;
            pessoaId = pessoaData.id;
        }
    } catch(e) {
        console.warn("Usuário não encontrado na tabela pessoas ou sem nome curto.");
    }

    // 4. Usuário autorizado! 
    // Vamos injetar os dados dele no localStorage para o sidebar.js puxar
    const userProfile = {
        pessoa_id: pessoaId,
        nome: whitelist.nome || session.user.user_metadata.full_name || 'Trabalhador SELA',
        nome_curto: nomeCurtoPessoa || whitelist.nome || session.user.user_metadata.full_name || 'Trabalhador SELA',
        foto: session.user.user_metadata.avatar_url || 'https://ui-avatars.com/api/?name=Sela&background=random',
        email: email,
        nivel_acesso: whitelist.nivel_acesso || 'comum'
    };
    localStorage.setItem('sela_user_profile', JSON.stringify(userProfile));

    
    // Bloquear acesso a páginas de configurações para não-admins
    if (filename === 'config.html' && userProfile.nivel_acesso !== 'admin' && userProfile.nivel_acesso !== 'admin_global') {
        alert("Acesso restrito: Apenas administradores podem acessar as configurações.");
        window.location.replace('index.html');
        return;
    }
    if (filename === 'admin.html' && userProfile.nivel_acesso !== 'admin_global') {
        alert("Acesso restrito: Apenas administradores globais podem acessar a Administração Global.");
        window.location.replace('index.html');
        return;
    }

        alert("Acesso restrito: Apenas administradores podem acessar as configurações.");
        window.location.replace('m_index.html');
        return;
    }
    
    // Inicia notificações globais se houver ID
    if (pessoaId) {
        window.initGlobalNotifications(pessoaId);
    }
}

// Executa imediatamente
checkAuth();

// Funções globais de permissão
window.isAdmin = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        return prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global';
    } catch(e) {
        return false;
    }
};

window.podeEditarPessoas = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global' || prof.nivel_acesso === 'secretaria');
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
        return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global' || prof.nivel_acesso === 'secretaria' || prof.nivel_acesso === 'assistencia');
    } catch(e) {
        return false;
    }
};


window.isAdminGlobal = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        return prof.nivel_acesso === 'admin_global';
    } catch(e) {
        return false;
    }
};

// --- GLOBAL NOTIFICATIONS SYSTEM ---
window.initGlobalNotifications = function(pessoaId) {
    // Apenas injeta se não for tela de login
    const path = window.location.pathname;
    if (path.includes('login.html')) return;
    
    if (!pessoaId) return; // precisa ter vinculado o id na tabela pessoas
    
    const injectUI = () => {
    
    // Injetar o CSS e HTML do SideSheet global no final do body
    const notifHtml = `
    <style>
        .notif-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--primary, #3b82f6);
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 99990;
            font-size: 24px;
        }
        .notif-btn:hover { 
            transform: scale(1.05);
            background: #2563eb; 
        }
        .notif-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #ef4444;
            color: white;
            font-size: 12px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 12px;
            display: none; /* hidden by default */
            border: 2px solid var(--bg-panel, #1e293b);
        }
        
        /* O Side-Sheet (Drawer) */
        .notif-sheet-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 99999;
            opacity: 0;
            visibility: hidden;
            transition: 0.3s;
        }
        .notif-sheet {
            position: absolute; top: 0; right: -400px; bottom: 0;
            width: 100%; max-width: 400px;
            background: var(--bg-panel, #1e293b);
            border-left: 1px solid var(--border, #334155);
            box-shadow: -4px 0 24px rgba(0,0,0,0.3);
            display: flex; flex-direction: column;
            transition: 0.3s transform cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notif-sheet-overlay.open { opacity: 1; visibility: visible; }
        .notif-sheet-overlay.open .notif-sheet { transform: translateX(-400px); }
        
        .notif-header {
            padding: 20px 24px; border-bottom: 1px solid var(--border, #334155);
            display: flex; justify-content: space-between; align-items: center;
        }
        .notif-header h2 { font-size: 18px; margin: 0; color: var(--text-main, #f8fafc); }
        .notif-close { background: transparent; border: none; color: var(--text-muted, #94a3b8); font-size: 24px; cursor: pointer; }
        
        .notif-body {
            flex: 1; overflow-y: auto; padding: 16px;
            display: flex; flex-direction: column; gap: 12px;
        }
        
        .notif-item {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 16px;
            position: relative;
            cursor: pointer;
            transition: background 0.2s;
        }
        .notif-item:hover { background: rgba(255,255,255,0.06); }
        .notif-item.unread { border-left: 3px solid #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .notif-item h4 { margin: 0 0 6px 0; font-size: 14px; color: var(--text-main, #f8fafc); }
        .notif-item p { margin: 0; font-size: 13px; color: var(--text-muted, #94a3b8); line-height: 1.4; }
        .notif-time { font-size: 11px; color: #64748b; margin-top: 8px; text-align: right; }
    </style>
    
    <div class="notif-sheet-overlay" id="globalNotifOverlay">
        <div class="notif-sheet" onclick="event.stopPropagation()">
            <div class="notif-header">
                <h2>Notificações</h2>
                <button class="notif-close" onclick="fecharNotificacoes()">✕</button>
            </div>
            <div class="notif-body" id="globalNotifList">
                <div style="text-align:center; padding:40px; color:#94a3b8; font-size:14px;">Carregando...</div>
            </div>
        </div>
    </div>
    
    <button class="notif-btn" id="btnSinoGlobal" title="Avisos e Lembretes">
        🔔
        <span class="notif-badge" id="badgeNotifCount">0</span>
    </button>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notifHtml);
    
    // Funções de Interação
    window.abrirNotificacoes = function(e) {
        if (e) e.stopPropagation();
        document.getElementById('globalNotifOverlay').classList.add('open');
        carregarNotificacoes();
    };
    window.fecharNotificacoes = function() {
        document.getElementById('globalNotifOverlay').classList.remove('open');
    };
    
    document.getElementById('globalNotifOverlay').addEventListener('click', window.fecharNotificacoes);
    document.getElementById('btnSinoGlobal').addEventListener('click', window.abrirNotificacoes);
    document.querySelector('.notif-close').addEventListener('click', window.fecharNotificacoes);
    
    window.carregarNotificacoes = async function() {
        try {
            const { data, error } = await authDb.from('app_notificacoes')
                .select('*')
                .eq('pessoa_id', pessoaId)
                .order('created_at', { ascending: false })
                .limit(20);
                
            if (error) {
                // Se a tabela ainda não existir (Erro 404/42P01), ignora silenciosamente.
                if(error.code === '42P01') {
                    document.getElementById('globalNotifList').innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8; font-size:14px;">Módulo de notificações ainda não instalado no banco de dados.</div>';
                    return;
                }
                throw error;
            }
            
            atualizarBadgeNotificacoes(data);
            
            const container = document.getElementById('globalNotifList');
            if (!data || data.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8; font-size:14px;">Você não tem nenhuma notificação nova. 🎉</div>';
                return;
            }
            
            let html = '';
            data.forEach(n => {
                const dataFormat = new Date(n.created_at).toLocaleString('pt-BR');
                html += `
                    <div class="notif-item ${n.lida ? '' : 'unread'}" onclick="marcarNotifLida('${n.id}', ${n.lida})">
                        <h4>${n.titulo}</h4>
                        <p>${n.mensagem}</p>
                        <div class="notif-time">${dataFormat}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch(e) {
            console.error(e);
            document.getElementById('globalNotifList').innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar avisos.</div>';
        }
    };
    
    window.atualizarBadgeNotificacoes = function(notifs) {
        const unreadCount = notifs.filter(x => !x.lida).length;
        const badge = document.getElementById('badgeNotifCount');
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'block';
                badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    };
    
    window.marcarNotifLida = async function(id, jaLida) {
        if (jaLida) return; // se já for lida, ignora clique
        try {
            await authDb.from('app_notificacoes').update({ lida: true }).eq('id', id);
            carregarNotificacoes(); // recarrega a lista
        } catch(e) {}
    };
    
    // Busca inicial do contador em background
    setTimeout(carregarNotificacoes, 1500);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectUI);
    } else {
        injectUI();
    }
};
