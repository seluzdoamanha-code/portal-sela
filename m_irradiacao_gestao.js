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
    carregarLista();
});

function voltarParaHub() {
    const urlParams = new URLSearchParams(window.location.search);
    const estruturaId = urlParams.get('id') || localStorage.getItem('estrutura_atual');
    if (estruturaId) {
        window.location.href = `m_hub.html?id=${estruturaId}&tipo=irradiacao`;
    } else {
        window.location.href = 'm_atividades.html';
    }
}

function mudarAba(aba) {
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

function setDia(dia) {
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

async function carregarLista() {
    const listaEl = document.getElementById('listaGestaoIrradiacoes');
    listaEl.innerHTML = '<div class="empty-state">Carregando dados...</div>';

    const estruturaId = localStorage.getItem('estrutura_atual');

    try {
        let query = db.from('app_irradiacao_solicitacoes').select('*');
        if (estruturaId) {
            query = query.eq('estrutura_id', estruturaId);
        }

        let targetStatus = currentTab;
        if (currentTab === 'ativos') targetStatus = 'ativo';
        if (currentTab === 'pendentes') targetStatus = 'pendente';

        query = query.eq('status', targetStatus).order('nome_solicitado', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        dataFull = data || [];
        atualizarContadores(dataFull);
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

    let filtered = dataFull;
    if (currentDia !== '') {
        filtered = dataFull.filter(item => (item.dias_semana || '').includes(currentDia));
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
            progressHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Status: Pendente${totalLeiturasHtml}</div>`;
            actions = `
                <button class="btn-action btn-primary" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')">Triagem ✔️</button>
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="excluir('${item.id}')">Excluir</button>
            `;
        } else if (currentTab === 'ativos') {
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

            let lastDateHtml = '';
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
                        lastDateHtml = `<span style="margin-left: 8px; font-size: 11px; font-weight: 600; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; border: 1px solid #10b981;">(Hoje)</span>`;
                    } else {
                        lastDateHtml = `<span style="margin-left: 8px; font-size: 11px; font-weight: 500; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">Última: ${lastDateStr}</span>`;
                    }
                }
            }

            progressHtml = `<div style="margin-top: 8px; font-size: 13px; color: var(--text-muted);"><div style="display:flex; align-items:center; margin-bottom:4px; flex-wrap:wrap;">Leitura atual: <strong style="color:var(--accent); margin-left:4px; margin-right:4px;">${leituras}/${semanas_alvo}</strong>${totalLeiturasHtml} ${lastDateHtml}</div><div style="margin-top:4px; display:flex; flex-wrap:wrap;">${caixinhas}</div></div>`;

            actions = `
                <button id="btn_ler_${item.id}" onclick="marcarLeituraIrrMobile(this, '${item.id}', ${leituras}, ${semanas_alvo})" class="btn-action" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; transition: all 0.3s ease;">✅ Registrar Leitura</button>
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="arquivar('${item.id}')">Forçar Arquivamento</button>
            `;
        } else if (currentTab === 'historico') {
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
                <button class="btn-action btn-primary" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')">Reativar ♻️</button>
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="excluir('${item.id}')">Excluir</button>
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
                <div class="m-card-meta">
                    Em: ${dataPed}${item.criado_por ? ' por ' + item.criado_por : ''} | Dias: <span style="color: var(--text-main);">${item.dias_semana}</span>
                    ${progressHtml}
                </div>
                <div class="m-card-actions">
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
function abrirEdicao(id, nome, end, dias, semanas) {
    editandoId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editEnd').value = end;
    document.getElementById('editSemanasRestantes').value = semanas;

    // Marcar tags corretas
    document.querySelectorAll('.edit-tag').forEach(tag => {
        if (dias.includes(tag.getAttribute('data-val'))) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });

    document.getElementById('bsOverlay').classList.add('active');
    document.getElementById('bsEdicao').classList.add('active');
}

function fecharBottomSheet() {
    document.getElementById('bsOverlay').classList.remove('active');
    document.getElementById('bsEdicao').classList.remove('active');
    editandoId = null;
}

function toggleEditTag(el) {
    el.classList.toggle('selected');
}

async function salvarEdicao() {
    if (!editandoId) return;

    const nome = document.getElementById('editNome').value.trim().toUpperCase();
    const end = document.getElementById('editEnd').value.trim().toUpperCase();

    let diasArr = [];
    document.querySelectorAll('.edit-tag.selected').forEach(tag => {
        diasArr.push(tag.getAttribute('data-val'));
    });

    if (diasArr.length === 0) {
        alert('Selecione ao menos um dia!');
        return;
    }

    if (!nome) {
        alert('Nome obrigatório!');
        return;
    }

    const diasStr = diasArr.join(', ');

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({
                nome_solicitado: nome,
                endereco: end,
                dias_semana: diasStr
            })
            .eq('id', editandoId);

        if (error) throw error;

        fecharBottomSheet();
        carregarLista(); // recarrega e atualiza UI

    } catch (err) {
        alert('Erro ao salvar: ' + err.message);
    }
}


// ----------------------------------------------------
// ACOES DIRETAS (Triagem, Excluir, Arquivar)
// ----------------------------------------------------
async function aprovar(id, nome, end, dias) {
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

async function excluir(id) {
    if (!confirm('Tem certeza que deseja excluir esta solicitação permanentemente?')) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .delete().eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao excluir: ' + err.message);
    }
}

async function arquivar(id) {
    if (!confirm('Forçar arquivamento (mover para histórico)?')) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({ status: 'historico' }).eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao arquivar: ' + err.message);
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

        const autoRenovar = rowData.renovacao_automatica === true;

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
                if (confirm(`O ciclo de ${semanas_alvo} semanas desta irradiação chegou ao fim.\nDeseja reiniciar o ciclo (Renovar) para mais ${semanas_alvo} semanas?\n\n[OK] para Renovar\n[Cancelar] para Arquivar`)) {
                    // Renovar
                    novasLeiturasAtuais = 0;
                    const { error } = await db.from('app_irradiacao_solicitacoes').update({
                        leituras: 0,
                        status: 'ativo',
                        log_datas_leituras: logs
                    }).eq('id', id);
                    if (error) throw error;
                } else {
                    // Arquivar
                    novoStatus = 'historico';
                    const { error } = await db.from('app_irradiacao_solicitacoes').update({
                        leituras: novaLeitura,
                        status: 'historico',
                        log_datas_leituras: logs
                    }).eq('id', id);
                    if (error) throw error;
                    if (card) card.style.display = 'none';
                }
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

            datasetsSemanal.push({
                label: 'Total da Semana',
                data: sortedWeeks.map(w => leiturasPorSemana[w] || 0),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.3,
                fill: true,
                pointRadius: 3
            });

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
