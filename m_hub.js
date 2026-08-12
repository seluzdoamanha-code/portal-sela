(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaAtual = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            alert('ID da estrutura não fornecido.');
            window.location.href = 'm_atividades.html';
            return;
        }

        // Configurar fechamento do Bottom Sheet ao clicar no backdrop
        const backdrop = document.getElementById('mBottomSheetBackdrop');
        if(backdrop) {
            backdrop.addEventListener('click', () => {
                document.getElementById('mBottomSheet').classList.remove('active');
                backdrop.classList.remove('active');
            });
        }

        await carregarEstrutura(id);
    });

    async function carregarEstrutura(id) {
        try {
            const { data, error } = await db.from('estruturas').select('*').eq('id', id).single();
            if (error) throw error;
            if (!data) throw new Error("Estrutura não encontrada.");
            
            estruturaAtual = data;
            
            renderizarDetalhes();
            renderizarApps();
            configurarMenuSubindo();

        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mHubTitle').innerText = 'Erro ao carregar';
        }
    }

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    function renderizarDetalhes() {
        document.getElementById('mHubTitle').innerText = estruturaAtual.nome;
        document.getElementById('mHubName').innerText = estruturaAtual.nome;
        document.getElementById('mHubType').innerText = estruturaAtual.tipo;
        document.getElementById('mHubIcon').innerText = obterIniciais(estruturaAtual.nome);
        
        const descEl = document.getElementById('mHubDesc');
        if (estruturaAtual.descricao && estruturaAtual.descricao.trim() !== '') {
            descEl.innerText = estruturaAtual.descricao;
            descEl.style.display = 'block';
        } else {
            descEl.style.display = 'none';
        }

        const tipo = estruturaAtual.tipo;
        let bg = 'linear-gradient(135deg, #64748b, #475569)';
        if (tipo === 'Departamento') bg = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        else if (tipo === 'Atividade') bg = 'linear-gradient(135deg, #10b981, #059669)';
        else if (tipo === 'Família') bg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        else if (tipo === 'Turma') bg = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        document.getElementById('mHubIcon').style.background = bg;

        // Dynamic Nav Name
        const navName = document.getElementById('dynamicActivityName');
        const nomeCurto = estruturaAtual.nome.split(' ')[0];
        if (navName) navName.innerText = (nomeCurto.length > 10 ? nomeCurto.substring(0, 10) + '...' : nomeCurto);
    }

    function renderizarApps() {
        const container = document.getElementById('mAppsGrid');
        let html = '';
        const nome = (estruturaAtual.nome || '').toLowerCase();

        // Ícones SVG Limpos
        if (nome.includes('assistência') || nome.includes('social')) {
            html += `
                <a href="m_ass_familias.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div class="m-app-name">Famílias</div>
                </a>
                <a href="m_dash_entregas.html" class="m-app-card">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    </div>
                    <div class="m-app-name">Entregas</div>
                </a>
                <a href="m_dash_visitas.html" class="m-app-card">
                    <div class="m-app-icon" style="color: #3b82f6;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div class="m-app-name">Visitas</div>
                </a>
                <a href="m_dash_ocorrencias.html" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <span class="m-app-label">Ocorrências</span>
                </a>
                
                <a href="m_ass_estatisticas.html" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="16" y1="12" x2="16" y2="16"/><line x1="8" y1="14" x2="8" y2="16"/></svg>
                    </div>
                    <span class="m-app-label">Estatísticas</span>
                </a>

                <a href="m_ass_config.html" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(148, 163, 184, 0.1); color: #94a3b8;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <span class="m-app-label">Config</span>
                </a>
            `;
            // Dynamic Icon in Nav
            document.getElementById('dynamicActivityIconContainer').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>';
        } else if (nome.includes('irradiação')) {
            html += `
                <a href="m_irradiacao.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">✨</span>
                    </div>
                    <div class="m-app-name">Irradiação Espiritual</div>
                </a>
                <a href="m_irradiacao_gestao.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">⚙️</span>
                    </div>
                    <div class="m-app-name">Gestão de Irradiações</div>
                </a>
                <a href="#" class="m-app-card" onclick="alert('Módulo em breve no celular!'); return false;">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <div class="m-app-name">Mensagens</div>
                </a>
            `;
            document.getElementById('dynamicActivityIconContainer').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
        } else if (nome.includes('atendimento')) {
            html += `
                <a href="m_atendimento_pedido.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">🤝</span>
                    </div>
                    <div class="m-app-name">Atendimento Fraterno</div>
                </a>
                <a href="m_atendimento_gestao.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">⚙️</span>
                    </div>
                    <div class="m-app-name">Gestão de Atendimentos</div>
                </a>
            `;
        } else if (nome.includes('tesouraria') || nome.includes('financeiro')) {
             html += `
                <a href="#" class="m-app-card" onclick="alert('Lançamentos em breve!'); return false;">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                    </div>
                    <div class="m-app-name">Lançamentos</div>
                </a>
                <a href="#" class="m-app-card" onclick="alert('Relatórios em breve!'); return false;">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <div class="m-app-name">Relatórios</div>
                </a>
            `;
            document.getElementById('dynamicActivityIconContainer').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
        } else {
            // Genéricos
            html += `
                <a href="#" class="m-app-card" onclick="alert('Mural / Feed em breve no celular!'); return false;">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div class="m-app-name">Mural</div>
                </a>
                <a href="#" class="m-app-card" onclick="alert('Metas em breve!'); return false;">
                    <div class="m-app-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="m-app-name">Metas</div>
                </a>
            `;
            document.getElementById('dynamicActivityIconContainer').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
        }

        container.innerHTML = html;
    }

    function configurarMenuSubindo() {
        const sheetContent = document.getElementById('mBottomSheetContent');
        
        sheetContent.innerHTML = `
            <a href="m_organograma.html?id=${estruturaAtual.id}" class="m-sheet-item">
                <span class="m-sheet-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                Equipe & Organograma
            </a>
            <a href="m_agenda.html?id=${estruturaAtual.id}" class="m-sheet-item">
                <span class="m-sheet-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                Agenda
            </a>
            <a href="#" class="m-sheet-item" onclick="alert('Documentos em breve no celular!'); fecharGaveta(); return false;">
                <span class="m-sheet-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
                Documentos Gerais
            </a>
            <a href="m_atividades.html" class="m-sheet-item">
                <span class="m-sheet-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg></span>
                Voltar para Atividades
            </a>
        `;
    }
    
    window.fecharGaveta = function() {
        document.getElementById('mBottomSheet').classList.remove('active');
        document.getElementById('mBottomSheetBackdrop').classList.remove('active');
    };

})();
