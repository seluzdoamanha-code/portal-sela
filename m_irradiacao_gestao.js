let currentTab = 'pendentes';
let currentDia = '';
let dataFull = [];
let editandoId = null;
window.cartoesEspeciais = [];

const diasSemanaList = [
    'Todos', 'Segunda-feira', 'Terça-feira',
    'Quarta-feira (Desobsessão)', 'Quarta-feira (Desencarnado)',
    'Quinta-feira'
];

document.addEventListener('DOMContentLoaded', () => {
    // Inject Side-Sheet if not present
    if (!document.getElementById('globalSideSheet')) {
        const styleSheet = `
            <style>
                .side-sheet-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
                    z-index: 1050; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
                }
                .side-sheet-overlay.show { opacity: 1; pointer-events: auto; }
                .side-sheet {
                    position: fixed; top: 0; right: 0; width: 400px; max-width: 90vw; height: 100vh;
                    background: var(--bg-card, #1e293b); box-shadow: -4px 0 15px rgba(0,0,0,0.1);
                    z-index: 1100; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; flex-direction: column;
                }
                .side-sheet.show { transform: translateX(0); }
                .side-sheet-header {
                    padding: 20px 24px; border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                }
                .side-sheet-header h3 { margin: 0; font-size: 18px; color: var(--accent); }
                .side-sheet-content { padding: 24px; padding-bottom: 120px; flex: 1; overflow-y: auto; }
            </style>
        `;
        const sideSheetHTML = `
            <div id="globalSideSheetOverlay" class="side-sheet-overlay" onclick="fecharSideSheet()"></div>
            <div id="globalSideSheet" class="side-sheet">
                <div class="side-sheet-header">
                    <h3 id="globalSideSheetTitle">Analisar Solicitação</h3>
                    <button class="btn-close" onclick="fecharSideSheet()" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer;">&times;</button>
                </div>
                <div id="globalSideSheetContent" class="side-sheet-content">
                </div>
            </div>
        `;
        document.head.insertAdjacentHTML('beforeend', styleSheet);
        document.body.insertAdjacentHTML('beforeend', sideSheetHTML);
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
        if(contentEl) setTimeout(() => contentEl.innerHTML = '', 300);
    };

    carregarLista();
});

window.voltarParaHub = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const estruturaId = urlParams.get('id') || localStorage.getItem('estrutura_atual');
    if (estruturaId) {
        window.location.href = `m_hub.html?id=${estruturaId}&tipo=irradiacao`;
    } else {
        window.location.href = 'm_atividades.html';
    }
}

