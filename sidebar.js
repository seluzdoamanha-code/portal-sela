(function() {
    // Aplica o tema salvo imediatamente para evitar piscar cores
    const temaSalvo = localStorage.getItem('central_sela_theme') || 'theme-dark';
    if (temaSalvo) {
        document.body.className = temaSalvo;
    }

    // Usamos variáveis locais (não exportadas pro window) para não dar conflito
    // com outros arquivos js (ex: app.js, entidade.js) que também declaram SUPABASE_URL.
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

    const sidebarDb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    document.addEventListener('DOMContentLoaded', async () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const sidebarHTML = `
            <aside class="sidebar" style="display: flex; flex-direction: column;">
                <div class="logo-area" style="display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
                    <div style="display: flex; justify-content: center; width: 100%;"><img src="logo_sela_color.png" alt="Logo SELA" style="height: 40px; width: 40px; border-radius: 50%; object-fit: cover;"></div>
                    
                </div>
                <nav class="main-nav custom-scrollbar" id="sidebarNav" style="flex: 1; overflow-y: auto;">
                    <a href="index.html" class="nav-item ${currentPage === 'index.html' ? 'active' : ''}" title="Início / Mural">🏠</a>
                    <a href="atividades.html" class="nav-item ${currentPage === 'atividades.html' ? 'active' : ''}" title="Atividades">📅</a>
                    <a href="pessoas.html" class="nav-item ${currentPage === 'pessoas.html' || currentPage === 'perfil.html' ? 'active' : ''}" title="Pessoas & Perfis">👥</a>
                    
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>

                    <div id="dynamicShortcuts" style="display: contents;">
                        <div style="padding: 16px; color: var(--text-muted); font-size: 12px; text-align: center;">Carregando Atalhos...</div>
                    </div>
                    
                    ${window.isAdminGlobal && window.isAdminGlobal() ? `
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>
                    <a href="admin.html" class="nav-item ${currentPage === 'admin.html' ? 'active' : ''}" title="Administração Global">🛠️</a>
                    ` : ''}
                    ${window.isAdmin && window.isAdmin() ? `
                    <a href="config.html" class="nav-item ${currentPage === 'config.html' ? 'active' : ''}" title="Configurações">⚙️</a>
                    ` : ''}
                </nav>
                
                </aside>
        `;

        const existingSidebar = document.querySelector('aside.sidebar');
        const mobileHeaderHTML = `
            <div class="mobile-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="logo_sela_color.png" alt="Logo" style="height: 32px; border-radius: 50%;">
                    <h2 style="font-size: 16px; margin: 0; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Portal SELA</h2>
                </div>
                <!-- Perfil icon for mobile (optional) -->
                <div id="mobileProfileArea"></div>
            </div>
        `;
        
        const bottomNavHTML = `
            <nav class="bottom-nav">
                <a href="index.html" class="bottom-nav-item ${currentPage === 'index.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🏠</span>
                    <span class="bottom-nav-text">Início</span>
                </a>
                <a href="atividades.html" class="bottom-nav-item ${currentPage === 'atividades.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">📅</span>
                    <span class="bottom-nav-text">Atividades</span>
                </a>
                <a href="pessoas.html" class="bottom-nav-item ${currentPage === 'pessoas.html' || currentPage === 'perfil.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">👥</span>
                    <span class="bottom-nav-text">Pessoas</span>
                </a>
                ${window.isAdminGlobal && window.isAdminGlobal() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin Global</span>
                </a>
                ` : ''}
                ${window.isAdmin && window.isAdmin() ? `
                <a href="config.html" class="bottom-nav-item ${currentPage === 'config.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">⚙️</span>
                    <span class="bottom-nav-text">Config.</span>
                </a>
                ` : ''}
            </nav>
        `;
        
        const sideSheetHTML = `
            <div id="globalSideSheetOverlay" class="side-sheet-overlay" onclick="fecharSideSheet()"></div>
            <div id="globalSideSheet" class="side-sheet">
                <div class="side-sheet-header">
                    <h3 id="globalSideSheetTitle">Analisar Solicitação</h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-expand" onclick="toggleExpandSideSheet()" style="background:transparent; border:none; color:var(--text-muted); font-size:18px; cursor:pointer; margin-right: 4px;" title="Expandir Tela">⛶</button>
                        <button class="btn-close" onclick="fecharSideSheet()" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; line-height: 1;">&times;</button>
                    </div>
                </div>
                <div id="globalSideSheetContent" class="side-sheet-content">
                </div>
            </div>
        `;

        if (existingSidebar) {
            existingSidebar.outerHTML = sidebarHTML;
            if (!document.querySelector('.mobile-header')) {
                const container = document.querySelector('.app-container');
                container.insertAdjacentHTML('afterbegin', mobileHeaderHTML);
                container.insertAdjacentHTML('beforeend', bottomNavHTML);
                container.insertAdjacentHTML('beforeend', sideSheetHTML);
            }
        } else {
            const container = document.querySelector('.app-container');
            if (container) {
                container.insertAdjacentHTML('afterbegin', mobileHeaderHTML);
                container.insertAdjacentHTML('afterbegin', sidebarHTML);
                container.insertAdjacentHTML('beforeend', bottomNavHTML);
                container.insertAdjacentHTML('beforeend', sideSheetHTML);
            }
        }
        
        window.abrirSideSheet = function(titulo, htmlConteudo) {
            const titleEl = document.getElementById('globalSideSheetTitle');
            const contentEl = document.getElementById('globalSideSheetContent');
            const overlay = document.getElementById('globalSideSheetOverlay');
            const sheet = document.getElementById('globalSideSheet');
            if(titleEl) titleEl.textContent = titulo;
            if(contentEl) contentEl.innerHTML = htmlConteudo;
            if(overlay) overlay.classList.add('show');
            if(sheet) sheet.classList.add('show');
        };

        window.fecharSideSheet = function() {
            const overlay = document.getElementById('globalSideSheetOverlay');
            const sheet = document.getElementById('globalSideSheet');
            if(overlay) overlay.classList.remove('show');
            if(sheet) sheet.classList.remove('show');
            const contentEl = document.getElementById('globalSideSheetContent');
            if(contentEl) {
                // optional small delay to clear content after animation
                setTimeout(() => {
                    contentEl.innerHTML = '';
                    if(sheet) sheet.classList.remove('expanded'); // Reset expansion state
                }, 300);
            }
        };

        window.toggleExpandSideSheet = function() {
            const sheet = document.getElementById('globalSideSheet');
            if(sheet) {
                sheet.classList.toggle('expanded');
            }
        };

// Layout Sidebar Modern Slim aplicado
        
        await carregarAtalhosDinamicos();
        await carregarRedesSociais();
        
        // Se a página atual possuir o container da Vitrine, carrega os eventos globais nela!
        if (document.getElementById('vitrineEventos')) {
            await carregarEventosGlobais();
        }

        renderUserProfile();
    });

    async function renderUserProfile() {
        const topbar = document.querySelector('.topbar');
        if (!topbar || !sidebarDb) return;
        
        const { data: { session } } = await sidebarDb.auth.getSession();
        if (!session || !session.user) return;
        
        const userName = session.user.user_metadata?.full_name || session.user.email;
        const userFoto = session.user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=random';
        
        const profileContainer = document.createElement('div');
        profileContainer.className = 'topbar-profile-area';
        profileContainer.innerHTML = `
            <div id="btnMeuPerfil" class="topbar-profile-btn" title="Meu Perfil" style="padding-left: 12px; padding-right: 4px;">
                <span>${userName}</span>
                <img src="${userFoto}" alt="Foto">
            </div>
            <button id="btnLogout" title="Sair" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.1)'; this.style.color='#ef4444';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-muted)';">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
        `;
        
        topbar.appendChild(profileContainer);

        const doLogout = async () => {
            if(sidebarDb) {
                await sidebarDb.auth.signOut();
                window.location.href = 'login.html';
            }
        };

        const goMeuPerfil = async () => {
            if (sidebarDb && session && session.user && session.user.email) {
                const { data } = await sidebarDb.from('pessoas').select('id').eq('email', session.user.email).single();
                if (data) {
                    window.location.href = 'perfil.html?id=' + data.id;
                } else {
                    alert("O seu e-mail não está associado a nenhum perfil na lista de Pessoas.");
                }
            }
        };

        document.getElementById('btnLogout').addEventListener('click', doLogout);
        
        document.getElementById('btnMeuPerfil').addEventListener('click', goMeuPerfil);
    }

    async function carregarAtalhosDinamicos() {
        const container = document.getElementById('dynamicShortcuts');
        if (!sidebarDb) return;
        
        try {
            const { data: { session } } = await sidebarDb.auth.getSession();
            if (!session || !session.user) {
                container.innerHTML = '';
                return;
            }
            const userEmail = session.user.email;

            const { data, error } = await sidebarDb
                .from('usuario_atalhos')
                .select('estrutura_id, estruturas(id, nome, tipo)')
                .eq('email', userEmail);
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            const estruturas = data
                .map(d => d.estruturas)
                .filter(Boolean);
                
            estruturas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            
            let html = '';
            estruturas.forEach(d => {
                const icon = window.obterIconeEstrutura(d.nome, d.tipo);
                
                const urlParams = new URLSearchParams(window.location.search);
                const isActive = (window.location.pathname.includes('hub.html') && urlParams.get('id') == d.id);
                
                html += `<a href="hub.html?id=${d.id}&tipo=${d.tipo}" class="nav-item ${isActive ? 'active' : ''}" title="${d.nome}">${icon}</a>`;
            });
            
            container.innerHTML = html;
        } catch (err) {
            console.warn("Erro ao carregar atalhos dinâmicos.", err);
            container.innerHTML = '';
        }
    }

    async function carregarRedesSociais() {
        const container = document.getElementById('socialLinks');
        if (!sidebarDb) return;
        
        try {
            const { data, error } = await sidebarDb.from('configuracoes').select('*');
            if (error) throw error;
            
            if (!data) return;
            
            let html = '';
            const configMap = {};
            data.forEach(c => configMap[c.chave] = c.valor);
            
            if (configMap['social_youtube'] === 'true') {
                html += `<a href="${configMap['link_youtube'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">▶️</a>`;
            }
            if (configMap['social_instagram'] === 'true') {
                html += `<a href="${configMap['link_instagram'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">📸</a>`;
            }
            if (configMap['social_facebook'] === 'true') {
                html += `<a href="${configMap['link_facebook'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">📘</a>`;
            }
            if (configMap['social_tiktok'] === 'true') {
                html += `<a href="${configMap['link_tiktok'] || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; font-size: 16px;">🎵</a>`;
            }
            
            container.innerHTML = html;
        } catch (err) {
            console.warn("Erro ao carregar redes sociais.", err);
        }
    }

    // Função global de obtenção de ícone
    window.obterIconeEstrutura = function(nome, tipo) {
        const n = (nome || '').toLowerCase();
        
        // Regras por Nome
        if (n.includes('atendimento')) return '🤝';
        if (n.includes('biblioteca')) return '📚';
        if (n.includes('cesta')) return '📦';
        if (n.includes('irradia')) return '✨';
        if (n.includes('macarronada')) return '🍝';
        if (n.includes('palestra')) return '🎤';
        if (n.includes('sopa')) return '🍲';
        if (n.includes('asilo')) return '👵';
        
        if (n.includes('assistência') || n.includes('assistencia')) return '💖';
        if (n.includes('comunicação') || n.includes('comunicacao')) return '📢';
        if (n.includes('diretoria')) return '👥';
        if (n.includes('doutrinário') || n.includes('doutrinario')) return '📖';
        if (n.includes('espiritual')) return '🕯️';
        if (n.includes('eventos')) return '🎉';
        if (n.includes('infância') || n.includes('infancia')) return '🧸';
        if (n.includes('secretaria')) return '📝';
        if (n.includes('tesouraria') || n.includes('financeiro')) return '💰';
        
        if (n.includes('joanna')) return '🌻';
        if (n.includes('livro dos espíritos') || n.includes('livro dos espiritos')) return '📘';
        if (n.includes('ciclo 1')) return '🎨';
        if (n.includes('ciclo 2')) return '🚀';
        if (n.includes('evangelho')) return '🙏';
        if (n.includes('evangelização') || n.includes('evangelizacao')) return '👶';

        // Regras de fallback por Tipo
        if (tipo === 'Departamento') return '🏢';
        if (tipo === 'Atividade') return '🎯';
        if (tipo === 'Turma') return '🌱';
        if (tipo === 'Família') return '🏠';
        
        return '📌';
    };

    // Exportar funções para o escopo global para que config.js consiga recarregar o menu
    window.carregarAtalhosDinamicos = carregarAtalhosDinamicos;
    window.carregarRedesSociais = carregarRedesSociais;

    // ==========================================
    // VITRINE DE EVENTOS GLOBAIS (Compartilhada)
    // ==========================================
    async function carregarEventosGlobais() {
        const containerVitrine = document.getElementById('vitrineEventos');
        const listaEventos = document.getElementById('listaEventosGlobais');
        
        if (!sidebarDb || !containerVitrine || !listaEventos) return;
        
        try {
            const hojeIso = new Date().toISOString();
            
            const { data, error } = await sidebarDb
                .from('agenda')
                .select('*, estruturas(nome)')
                .eq('visibilidade', 'Global')
                .gte('data_hora_inicio', hojeIso)
                .order('data_hora_inicio', { ascending: true })
                .limit(3);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                containerVitrine.style.display = 'flex';
                
                let html = '';
                data.forEach(ev => {
                    const dataInicio = new Date(ev.data_hora_inicio);
                    const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                    const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const organizador = ev.estruturas ? ev.estruturas.nome : 'Portal SELA';
                    
                    html += `
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center; min-width: 300px;">
                        <div style="background: #ef4444; color: white; border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                            <div style="font-size: 14px; font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                            <div style="font-size: 10px; text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${ev.titulo}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${organizador} | ⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                        </div>
                    </div>
                    `;
                });
                
                listaEventos.innerHTML = html;
            } else {
                containerVitrine.style.display = 'none';
            }
        } catch (err) {
            console.warn('Erro na vitrine global:', err);
        }
    }

})();
