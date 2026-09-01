let currentTab = 'pendentes';
let currentDia = '';
let dataFull = [];
let editandoId = null;

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

    if (filtered.length === 0) {
        listaEl.innerHTML = '<div class="empty-state">Nenhum registro encontrado nesta visão.</div>';
        return;
    }

    let html = '';
    filtered.forEach(item => {
        const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');
        const endStr = item.endereco ? item.endereco : 'Endereço não informado';

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
                <div style="margin-top: 4px; font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                    <div>Atual: <strong style="color:var(--text-main);">${leituras}/${semanas_alvo}</strong> | Total: <strong style="color:var(--text-main);">${arrayLogs.length}</strong> | Última: ${lastDateHtml}</div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                        ${checkboxRepetir}
                        <div style="color: var(--border);">|</div>
                        <div style="display: flex; align-items: center; gap: 2px;">${caixinhas}</div>
                    </div>
                </div>
            `;

            actions = `
                <button id="btn_ler_${item.id}" onclick="marcarLeituraIrrMobile(this, '${item.id}', ${leituras}, ${semanas_alvo})" class="btn-action" style="flex: 1; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">✅</span><span style="font-size: 10px;">Registrar</span>
                </button>
                <button class="btn-action" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})" style="flex: 1; background: transparent; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">✏️</span><span style="font-size: 10px;">Editar</span>
                </button>
                <button class="btn-action" onclick="arquivar('${item.id}')" style="flex: 1; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">🗄️</span><span style="font-size: 10px;">Arquivar</span>
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
                <button class="btn-action" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')" style="flex: 1; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">♻️</span><span style="font-size: 10px;">Reativar</span>
                </button>
                <button class="btn-action" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})" style="flex: 1; background: transparent; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">✏️</span><span style="font-size: 10px;">Editar</span>
                </button>
                <button class="btn-action" onclick="excluir('${item.id}')" style="flex: 1; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 8px 4px; gap:4px; height: auto;">
                    <span style="font-size: 16px;">🗑️</span><span style="font-size: 10px;">Excluir</span>
                </button>
            `;
        }

        html += `
            <div class="m-card" id="card_irr_${item.id}">
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
                <div class="m-card-actions" style="display: flex; gap: 8px; margin-top: 12px;">
                    ${actions}
                </div>
            </div>
        `;
    });

    listaEl.innerHTML = html;
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