window.mudarAba = function(aba) {
    currentTab = aba;

    // Atualizar UI das abas
    document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab_${aba}`).classList.add('active');

    const filters = document.getElementById('filtersContainer');
    const lista = document.getElementById('listaGestaoIrradiacoes');
    const estatisticas = document.getElementById('estatisticasContainer');

    if (aba === 'estatisticas') {
        if (filters) filters.style.display = 'none';
        if (lista) lista.style.display = 'none';
        if (estatisticas) estatisticas.style.display = 'block';
        carregarEstatisticasIrradiacaoMobile();
    } else {
        if (filters) filters.style.display = 'flex';
        if (lista) lista.style.display = 'block';
        if (estatisticas) estatisticas.style.display = 'none';
        carregarLista();
    }
}

window.setDia = function(dia) {
    currentDia = dia;

    // Atualizar UI dos filtros
    document.querySelectorAll('.m-filter-pill').forEach(p => p.classList.remove('active'));

    if (dia === '') {
        document.getElementById('pill_todos').classList.add('active');
    } else {
        const p = document.getElementById(`pill_${formatDiaId(dia)}`);
        if (p) p.classList.add('active');
    }

    renderLista();
}

function formatDiaId(dia) {
    if (dia === 'Segunda-feira') return 'segunda';
    if (dia === 'Terça-feira') return 'terca';
    if (dia === 'Quarta-feira (Desobsessão)') return 'qua_desob';
    if (dia === 'Quarta-feira (Desencarnado)') return 'qua_desenc';
    if (dia === 'Quinta-feira') return 'quinta';
    return '';
}

window.carregarLista = async function() {
    const listaEl = document.getElementById('listaGestaoIrradiacoes');
    listaEl.innerHTML = '<div class="empty-state">Carregando dados...</div>';

    const estruturaId = localStorage.getItem('estrutura_atual');

    try {
        let query = db.from('app_irradiacao_solicitacoes').select('*');
        if (estruturaId) {
            query = query.eq('estrutura_id', estruturaId);
        }

        let targetStatus = currentTab;
        if (currentTab === 'ativos' || currentTab === 'encerra_semana') targetStatus = 'ativo';
        if (currentTab === 'pendentes') targetStatus = 'pendente';
        if (currentTab === 'arquivamento') targetStatus = 'historico';

        query = query.eq('status', targetStatus).order('nome_solicitado', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        dataFull = data || [];
        
        // Ordena localmente para ignorar emojis e caracteres especiais no início do nome
        dataFull.sort((a, b) => {
            const nameA = (a.nome_solicitado || '').replace(/[^a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ0-9]/g, '').trim();
            const nameB = (b.nome_solicitado || '').replace(/[^a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ0-9]/g, '').trim();
            return nameA.localeCompare(nameB, 'pt-BR');
        });
        // Fetch Special Cards if admin/manager
        try {
            const { data: configData, error: configErr } = await db.from('configuracoes').select('valor').eq('chave', 'irradiacao_cards_especiais').single();
            if (!configErr && configData && configData.valor) {
                let parsed = [];
                try {
                    parsed = typeof configData.valor === 'string' ? JSON.parse(configData.valor) : configData.valor;
                } catch(e){}
                if (Array.isArray(parsed)) window.cartoesEspeciais = parsed;
            }
        } catch(e) {
            console.warn("Could not fetch special cards", e);
        }

        renderLista();

    } catch (err) {
        console.error(err);
        listaEl.innerHTML = `<div class="empty-state" style="color:var(--danger)">Erro ao carregar os dados.<br>${err.message}</div>`;
    }
}

function atualizarContadores(dados) {
    let counts = {
        'Todos': dados.length,
        'Segunda-feira': 0,
        'Terça-feira': 0,
        'Quarta-feira (Desobsessão)': 0,
        'Quarta-feira (Desencarnado)': 0,
        'Quinta-feira': 0
    };

    dados.forEach(item => {
        const d = item.dias_semana || '';
        if (d.includes('Segunda-feira')) counts['Segunda-feira']++;
        if (d.includes('Terça-feira')) counts['Terça-feira']++;
        if (d.includes('Quarta-feira (Desobsessão)')) counts['Quarta-feira (Desobsessão)']++;
        if (d.includes('Quarta-feira (Desencarnado)')) counts['Quarta-feira (Desencarnado)']++;
        if (d.includes('Quinta-feira')) counts['Quinta-feira']++;
    });

    document.getElementById('count_Todos').innerText = `(${counts['Todos']})`;
    document.getElementById('count_Segunda-feira').innerText = `(${counts['Segunda-feira']})`;
    document.getElementById('count_Terça-feira').innerText = `(${counts['Terça-feira']})`;
    document.getElementById('count_Quarta-feira (Desobsessão)').innerText = `(${counts['Quarta-feira (Desobsessão)']})`;
    document.getElementById('count_Quarta-feira (Desencarnado)').innerText = `(${counts['Quarta-feira (Desencarnado)']})`;
    document.getElementById('count_Quinta-feira').innerText = `(${counts['Quinta-feira']})`;
}

function renderLista() {
    const listaEl = document.getElementById('listaGestaoIrradiacoes');

    let filteredBase = dataFull;

    if (currentTab === 'encerra_semana') {
        filteredBase = filteredBase.filter(item => {
            const semanas_alvo = item.semanas_alvo || 4;
            const leituras = item.leituras || 0;
            return (semanas_alvo - leituras) === 1;
        });
    } else if (currentTab === 'arquivamento') {
        filteredBase = filteredBase.filter(item => {
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const lastLog = new Date(logs[logs.length - 1]);
                if (!isNaN(lastLog)) {
                    const diffTime = Math.abs(new Date() - lastLog);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 30;
                }
            }
            return false;
        });
    } else if (currentTab === 'historico') {
        filteredBase = filteredBase.filter(item => {
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const lastLog = new Date(logs[logs.length - 1]);
                if (!isNaN(lastLog)) {
                    const diffTime = Math.abs(new Date() - lastLog);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                }
            }
            return true;
        });
    }

    atualizarContadores(filteredBase);

    let filtered = filteredBase;
    if (currentDia !== '') {
        filtered = filteredBase.filter(item => (item.dias_semana || '').includes(currentDia));
    }

    // Controle do botão de Especiais
    const especiaisBtnContainer = document.getElementById('especiaisBtnContainer');
    if (especiaisBtnContainer) {
        if (currentTab === 'ativos') {
            const profStr = localStorage.getItem('sela_user_profile');
            const prof = profStr ? JSON.parse(profStr) : {};
            const email = (prof.email || '').toLowerCase().trim();
            const isAdmin = (typeof window.isAdmin === 'function' && window.isAdmin()) || 
                            prof.nivel_acesso === 'admin' || 
                            prof.nivel_acesso === 'admin_global';
            
            const canManage = isAdmin || (email === 'wmarques@gmail.com');
            especiaisBtnContainer.style.display = canManage ? 'block' : 'none';
        } else {
            especiaisBtnContainer.style.display = 'none';
        }
    }

    // Generate alphabet index
    const filtrosLetrasContainer = document.getElementById('filtrosLetrasIrr');
    if (filtrosLetrasContainer) {
        if (!filtered || filtered.length === 0) {
            filtrosLetrasContainer.style.display = 'none';
        } else {
            const letrasPresentes = new Set();
            filtered.forEach(item => {
                if (item.nome_solicitado) {
                    const match = item.nome_solicitado.match(/[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/);
                    if (match) {
                        const firstChar = match[0].toUpperCase();
                        const letter = firstChar.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        if (/[A-Z]/.test(letter)) letrasPresentes.add(letter);
                    }
                }
            });
            
            if (letrasPresentes.size > 0) {
                const letrasArray = Array.from(letrasPresentes).sort();
                let letrasHtml = '';
                letrasArray.forEach(l => {
                    letrasHtml += `<button class="m-filter-pill" style="padding: 4px 10px; font-size: 13px; font-weight: 600; min-width: 32px;" onclick="scrollToLetraIrr('${l}')">${l}</button>`;
                });
                filtrosLetrasContainer.innerHTML = letrasHtml;
                filtrosLetrasContainer.style.display = 'flex';
            } else {
                filtrosLetrasContainer.style.display = 'none';
            }
        }
    }

    if (filtered.length === 0 && window.cartoesEspeciais.length === 0) {
        listaEl.innerHTML = '<div class="empty-state">Nenhum registro encontrado nesta visão.</div>';
        return;
    }

    let html = '';

    // Renderizar Cartões Especiais (só na aba ativos)
    if (currentTab === 'ativos') {
        let especiaisFiltrados = window.cartoesEspeciais;
        if (currentDia !== '') {
            especiaisFiltrados = especiaisFiltrados.filter(c => (c.dia || '').includes(currentDia));
        }
        
        // Ordenar por ordem
        especiaisFiltrados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        especiaisFiltrados.forEach(esp => {
            html += `
                <div class="m-card m-card-especial">
                    <div class="m-card-header">
                        <div style="width: 100%;">
                            <div class="m-card-title" style="color: #f59e0b; font-size: 16px;">⭐ ${esp.titulo}</div>
                            ${esp.subtitulo ? `<div class="m-card-subtitle" style="color: var(--text-main); font-weight: 500; margin-top: 4px;">${esp.subtitulo}</div>` : ''}
                        </div>
                    </div>
                    <div class="m-card-meta" style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
                        Cartão Especial Fixo • Dia: <span style="color: var(--text-main);">${esp.dia}</span>
                    </div>
                </div>
            `;
        });
    }

    filtered.forEach(item => {
        const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');
        const endStr = item.endereco ? item.endereco : 'Endereço não informado';

        let primeiraLetra = '';
        const match = (item.nome_solicitado || '').match(/[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/);
        if (match) {
            const firstChar = match[0].toUpperCase();
            primeiraLetra = firstChar.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        // Escape para botões
        const safeNome = (item.nome_solicitado || '').replace(/'/g, "\\'");
        const safeEnd = (item.endereco || '').replace(/'/g, "\\'");
        const safeDias = (item.dias_semana || '').replace(/'/g, "\\'");
        const semanasAlvoStr = item.semanas_alvo || 4;

        let actions = '';
        let progressHtml = '';

        let logsGlobal = item.log_datas_leituras;
        if (typeof logsGlobal === 'string') {
            try { logsGlobal = JSON.parse(logsGlobal); } catch (e) { logsGlobal = []; }
        }
        const arrayLogs = Array.isArray(logsGlobal) ? logsGlobal : [];
        const totalLeiturasHtml = arrayLogs.length > 0 ? ` | Irradiações:&nbsp;<strong style="color: var(--text-main);">${arrayLogs.length}</strong>` : '';

        if (currentTab === 'pendentes') {
            progressHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Status: <strong style="color: var(--warning);">Pendente</strong>${totalLeiturasHtml}</div>`;
            
            // Encode data for Side-Sheet
            const itemDataStr = encodeURIComponent(JSON.stringify({
                id: item.id,
                nome: item.nome_solicitado,
                endereco: item.endereco,
                dias: item.dias_semana,
                semanasAlvo: item.semanas_alvo || 4,
                criadoPor: item.criado_por,
                dataPed: dataPed,
                totalLeiturasHtml: totalLeiturasHtml
            }));

            actions = `
                <button class="btn-action" style="width: 100%; background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 12px; gap:8px; height: auto;" onclick="window.abrirSideSheetPendente('${itemDataStr}')">
                    <span style="font-size: 18px;">📋</span>
                    <span style="font-size: 14px; font-weight: 600;">Analisar Solicitação</span>
                </button>
            `;
        } else if (currentTab === 'ativos' || currentTab === 'encerra_semana') {
            const leituras = item.leituras || 0;
            const semanas_alvo = item.semanas_alvo || 4;
            let caixinhas = '';
            for (let i = 1; i <= semanas_alvo; i++) {
                if (i <= leituras) {
                    caixinhas += `<span class="bola-irradiacao preenchida" style="display:inline-block; width:16px; height:16px; background:#10b981; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                } else {
                    caixinhas += `<span class="bola-irradiacao vazia" style="display:inline-block; width:16px; height:16px; border:2px solid #334155; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                }
            }

            let lastDateHtml = 'N/A';
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const lastLog = logs[logs.length - 1];
                const d = new Date(lastLog);
                if (!isNaN(d)) {
                    const lastDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const today = new Date();
                    const isToday = (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear());
                    if (isToday) {
                        lastDateHtml = `<strong style="color: #10b981;">Hoje</strong>`;
                    } else {
                        lastDateHtml = lastDateStr;
                    }
                }
            }

            let checkboxRepetir = `
                <label style="font-size: 12px; display: flex; align-items: center; gap: 4px; color: var(--text-muted); cursor: pointer; margin: 0;">
                    <input type="checkbox" id="chk_renovar_${item.id}" onchange="toggleRenovacaoAutomaticaMobile('${item.id}', this.checked)" ${item.renovacao_automatica ? 'checked' : ''}>
                    Repetir
                </label>
            `;

            progressHtml = `
                <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                    <div>Atual: <strong style="color:var(--text-main);">${leituras}/${semanas_alvo}</strong> | Total: <strong style="color:var(--text-main);">${arrayLogs.length}</strong> | Última: ${lastDateHtml}</div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-top: 2px;">
                        ${checkboxRepetir}
                        <div style="color: var(--border);">|</div>
                        <div style="display: flex; align-items: center; gap: 2px;">${caixinhas}</div>
                    </div>
                </div>
            `;

            actions = `
                <button id="btn_ler_${item.id}" onclick="marcarLeituraIrrMobile(this, '${item.id}', ${leituras}, ${semanas_alvo})" class="btn-action" style="flex: 1; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 600;">Registrar</span>
                </button>
                <button class="btn-action" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})" style="flex: 1; background: transparent; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 500;">Editar</span>
                </button>
                <button class="btn-action" onclick="arquivar('${item.id}')" style="flex: 1; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 500;">Arquivar</span>
                </button>
            `;
        } else if (currentTab === 'historico' || currentTab === 'arquivamento') {
            let lastDateInfo = '';
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const lastLog = new Date(logs[logs.length - 1]);
                if (!isNaN(lastLog)) {
                    lastDateInfo = ` | Última: <strong style="color: #cbd5e1;">${lastLog.toLocaleDateString('pt-BR')}</strong>`;
                }
            }
            progressHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Status: Histórico${totalLeiturasHtml}${lastDateInfo}</div>`;

            actions = `
                <button class="btn-action" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')" style="flex: 1; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 500;">Reativar</span>
                </button>
                <button class="btn-action" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})" style="flex: 1; background: transparent; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 500;">Editar</span>
                </button>
                <button class="btn-action" onclick="excluir('${item.id}')" style="flex: 1; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; display:flex; align-items:center; justify-content:center; padding: 6px; height: auto;">
                    <span style="font-size: 12px; font-weight: 500;">Excluir</span>
                </button>
            `;
        }

        html += `
            <div class="m-card" id="card_irr_${item.id}" data-letra="${primeiraLetra}">
                <div class="m-card-header">
                    <div style="width: 100%;">
                        <div class="m-card-title">${item.nome_solicitado}</div>
                        <div class="m-card-subtitle">📍 ${endStr}</div>
                    </div>
                </div>
                <div class="m-card-meta" style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                    <div>Em: ${dataPed} | Dia: <span style="color: var(--text-main);">${item.dias_semana}</span></div>
                    ${progressHtml}
                </div>
                <div class="m-card-actions" style="display: flex; gap: 8px;">
                    ${actions}
                </div>
            </div>
        `;
    });

    listaEl.innerHTML = html;
}

window.scrollToLetraIrr = function(letra) {
    const card = document.querySelector(`#listaGestaoIrradiacoes div[data-letra="${letra}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Efeito de destaque rápido
        const originalBg = card.style.backgroundColor;
        card.style.transition = 'background-color 0.5s ease';
        card.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
        setTimeout(() => {
            card.style.backgroundColor = originalBg || 'var(--bg-card)';
        }, 1500);
    }
}

// ----------------------------------------------------
// BOTTOM SHEET (EDICAO)
// ----------------------------------------------------
window.abrirEdicao = function(id, nome, end, dias, semanas) {
    const html = `
        <form onsubmit="window.salvarEdicaoIrradiacaoSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Nome</label>
                <input type="text" id="editIrrNomeSS" value="${nome}" required class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Endereço</label>
                <input type="text" id="editIrrEnderecoSS" value="${end}" required class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Dia da Semana</label>
                <select id="editIrrDiaSS" class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
                    <option value="Segunda-feira" ${dias === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                    <option value="Terça-feira" ${dias === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                    <option value="Quarta-feira (Desobsessão)" ${dias === 'Quarta-feira (Desobsessão)' ? 'selected' : ''}>Quarta-feira (Desobsessão)</option>
                    <option value="Quarta-feira (Desencarnado)" ${dias === 'Quarta-feira (Desencarnado)' ? 'selected' : ''}>Quarta-feira (Desencarnado)</option>
                    <option value="Quinta-feira" ${dias === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Semanas Alvo</label>
                <input type="number" id="editIrrSemanasSS" value="${semanas}" required min="1" max="52" class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div style="margin-top: 16px;">
                <button type="submit" class="btn" style="width: 100%; padding: 12px; border-radius: 8px; font-weight: 600; background: #FA9128; border: none; color: white; cursor: pointer;">Salvar Alterações</button>
            </div>
        </form>
    `;
    window.abrirSideSheet('Editar Solicitação', html);
}

window.salvarEdicaoIrradiacaoSideSheet = async function (event, id) {
    event.preventDefault();

    const nome = document.getElementById('editIrrNomeSS').value.toUpperCase();
    const endereco = document.getElementById('editIrrEnderecoSS').value.toUpperCase();
    const dia = document.getElementById('editIrrDiaSS').value;
    const semanas = parseInt(document.getElementById('editIrrSemanasSS').value, 10);

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            semanas_alvo: semanas
        }).eq('id', id);

        if (error) throw error;

        window.fecharSideSheet();
        await carregarLista();

    } catch (err) {
        console.error(err);
        alert('Erro ao salvar as edições. Verifique a conexão.');
    }
};


// ----------------------------------------------------
// ACOES DIRETAS (Triagem, Excluir, Arquivar)
// ----------------------------------------------------
window.aprovar = async function(id, nome, end, dias) {
    if (!confirm(`Mover '${nome}' para o Painel de Leitura (Ativo)?`)) return;

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({ status: 'ativo', leituras: 0 })
            .eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao aprovar: ' + err.message);
    }
}

window.excluir = async function(id) {
    Swal.fire({
        title: 'Excluir Solicitação?',
        text: 'Tem certeza que deseja excluir esta solicitação permanentemente?',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Excluir',
        background: 'var(--bg-card)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_irradiacao_solicitacoes')
                    .delete().eq('id', id);
                if (error) throw error;
                carregarLista();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao excluir: ' + err.message, 'error');
            }
        }
    });
}

window.arquivar = async function(id) {
    Swal.fire({
        title: 'Forçar Arquivamento?',
        text: 'Forçar arquivamento (mover para histórico)?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Arquivar',
        background: 'var(--bg-card)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_irradiacao_solicitacoes')
                    .update({ status: 'historico' }).eq('id', id);
                if (error) throw error;
                carregarLista();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao arquivar: ' + err.message, 'error');
            }
        }
    });
}

window.toggleRenovacaoAutomaticaMobile = async function (id, isChecked) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ renovacao_automatica: isChecked }).eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar opção de repetir ciclo: ' + e.message);
    }
}

// ----------------------------------------------------
// MARCAR LEITURA (IGUAL AO DESKTOP)
// ----------------------------------------------------
window.marcarLeituraIrrMobile = async function (btnElement, id, leituras_atuais, semanas_alvo) {
    try {
        const novaLeitura = leituras_atuais + 1;
        const card = document.getElementById(`card_irr_${id}`);

        // --- EFEITO VISUAL IMEDIATO (Optimistic UI) ---
        if (btnElement && btnElement.nodeType) {
            btnElement.disabled = true;
            btnElement.innerHTML = '✔️ Lido';
            btnElement.style.background = '#059669';
            btnElement.style.color = '#ffffff';
        }

        if (card) {
            // 1. Esmaece o card
            card.style.opacity = '0.5';
            card.style.borderColor = '#10b981';

            // 2. Anima a próxima bolinha vazia
            const proxBola = card.querySelector('.bola-irradiacao.vazia');
            if (proxBola) {
                proxBola.classList.remove('vazia');
                proxBola.classList.add('preenchida');
                proxBola.style.border = 'none';
                proxBola.style.background = '#10b981';
                proxBola.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    proxBola.style.transform = 'scale(1)';
                }, 300);
            }
        }
        // ----------------------------------------------

        // Buscar log_datas_leituras atual
        const { data: rowData, error: fetchErr } = await db.from('app_irradiacao_solicitacoes').select('log_datas_leituras, renovacao_automatica').eq('id', id).single();
        if (fetchErr) throw fetchErr;

        let logs = rowData.log_datas_leituras || [];
        if (!Array.isArray(logs)) logs = [];
        logs.push(new Date().toISOString());

        const autoRenovarDB = rowData.renovacao_automatica === true;
        const chkElement = document.getElementById(`chk_renovar_${id}`);
        const autoRenovar = chkElement ? chkElement.checked : autoRenovarDB;

        // --- ATUALIZAÇÃO DO CACHE LOCAL (dataFull) ---
        const itemIdx = dataFull.findIndex(i => i.id === id);
        let novoStatus = 'ativo';
        let novasLeiturasAtuais = novaLeitura;

        if (novaLeitura >= semanas_alvo) {
            if (autoRenovar) {
                // Reinicia ciclo automaticamente
                novasLeiturasAtuais = 0;
                const { error } = await db.from('app_irradiacao_solicitacoes').update({
                    leituras: 0,
                    status: 'ativo',
                    log_datas_leituras: logs
                }).eq('id', id);
                if (error) throw error;
            } else {
                // Arquivar imediatamente
                novoStatus = 'historico';
                const { error } = await db.from('app_irradiacao_solicitacoes').update({
                    leituras: novaLeitura,
                    status: 'historico',
                    log_datas_leituras: logs
                }).eq('id', id);
                if (error) throw error;
                if (card) card.style.display = 'none';
            }
        } else {
            // Apenas atualiza a contagem
            const { error } = await db.from('app_irradiacao_solicitacoes').update({
                leituras: novaLeitura,
                log_datas_leituras: logs
            }).eq('id', id);

            if (error) throw error;
        }

        if (itemIdx > -1) {
            dataFull[itemIdx].leituras = novasLeiturasAtuais;
            dataFull[itemIdx].status = novoStatus;
            dataFull[itemIdx].log_datas_leituras = logs;
            atualizarContadores(dataFull);
        }

    } catch (err) {
        console.error(err);
        alert('Erro ao marcar leitura: ' + err.message);
        if (btnElement && btnElement.nodeType) {
            btnElement.disabled = false;
            btnElement.innerHTML = '✅ Registrar Leitura';
            btnElement.style.background = 'rgba(16,185,129,0.1)';
            btnElement.style.color = '#10b981';
        }
        const card = document.getElementById(`card_irr_${id}`);
        if (card) {
            card.style.opacity = '1';
            card.style.borderColor = 'var(--border)';
        }
    }
};

// ----------------------------------------------------
// ESTATÍSTICAS MOBILE
// ----------------------------------------------------
window.carregarEstatisticasIrradiacaoMobile = async function () {
    try {
        const { data, error } = await db.from('app_irradiacao_solicitacoes').select('*');
        if (error) throw error;

        let totalAtivos = 0;
        let totalLidas = 0;

        const leiturasPorSemana = {};
        const leiturasPorSemanaPorDia = {};

        data.forEach(item => {
            if (item.status === 'ativo') {
                totalAtivos++;
            }

            // Processar as leituras reais
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const diaDaIrradiacao = item.dias_semana || 'Outros';
                logs.forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (!isNaN(date)) {
                        totalLidas++;
                        const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                        const dayNum = dCopy.getUTCDay() || 7;
                        dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
                        const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
                        const weekNo = Math.ceil((((dCopy - yearStart) / 86400000) + 1) / 7);
                        const weekKey = `Semana ${weekNo}`;

                        leiturasPorSemana[weekKey] = (leiturasPorSemana[weekKey] || 0) + 1;
                        if (!leiturasPorSemanaPorDia[weekKey]) leiturasPorSemanaPorDia[weekKey] = {};
                        leiturasPorSemanaPorDia[weekKey][diaDaIrradiacao] = (leiturasPorSemanaPorDia[weekKey][diaDaIrradiacao] || 0) + 1;
                    }
                });
            }
        });

        document.getElementById('statTotalLeituras').innerText = totalLidas;
        document.getElementById('statAtivos').innerText = totalAtivos;

        // Renderização dos Gráficos via Chart.js
        if (window.Chart) {
            Chart.defaults.color = '#94a3b8';
            Chart.defaults.font.family = 'Inter';

            // --- GRÁFICO SEMANAL (LINHA) ---
            if (window.irrSemanalChartMobile) window.irrSemanalChartMobile.destroy();
            const ctxSemanal = document.getElementById('irradiacaoSemanalChart').getContext('2d');

            const sortedWeeks = Object.keys(leiturasPorSemana).sort((a, b) => {
                const getVal = (s) => parseInt(s.replace('Semana ', '')) || 0;
                return getVal(a) - getVal(b);
            });

            const colorMap = {
                'Segunda-feira': '#3b82f6',
                'Terça-feira': '#10b981',
                'Quarta-feira (Desobsessão)': '#f59e0b',
                'Quarta-feira (Desencarnado)': '#ec4899',
                'Quinta-feira': '#8b5cf6',
                'Outros': '#94a3b8'
            };

            const datasetsSemanal = Object.keys(colorMap).map(dia => {
                return {
                    label: dia.replace('Quarta-feira (Desobsessão)', 'Qua(Desob)').replace('Quarta-feira (Desencarnado)', 'Qua(Desenc)'),
                    data: sortedWeeks.map(w => (leiturasPorSemanaPorDia[w] && leiturasPorSemanaPorDia[w][dia]) ? leiturasPorSemanaPorDia[w][dia] : 0),
                    borderColor: colorMap[dia],
                    backgroundColor: colorMap[dia],
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2
                };
            }).filter(ds => ds.data.some(v => v > 0));

            // Linha "Total da Semana" removida conforme solicitado

            if(window.irrSemanalChartMobile) window.irrSemanalChartMobile.destroy();
            window.irrSemanalChartMobile = new Chart(ctxSemanal, {
                type: 'line',
                data: {
                    labels: sortedWeeks,
                    datasets: datasetsSemanal
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { boxWidth: 10, font: { size: 10 } }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // --- GRÁFICO TOTAL POR DIA (BARRA) ---
            if (window.irrTotalChartMobile) window.irrTotalChartMobile.destroy();
            const ctxTotal = document.getElementById('irradiacaoChart').getContext('2d');

            const diasDisponiveis = Object.keys(colorMap);
            const totalReadsPerDay = {};
            sortedWeeks.forEach(w => {
                diasDisponiveis.forEach(d => {
                    totalReadsPerDay[d] = (totalReadsPerDay[d] || 0) + ((leiturasPorSemanaPorDia[w] && leiturasPorSemanaPorDia[w][d]) ? leiturasPorSemanaPorDia[w][d] : 0);
                });
            });

            if(window.irrTotalChartMobile) window.irrTotalChartMobile.destroy();
            window.irrTotalChartMobile = new Chart(ctxTotal, {
                type: 'bar',
                data: {
                    labels: diasDisponiveis.map(d => d.substring(0, 3)),
                    datasets: [{
                        label: 'Total Lidas',
                        data: diasDisponiveis.map(d => totalReadsPerDay[d] || 0),
                        backgroundColor: diasDisponiveis.map(d => colorMap[d]),
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar estatísticas: ' + err.message);
    }
};

window.abrirSideSheetPendente = function(itemDataStr) {
    try {
        const item = JSON.parse(decodeURIComponent(itemDataStr));
        const html = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="background: var(--bg-dark); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Beneficiado</div>
                    <div style="font-size: 18px; font-weight: 700; color: var(--text-main);">${item.nome}</div>
                    <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">📍 ${item.endereco}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Dia(s) da Semana</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--primary); margin-top: 4px;">${item.dias}</div>
                    </div>
                    <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Semanas Alvo</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-top: 4px;">${item.semanasAlvo} Semanas</div>
                    </div>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                    <div><strong>Data do Pedido:</strong> ${item.dataPed}</div>
                    ${item.criadoPor ? `<div style="margin-top: 4px;"><strong>Criado por:</strong> ${item.criadoPor}</div>` : ''}
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn" style="background: #10b981; color: white; width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; font-size: 15px;" onclick="window.fecharSideSheet(); aprovar('${item.id}', '${item.nome.replace(/'/g, "\\'")}', '${item.endereco.replace(/'/g, "\\'")}', '${item.dias.replace(/'/g, "\\'")}')">Aprovar p/ Leitura ✔️</button>
                    
                    <button class="btn" style="background: transparent; color: #3b82f6; width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #3b82f6; font-weight: 600; font-size: 15px;" onclick="abrirEdicao('${item.id}', '${item.nome.replace(/'/g, "\\'")}', '${item.endereco.replace(/'/g, "\\'")}', '${item.dias.replace(/'/g, "\\'")}', ${item.semanasAlvo})">Editar Solicitação ✏️</button>
                    
                    <button class="btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); font-weight: 600; font-size: 15px;" onclick="window.fecharSideSheet(); excluir('${item.id}')">Excluir Solicitação 🗑️</button>
                </div>
            </div>
        `;
        window.abrirSideSheet('Analisar Solicitação', html);
    } catch (e) {
        console.error("Erro ao abrir side-sheet", e);
    }
};

// ----------------------------------------------------
// GERENCIAMENTO DE CARTÕES ESPECIAIS
// ----------------------------------------------------
window.abrirGerenciadorEspeciais = function() {
    let html = `
        <div style="display: flex; flex-direction: column; gap: 16px; min-height: 400px;">
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 16px; border-radius: 8px;">
                <h4 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 15px;">Adicionar Novo Cartão</h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Título</label>
                        <input type="text" id="novoEspTitulo" placeholder="ex: Fulano de Tal" class="input-field">
                    </div>
                    <div>
                        <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Sub-título (opcional)</label>
                        <input type="text" id="novoEspSub" placeholder="ex: Equipe de Apoio" class="input-field">
                    </div>
                    <div>
                        <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Dias da Semana</label>
                        <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                            <label style="color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 8px;"><input type="checkbox" value="Segunda-feira" class="chk-esp-dia"> Segunda-feira</label>
                            <label style="color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 8px;"><input type="checkbox" value="Terça-feira" class="chk-esp-dia"> Terça-feira</label>
                            <label style="color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 8px;"><input type="checkbox" value="Quarta-feira (Desobsessão)" class="chk-esp-dia"> Quarta-feira (Desobsessão)</label>
                            <label style="color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 8px;"><input type="checkbox" value="Quarta-feira (Desencarnado)" class="chk-esp-dia"> Quarta-feira (Desencarnado)</label>
                            <label style="color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 8px;"><input type="checkbox" value="Quinta-feira" class="chk-esp-dia"> Quinta-feira</label>
                        </div>
                    </div>
                    <button onclick="salvarNovoCartaoEspecial()" class="btn-action" style="background: #f59e0b; color: white; padding: 12px; border-radius: 8px; font-weight: 600; border: none; margin-top: 4px; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span style="font-size: 16px;">➕</span> Adicionar Cartão
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 8px;">
                <h4 style="color: var(--text-main); margin: 0 0 12px 0; font-size: 16px;">Cartões Atuais</h4>
                <div id="listaCartoesEspeciais" style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- Preenchido via JS -->
                </div>
            </div>
        </div>
    `;
    window.abrirSideSheet('Cartões Especiais', html);
    renderListaGerenciadorEspeciais();
}

window.renderListaGerenciadorEspeciais = function() {
    const container = document.getElementById('listaCartoesEspeciais');
    if (!container) return;
    
    if (!window.cartoesEspeciais || window.cartoesEspeciais.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px; border: 1px dashed var(--border); border-radius: 8px;">Nenhum cartão especial configurado.</div>';
        return;
    }

    // Ordenar por ordem
    window.cartoesEspeciais.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    let html = '';
    window.cartoesEspeciais.forEach((esp, index) => {
        html += `
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 14px; font-weight: 600; color: #f59e0b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esp.titulo}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${esp.dia}</div>
                </div>
                <div style="display: flex; gap: 4px; margin-left: 12px;">
                    <button onclick="moverCartaoEspecial('${esp.id}', -1)" title="Subir" class="btn-action" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px;">↑</button>
                    <button onclick="moverCartaoEspecial('${esp.id}', 1)" title="Descer" class="btn-action" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px;">↓</button>
                    <button onclick="excluirCartaoEspecial('${esp.id}')" title="Excluir" class="btn-action" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 6px 10px; border-radius: 6px; margin-left: 4px;">🗑️</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.salvarNovoCartaoEspecial = async function() {
    const titulo = document.getElementById('novoEspTitulo').value.trim();
    const subtitulo = document.getElementById('novoEspSub').value.trim();
    
    const checkboxes = document.querySelectorAll('.chk-esp-dia:checked');
    const diasSelecionados = Array.from(checkboxes).map(cb => cb.value);
    
    if (!titulo) {
        alert("O Título é obrigatório.");
        return;
    }
    if (diasSelecionados.length === 0) {
        alert("Selecione pelo menos um dia da semana.");
        return;
    }

    const dia = diasSelecionados.join(', ');
    const id = 'esp_' + Date.now() + Math.floor(Math.random() * 1000);
    const ordem = window.cartoesEspeciais.length;

    const novoCartao = { id, titulo, subtitulo, dia, ordem };
    window.cartoesEspeciais.push(novoCartao);

    await persistirCartoesEspeciais();
    renderListaGerenciadorEspeciais();
    
    // Limpar formulário
    document.getElementById('novoEspTitulo').value = '';
    document.getElementById('novoEspSub').value = '';
}

window.excluirCartaoEspecial = async function(id) {
    if (!confirm("Deseja realmente remover este cartão especial?")) return;
    
    window.cartoesEspeciais = window.cartoesEspeciais.filter(c => c.id !== id);
    await persistirCartoesEspeciais();
    renderListaGerenciadorEspeciais();
}

window.moverCartaoEspecial = async function(id, direction) {
    const idx = window.cartoesEspeciais.findIndex(c => c.id === id);
    if (idx < 0) return;
    
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= window.cartoesEspeciais.length) return;
    
    // Swap
    const temp = window.cartoesEspeciais[idx];
    window.cartoesEspeciais[idx] = window.cartoesEspeciais[newIdx];
    window.cartoesEspeciais[newIdx] = temp;
    
    // Atualiza campo ordem
    window.cartoesEspeciais.forEach((c, i) => { c.ordem = i; });
    
    await persistirCartoesEspeciais();
    renderListaGerenciadorEspeciais();
}

async function persistirCartoesEspeciais() {
    try {
        const payload = JSON.stringify(window.cartoesEspeciais);
        const { error } = await db.from('configuracoes').upsert({ chave: 'irradiacao_cards_especiais', valor: payload }, { onConflict: 'chave' });
        if (error) throw error;
        
        // Atualiza a lista principal de leitura se estiver aberta
        if (typeof renderLista === 'function') {
            renderLista();
        }
    } catch(e) {
        console.error("Erro ao salvar cartões especiais:", e);
        alert("Não foi possível salvar os cartões especiais.");
    }
}
