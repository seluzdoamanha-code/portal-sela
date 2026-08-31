// ==========================================
// MÓDULO: ASSISTÊNCIA SOCIAL
// ==========================================

window.carregarAppAssistencia = async function() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="color: var(--text-main); margin: 0; font-size: 24px;">Logística de Cestas (Almoxarifado)</h2>
                <p style="color: var(--text-muted); margin: 4px 0 0 0; font-size: 14px;">Gestão de Estoque e Planejamento de Entregas</p>
            </div>
        </div>

        <div style="background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
            
            <!-- Menu Interno do App -->
            <div style="display: flex; gap: 8px; padding: 16px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none;">
                <button onclick="mudarAbaAssistencia('dashboard')" id="btnAssDashboard" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Dashboard</button>
                <button onclick="mudarAbaAssistencia('cestas')" id="btnAssCestas" class="btn" style="white-space: nowrap; border-radius: 8px;">📦 Cestas & Itens</button>
                <button onclick="mudarAbaAssistencia('entregas')" id="btnAssEntregas" class="btn" style="white-space: nowrap; border-radius: 8px;">🚚 Entregas & Metas</button>
            </div>

            <!-- Conteúdo das Abas -->
            <div style="padding: 24px; min-height: 400px;">
                
                <!-- Aba Dashboard -->
                <div id="assDashboard" class="ass-tab-content" style="display: none;">
                    <div id="assDashboardContainer">
                        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                            Carregando indicadores...
                        </div>
                    </div>
                </div>

                <!-- Aba Cestas -->
                <div id="assCestas" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Tipos de Cestas e Itens</h3>
                        <div>
                            <button class="btn" onclick="abrirModalNovoItem()" style="border-radius: 8px; margin-right: 8px;">+ Novo Item (Estoque)</button>
                            <button class="btn btn-primary" onclick="abrirModalNovaCesta()" style="border-radius: 8px; font-weight: 500;">+ Novo Modelo de Cesta</button>
                        </div>
                    </div>
                    <div id="assCestasLista"></div>
                </div>

                <!-- Aba Entregas -->
                <div id="assEntregas" class="ass-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Registro de Entregas Realizadas</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaEntrega()" style="border-radius: 8px; font-weight: 500;">+ Registrar Entrega (Baixa)</button>
                    </div>
                    <div id="assEntregasLista"></div>
                </div>

            </div>
        </div>
    `;

    // Inicializa na primeira aba
    window.mudarAbaAssistencia('dashboard');
};

// Controle de abas internas
window.mudarAbaAssistencia = function(aba) {
    const abas = ['dashboard', 'cestas', 'entregas'];
    
    abas.forEach(a => {
        // Esconder conteúdo
        const el = document.getElementById('ass' + a.charAt(0).toUpperCase() + a.slice(1));
        if (el) el.style.display = 'none';
        
        // Resetar botões
        const btn = document.getElementById('btnAss' + a.charAt(0).toUpperCase() + a.slice(1));
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.style.fontWeight = 'normal';
            btn.style.color = 'var(--text-main)';
            btn.style.background = 'transparent';
        }
    });

    // Ativar a selecionada
    const elAtiva = document.getElementById('ass' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (elAtiva) elAtiva.style.display = 'block';

    const btnAtivo = document.getElementById('btnAss' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (btnAtivo) {
        btnAtivo.classList.add('btn-primary');
        btnAtivo.style.fontWeight = 'bold';
        btnAtivo.style.color = 'white';
        btnAtivo.style.background = 'var(--primary)';
    }

    // Disparar carregamento de dados conforme a aba
    if (aba === 'dashboard') carregarDashboardAssistencia();
    if (aba === 'cestas') carregarListaCestas();
    if (aba === 'entregas') carregarListaEntregas();
};

// ==========================================

// ==========================================
// FUNÇÕES DE CARREGAMENTO (ESTATÍSTICAS)
// ==========================================

async function carregarDashboardAssistencia() {
    const container = document.getElementById('assDashboardContainer');
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Carregando indicadores...</div>';
    
    try {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth() + 1;
        const dataInicioMes = new Date(anoAtual, mesAtual - 1, 1).toISOString();

        // 1. Famílias Atendidas
        const { count: countFam } = await db.from('ass_familias').select('*', { count: 'exact', head: true }).eq('status', 'Ativa');
        
        // 2. Entregas do Mês
        const { count: countEnt } = await db.from('ass_entregas').select('*', { count: 'exact', head: true })
            .eq('ano_ref', anoAtual).eq('mes_ref', mesAtual);

        // 3. Novos Cadastros
        const { count: countNovos } = await db.from('ass_familias').select('*', { count: 'exact', head: true })
            .gte('created_at', dataInicioMes);

        // 4. Ocorrências (opcional)
        const { count: countOco } = await db.from('ass_ocorrencias').select('*', { count: 'exact', head: true })
            .gte('data_ocorrencia', dataInicioMes.split('T')[0]);

        container.innerHTML = `
            <!-- Título Opcional -->
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; color: var(--text-main); font-size: 24px;">Estatísticas e Relatórios</h2>
                <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 14px;">Visão geral da Assistência Social</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 24px;">
                
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: relative;">
                    <div style="position: absolute; right: 24px; top: 24px; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 12px; border-radius: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div style="color: var(--text-muted); font-size: 14px; font-weight: 500; margin-bottom: 8px;">Famílias Ativas</div>
                    <div style="font-size: 32px; font-weight: 700; color: var(--text-main);">${countFam || 0}</div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: relative;">
                    <div style="position: absolute; right: 24px; top: 24px; background: rgba(6, 182, 212, 0.1); color: #06b6d4; padding: 12px; border-radius: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </div>
                    <div style="color: var(--text-muted); font-size: 14px; font-weight: 500; margin-bottom: 8px;">Cestas (Mês)</div>
                    <div style="font-size: 32px; font-weight: 700; color: var(--text-main);">${countEnt || 0}</div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: relative;">
                    <div style="position: absolute; right: 24px; top: 24px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 12px; border-radius: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    </div>
                    <div style="color: var(--text-muted); font-size: 14px; font-weight: 500; margin-bottom: 8px;">Novos Cadastros</div>
                    <div style="font-size: 32px; font-weight: 700; color: var(--text-main);">${countNovos || 0}</div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: relative;">
                    <div style="position: absolute; right: 24px; top: 24px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 12px; border-radius: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div style="color: var(--text-muted); font-size: 14px; font-weight: 500; margin-bottom: 8px;">Ocorrências (Mês)</div>
                    <div style="font-size: 32px; font-weight: 700; color: var(--text-main);">${countOco || 0}</div>
                </div>

            </div>

            <!-- Gráficos -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
                    <h3 style="margin: 0 0 24px 0; font-size: 16px; color: var(--text-main);">Entregas por Mês (Ano Atual)</h3>
                    <div style="height: 300px; position: relative; width: 100%;">
                        <canvas id="chartAssEntregasWeb"></canvas>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
                    <h3 style="margin: 0 0 24px 0; font-size: 16px; color: var(--text-main);">Status das Famílias</h3>
                    <div style="height: 300px; position: relative; width: 100%;">
                        <canvas id="chartAssStatusWeb"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Renderizar gráficos
        await renderizarGraficoEntregasWeb(anoAtual);
        await renderizarGraficoStatusWeb();

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Erro ao carregar os dados.</div>';
    }
}

async function renderizarGraficoEntregasWeb(ano) {
    const { data } = await db.from('ass_entregas').select('mes_ref').eq('ano_ref', ano);
    const contagem = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0};
    
    if (data) {
        data.forEach(d => contagem[d.mes_ref]++);
    }

    const ctx = document.getElementById('chartAssEntregasWeb').getContext('2d');
    
    // Criar gradiente
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');   
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)');

    if(window.chartAssEntregasWebInstance) window.chartAssEntregasWebInstance.destroy();
    window.chartAssEntregasWebInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
                label: 'Entregas',
                data: Object.values(contagem),
                backgroundColor: gradient,
                borderRadius: 6,
                borderSkipped: false
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

async function renderizarGraficoStatusWeb() {
    const { data } = await db.from('ass_familias').select('status');
    let ativa = 0, inativa = 0, triagem = 0;
    
    if (data) {
        data.forEach(f => {
            if(f.status === 'Ativa') ativa++;
            else if(f.status === 'Inativa') inativa++;
            else if(f.status === 'Triagem') triagem++;
        });
    }

    const ctx = document.getElementById('chartAssStatusWeb').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ativa', 'Inativa', 'Triagem'],
            datasets: [{
                data: [ativa, inativa, triagem],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', padding: 20 } }
            }
        }
    });
}

// -------------------------------------------
async function carregarListaCestas() {
    const container = document.getElementById('assCestasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando catálogo...</div>';

    try {
        // Fetch Itens
        const resItens = await db.from('ass_itens_cesta').select('*').order('descricao');
        if (resItens.error) throw resItens.error;
        const itens = resItens.data;

        // Fetch Cestas e suas composições
        const resCestas = await db.from('ass_cestas_modelos').select(`
            *,
            ass_cesta_composicao (
                quantidade,
                ass_itens_cesta ( id, codigo, descricao, unidade )
            )
        `).order('tipo');
        if (resCestas.error) throw resCestas.error;
        const cestas = resCestas.data;

        // Guarda globalmente os itens para o modal de composição de cesta
        window.assItensGlobais = itens;

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
                
                <!-- Coluna de Itens (Catálogo) -->
                <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                    <h4 style="color: var(--text-main); margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Catálogo de Produtos (Estoque)</h4>
                    ${itens.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Nenhum item cadastrado.</p>' : `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                        <th style="padding: 8px 4px;">Cód</th>
                                        <th style="padding: 8px 4px;">Descrição</th>
                                        <th style="padding: 8px 4px;">Estoque</th>
                                        <th style="padding: 8px 4px;">Unidade</th>
                                        <th style="padding: 8px 4px;">Peso (kg)</th>
                                        <th style="padding: 8px 4px;">Status</th>
                                        <th style="padding: 8px 4px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itens.map(i => `
                                        <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                            <td style="padding: 8px 4px; color: #60a5fa;">${i.codigo}</td>
                                            <td style="padding: 8px 4px; color: var(--text-main); font-weight: 500;">${i.descricao}</td>
                                            <td style="padding: 8px 4px; color: #10b981; font-weight: bold;">${i.estoque_atual || 0}</td>
                                            <td style="padding: 8px 4px; color: var(--text-muted);">${i.unidade}</td>
                                            <td style="padding: 8px 4px; color: var(--text-muted);">${i.peso_kg || '-'}</td>
                                            <td style="padding: 8px 4px;">
                                                <span style="background: ${i.status === 'Ativo' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${i.status === 'Ativo' ? '#10b981' : '#ef4444'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                                    ${i.status}
                                                </span>
                                            </td>
                                            <td style="padding: 8px 4px; text-align: right; white-space: nowrap;">
                                                <button onclick="editarItemAss('${i.id}')" style="background:none; border:none; color: #60a5fa; cursor:pointer; margin-right: 8px;" title="Editar">✏️</button>
                                                <button onclick="excluirItemAss('${i.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <!-- Coluna de Cestas (Modelos) -->
                <div>
                    <h4 style="color: var(--text-main); margin-top: 0; margin-bottom: 16px;">Modelos de Cestas</h4>
                    ${cestas.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">Nenhum modelo cadastrado.</p>' : 
                        cestas.map(c => `
                            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <h5 style="color: var(--primary); margin: 0; font-size: 16px;">${c.tipo}</h5>
                                            <span style="background: #334155; color: #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${c.codigo}</span>
                                        </div>
                                        <p style="color: var(--text-muted); font-size: 13px; margin: 4px 0 0 0;">${c.descricao}</p>
                                    </div>
                                    <div>
                                        <button onclick="editarCestaAss('${c.id}')" style="background:none; border:none; color: #60a5fa; cursor:pointer; margin-right: 8px;" title="Editar Cesta">✏️</button>
                                        <button onclick="excluirCestaAss('${c.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir Cesta">🗑️</button>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 12px;">
                                    <h6 style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Composição:</h6>
                                    ${c.ass_cesta_composicao.length === 0 ? '<span style="font-size:12px; color:var(--text-muted);">Sem itens</span>' : 
                                        c.ass_cesta_composicao.map(comp => `
                                            <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                                                <span style="color: var(--text-main);">(${comp.ass_itens_cesta?.codigo || '-'}) ${comp.ass_itens_cesta?.descricao || 'Item deletado'}</span>
                                                <span style="color: var(--text-muted);">${comp.quantidade} ${comp.ass_itens_cesta?.unidade || ''}</span>
                                            </div>
                                        `).join('')
                                    }
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar os dados.</div>';
    }
}

async function carregarListaEntregas() {
    const container = document.getElementById('assEntregasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando painel de entregas...</div>';

    // Estado local para filtros
    window.assFiltroMes = window.assFiltroMes || new Date().getMonth() + 1;
    window.assFiltroAno = window.assFiltroAno || new Date().getFullYear();

    try {
        // Fetch Metas
        const { data: metasData, error: metaErr } = await db.from('ass_planejamento_mes')
            .select('*')
            .eq('mes_ref', window.assFiltroMes)
            .eq('ano_ref', window.assFiltroAno);
        if (metaErr) throw metaErr;
        
        let metaFixa = 0;
        let metaExtra = 0;
        metasData.forEach(m => {
            if(m.tipo_familia === 'Fixa') metaFixa = m.qtde_valor;
            if(m.tipo_familia === 'Extra') metaExtra = m.qtde_valor;
        });

        // Fetch Entregas Realizadas
        const { data: entregasData, error: entErr } = await db.from('ass_entregas')
            .select(`
                *, ass_familias (nome_familia, tipo), pessoas (nome_curto, nome_completo, ass_familias_meta (tipo)), ass_cestas_modelos (tipo)
            `)
            .eq('mes_ref', window.assFiltroMes)
            .eq('ano_ref', window.assFiltroAno)
            .order('data_entrega', { ascending: false });
        if (entErr) throw entErr;

        let realFixa = 0;
        let realExtra = 0;
        
        entregasData.forEach(e => {
            let famTipo = e.ass_familias?.tipo;
            if (e.pessoa_id && e.pessoas) {
                const meta = Array.isArray(e.pessoas.ass_familias_meta) ? e.pessoas.ass_familias_meta[0] : e.pessoas.ass_familias_meta;
                famTipo = meta ? meta.tipo : 'Fixa/Assistida';
            }
            const qtd = e.quantidade_entregue || 1;
            if (famTipo === 'Fixa' || famTipo === 'Fixa/Assistida') realFixa += qtd;
            if (famTipo === 'Extra') realExtra += qtd;
        });

        const calcPercent = (real, meta) => meta > 0 ? Math.min(Math.round((real / meta) * 100), 100) : 0;
        const percFixa = calcPercent(realFixa, metaFixa);
        const percExtra = calcPercent(realExtra, metaExtra);

        // Nomes dos meses
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const optionsMeses = mesesNomes.map((nome, i) => `<option value="${i+1}" ${window.assFiltroMes === i+1 ? 'selected' : ''}>${nome}</option>`).join('');

        let html = `
            <!-- Barra de Filtros e Ações -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: var(--bg-body); padding: 16px; border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 13px;">Período:</span>
                    <select id="assFiltroMesSelect" class="form-control" style="background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;" onchange="window.assFiltroMes = parseInt(this.value); carregarListaEntregas();">
                        ${optionsMeses}
                    </select>
                    <input type="number" id="assFiltroAnoSelect" class="form-control" style="width: 80px; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;" value="${window.assFiltroAno}" onchange="window.assFiltroAno = parseInt(this.value); carregarListaEntregas();">
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn" onclick="abrirModalNovaMetaAss()">🎯 Definir Metas do Mês</button>
                    <button class="btn btn-primary" onclick="abrirModalEntregaColetiva()">📦 Entrega Coletiva</button>
                    <button class="btn btn-primary" onclick="abrirModalNovaEntrega()">🚚 Entrega Individual</button>
                </div>
            </div>

            <!-- Dashboard de Metas -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Fixas -->
                <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="margin: 0 0 16px 0; color: var(--text-main); font-size: 15px;">Famílias Fixas</h4>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                        <div>
                            <span style="font-size: 28px; font-weight: bold; color: #10b981;">${realFixa}</span>
                            <span style="color: var(--text-muted); font-size: 14px;"> / ${metaFixa} planejadas</span>
                        </div>
                        <span style="color: ${percFixa >= 100 ? '#10b981' : '#60a5fa'}; font-weight: bold;">${percFixa}%</span>
                    </div>
                    <div style="width: 100%; background: var(--bg-panel); border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="width: ${percFixa}%; background: ${percFixa >= 100 ? '#10b981' : '#3b82f6'}; height: 100%; border-radius: 4px;"></div>
                    </div>
                </div>

                <!-- Extras -->
                <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="margin: 0 0 16px 0; color: var(--text-main); font-size: 15px;">Famílias Extras</h4>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                        <div>
                            <span style="font-size: 28px; font-weight: bold; color: #eab308;">${realExtra}</span>
                            <span style="color: var(--text-muted); font-size: 14px;"> / ${metaExtra} planejadas</span>
                        </div>
                        <span style="color: ${percExtra >= 100 ? '#10b981' : '#eab308'}; font-weight: bold;">${percExtra}%</span>
                    </div>
                    <div style="width: 100%; background: var(--bg-panel); border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="width: ${percExtra}%; background: ${percExtra >= 100 ? '#10b981' : '#eab308'}; height: 100%; border-radius: 4px;"></div>
                    </div>
                </div>
            </div>

            <!-- Tabela de Histórico -->
            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <h4 style="color: var(--text-main); margin-top: 0; margin-bottom: 16px;">Histórico de Entregas (${mesesNomes[window.assFiltroMes-1]} / ${window.assFiltroAno})</h4>
                ${entregasData.length === 0 ? '<p style="color:var(--text-muted); font-size:13px; text-align: center; padding: 20px;">Nenhuma entrega registrada neste mês.</p>' : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                    <th style="padding: 8px 4px;">Data</th>
                                    <th style="padding: 8px 4px;">Família</th>
                                    <th style="padding: 8px 4px;">Perfil</th>
                                    <th style="padding: 8px 4px;">Cesta Entregue</th>
                                    <th style="padding: 8px 4px;">Qtd</th>
                                    <th style="padding: 8px 4px; text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${entregasData.map(e => {
                                    let nomeFamilia = e.ass_familias?.nome_familia || 'Família Deletada';
                                    let isGlobal = false;
                                    let famTipo = e.ass_familias?.tipo || '?';
                                    
                                    if (e.pessoa_id && e.pessoas) {
                                        nomeFamilia = e.pessoas.nome_curto || e.pessoas.nome_completo;
                                        isGlobal = true;
                                        const meta = Array.isArray(e.pessoas.ass_familias_meta) ? (e.pessoas.ass_familias_meta[0] || {}) : (e.pessoas.ass_familias_meta || {});
                                        famTipo = meta.tipo || 'Fixa/Assistida';
                                        if(meta.codigo) nomeFamilia = meta.codigo + ' - ' + nomeFamilia;
                                    }

                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                        <td style="padding: 8px 4px; color: var(--text-muted);">${e.data_entrega.split('-').reverse().join('/')}</td>
                                        <td style="padding: 8px 4px; color: var(--text-main); font-weight: 500;">
                                            ${nomeFamilia} ${isGlobal ? '<span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px; margin-left:4px;">Global</span>' : '<span style="font-size:10px; background:#64748b; color:white; padding:2px 6px; border-radius:8px; margin-left:4px;">Legado</span>'}
                                        </td>
                                        <td style="padding: 8px 4px;">
                                            <span style="background: ${famTipo === 'Extra' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${famTipo === 'Extra' ? '#eab308' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                                ${famTipo}
                                            </span>
                                        </td>
                                        <td style="padding: 8px 4px; color: var(--text-muted);">${e.ass_cestas_modelos?.tipo || 'Cesta Deletada'}</td>
                                        <td style="padding: 8px 4px; color: var(--text-muted);">${e.quantidade_entregue}</td>
                                        <td style="padding: 8px 4px; text-align: right;">
                                            <button onclick="excluirEntregaAss('${e.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir (O estoque NÃO voltará automaticamente)">🗑️</button>
                                        </td>
                                    </tr>
                                    `; }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = html;

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar os dados de entregas.</div>';
    }
}

// ==========================================
// FUNÇÕES DE MODAIS 
// ==========================================

window.abrirModalNovoItem = function() {
    // Inject modal se não existir
    if(!document.getElementById('modalNovoItemAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovoItemAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 400px;">
                    <h3 id="modalNovoItemAssTitle" style="margin-top: 0; color: var(--text-main);">Novo Item (Estoque)</h3>
                    <form id="formNovoItemAss" onsubmit="salvarNovoItemAss(event)">
                        <input type="hidden" id="assItemId">
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código Único (Ex: IC1)</label>
                            <input type="text" id="assItemCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Descrição (Ex: Arroz 5kg)</label>
                            <input type="text" id="assItemDescricao" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Estoque Atual</label>
                                <input type="number" id="assItemEstoque" class="form-control" placeholder="0" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: #10b981; font-weight: bold; padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Unidade</label>
                                <input type="text" id="assItemUnidade" class="form-control" required placeholder="Ex: pacote" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Peso (kg)</label>
                                <input type="number" step="0.01" id="assItemPeso" class="form-control" placeholder="Ex: 5" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovoItemAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Item</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }
    document.getElementById('formNovoItemAss').reset();
    document.getElementById('assItemId').value = '';
    document.getElementById('modalNovoItemAssTitle').textContent = 'Novo Item (Estoque)';
    document.getElementById('modalNovoItemAss').style.display = 'flex';
};

window.editarItemAss = async function(id) {
    abrirModalNovoItem();
    document.getElementById('modalNovoItemAssTitle').textContent = 'Editar Item';
    const item = window.assItensGlobais.find(i => i.id === id);
    if(item) {
        document.getElementById('assItemId').value = item.id;
        document.getElementById('assItemCodigo').value = item.codigo;
        document.getElementById('assItemDescricao').value = item.descricao;
        document.getElementById('assItemEstoque').value = item.estoque_atual || 0;
        document.getElementById('assItemUnidade').value = item.unidade;
        document.getElementById('assItemPeso').value = item.peso_kg || '';
    }
};

window.salvarNovoItemAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const payload = {
            codigo: document.getElementById('assItemCodigo').value.trim(),
            descricao: document.getElementById('assItemDescricao').value.trim(),
            estoque_atual: document.getElementById('assItemEstoque').value ? parseInt(document.getElementById('assItemEstoque').value) : 0,
            unidade: document.getElementById('assItemUnidade').value.trim(),
            peso_kg: document.getElementById('assItemPeso').value ? parseFloat(document.getElementById('assItemPeso').value) : null
        };
        const idEdit = document.getElementById('assItemId').value;
        let query;
        if(idEdit) {
            query = db.from('ass_itens_cesta').update(payload).eq('id', idEdit);
        } else {
            query = db.from('ass_itens_cesta').insert(payload);
        }
        
        const { error } = await query;
        if (error) throw error;
        
        document.getElementById('modalNovoItemAss').style.display = 'none';
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar item. O código já existe?');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
};

window.excluirItemAss = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este item? Ele será removido de todas as composições de cestas.")) return;
    try {
        const { error } = await db.from('ass_itens_cesta').delete().eq('id', id);
        if (error) throw error;
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir item.');
    }
};

window.abrirModalNovaCesta = function() {
    if(!window.assItensGlobais || window.assItensGlobais.length === 0) {
        alert("Cadastre pelo menos um item no catálogo primeiro!");
        return;
    }

    if(!document.getElementById('modalNovaCestaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaCestaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 500px;">
                    <h3 id="modalNovaCestaAssTitle" style="margin-top: 0; color: var(--text-main);">Novo Modelo de Cesta</h3>
                    <form id="formNovaCestaAss" onsubmit="salvarNovaCestaAss(event)">
                        <input type="hidden" id="assCestaId">
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código (Ex: CB1)</label>
                                <input type="text" id="assCestaCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Tipo (Ex: Pequena, Grande)</label>
                                <input type="text" id="assCestaTipo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Descrição detalhada</label>
                            <input type="text" id="assCestaDescricao" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        
                        <div style="margin-bottom: 8px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <label style="display: block; color: var(--text-main); font-weight: 500; margin-bottom: 8px;">Composição da Cesta (Itens)</label>
                            <div id="assCestaComposicaoContainer" style="max-height: 200px; overflow-y: auto; background: var(--bg-body); border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
                                <!-- Items rendered dynamically -->
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaCestaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Cesta</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }
    
    // Render checkboxes for composition
    const compContainer = document.getElementById('assCestaComposicaoContainer');
    compContainer.innerHTML = window.assItensGlobais.map(i => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
            <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); font-size: 13px; cursor: pointer;">
                <input type="checkbox" class="ass-cesta-item-cb" value="${i.id}" onchange="toggleCestaQtd(this, '${i.id}')">
                (${i.codigo}) ${i.descricao} <span style="color:var(--text-muted); font-size: 11px;">(${i.unidade})</span>
            </label>
            <input type="number" id="qtd_${i.id}" value="1" min="1" step="1" style="width: 60px; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 4px; border-radius: 4px; display: none;">
        </div>
    `).join('');

    document.getElementById('formNovaCestaAss').reset();
    document.getElementById('assCestaId').value = '';
    document.getElementById('modalNovaCestaAssTitle').textContent = 'Novo Modelo de Cesta';
    document.getElementById('modalNovaCestaAss').style.display = 'flex';
};

window.editarCestaAss = async function(id) {
    abrirModalNovaCesta();
    document.getElementById('modalNovaCestaAssTitle').textContent = 'Editar Modelo de Cesta';
    
    try {
        const { data: cesta, error } = await db.from('ass_cestas_modelos').select('*, ass_cesta_composicao(*)').eq('id', id).single();
        if(error) throw error;
        
        document.getElementById('assCestaId').value = cesta.id;
        document.getElementById('assCestaCodigo').value = cesta.codigo;
        document.getElementById('assCestaTipo').value = cesta.tipo;
        document.getElementById('assCestaDescricao').value = cesta.descricao;
        
        // Marcar e preencher qtd dos itens
        if(cesta.ass_cesta_composicao) {
            cesta.ass_cesta_composicao.forEach(comp => {
                const cb = document.querySelector(`.ass-cesta-item-cb[value="${comp.item_id}"]`);
                if(cb) {
                    cb.checked = true;
                    toggleCestaQtd(cb, comp.item_id);
                    document.getElementById('qtd_' + comp.item_id).value = comp.quantidade;
                }
            });
        }
    } catch(err) {
        console.error(err);
        alert('Erro ao carregar os dados da cesta.');
    }
};

window.toggleCestaQtd = function(cb, id) {
    const ipt = document.getElementById('qtd_' + id);
    if(cb.checked) { ipt.style.display = 'block'; } else { ipt.style.display = 'none'; }
};

window.salvarNovaCestaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const payloadCesta = {
            codigo: document.getElementById('assCestaCodigo').value.trim(),
            tipo: document.getElementById('assCestaTipo').value.trim(),
            descricao: document.getElementById('assCestaDescricao').value.trim()
        };
        
        const idEdit = document.getElementById('assCestaId').value;
        let cestaId = idEdit;

        if (idEdit) {
            // Update Cesta
            const { error: cestaError } = await db.from('ass_cestas_modelos').update(payloadCesta).eq('id', idEdit);
            if (cestaError) throw cestaError;
            
            // Delete composições antigas para recriar
            await db.from('ass_cesta_composicao').delete().eq('cesta_id', idEdit);
        } else {
            // Insert Cesta
            const { data: cestaData, error: cestaError } = await db.from('ass_cestas_modelos').insert(payloadCesta).select('id').single();
            if (cestaError) throw cestaError;
            cestaId = cestaData.id;
        }

        // Montar composicao
        const composicoes = [];
        document.querySelectorAll('.ass-cesta-item-cb:checked').forEach(cb => {
            const itemId = cb.value;
            const qtd = document.getElementById('qtd_' + itemId).value;
            composicoes.push({
                cesta_id: cestaId,
                item_id: itemId,
                quantidade: parseInt(qtd) || 1
            });
        });

        // Insert composicao
        if (composicoes.length > 0) {
            const { error: compError } = await db.from('ass_cesta_composicao').insert(composicoes);
            if (compError) throw compError;
        }
        
        document.getElementById('modalNovaCestaAss').style.display = 'none';
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar cesta. Verifique se o código já existe.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
};

window.excluirCestaAss = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este modelo de cesta? Isso apagará sua composição também.")) return;
    try {
        const { error } = await db.from('ass_cestas_modelos').delete().eq('id', id);
        if (error) throw error;
        carregarListaCestas();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir cesta. Pode estar vinculada a uma entrega.');
    }
};

// ==========================================
// MODAIS DE ENTREGAS E METAS
// ==========================================

window.abrirModalNovaMetaAss = async function() {
    if(!document.getElementById('modalNovaMetaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaMetaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 400px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Definir Metas do Mês</h3>
                    <form id="formNovaMetaAss" onsubmit="salvarNovaMetaAss(event)">
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Meta de Cestas (Famílias Fixas)</label>
                            <input type="number" id="assMetaFixa" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Meta de Cestas (Famílias Extras)</label>
                            <input type="number" id="assMetaExtra" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaMetaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Metas</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }
    
    // Tenta buscar se já tem meta pra preencher o form
    document.getElementById('assMetaFixa').value = '';
    document.getElementById('assMetaExtra').value = '';
    try {
        const { data } = await db.from('ass_planejamento_mes')
            .select('*')
            .eq('mes_ref', window.assFiltroMes)
            .eq('ano_ref', window.assFiltroAno);
        
        if(data) {
            data.forEach(m => {
                if(m.tipo_familia === 'Fixa') document.getElementById('assMetaFixa').value = m.qtde_valor;
                if(m.tipo_familia === 'Extra') document.getElementById('assMetaExtra').value = m.qtde_valor;
            });
        }
    } catch(e) {}

    document.getElementById('modalNovaMetaAss').style.display = 'flex';
};

window.salvarNovaMetaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const valFixa = parseInt(document.getElementById('assMetaFixa').value) || 0;
        const valExtra = parseInt(document.getElementById('assMetaExtra').value) || 0;
        
        // Deletamos as metas deste mês para recriar (simples)
        await db.from('ass_planejamento_mes')
            .delete()
            .eq('mes_ref', window.assFiltroMes)
            .eq('ano_ref', window.assFiltroAno);
            
        const payload = [
            { ano_ref: window.assFiltroAno, mes_ref: window.assFiltroMes, tipo_familia: 'Fixa', qtde_valor: valFixa },
            { ano_ref: window.assFiltroAno, mes_ref: window.assFiltroMes, tipo_familia: 'Extra', qtde_valor: valExtra }
        ];
        
        const { error } = await db.from('ass_planejamento_mes').insert(payload);
        if (error) throw error;
        
        document.getElementById('modalNovaMetaAss').style.display = 'none';
        carregarListaEntregas();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar metas.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Metas';
    }
};

window.abrirModalNovaEntrega = async function() {
    if(!document.getElementById('modalNovaEntregaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaEntregaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 500px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Registrar Nova Entrega</h3>
                    
                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                        <span style="color: #60a5fa; font-weight: bold; font-size: 13px;">Baixa de Estoque:</span><br>
                        <span style="color: #94a3b8; font-size: 13px;">Ao confirmar a entrega, o sistema subtrairá automaticamente do estoque as quantidades dos itens que compõem a cesta selecionada. O estoque pode ficar negativo caso não tenha sido atualizado previamente.</span>
                    </div>

                    <form id="formNovaEntregaAss" onsubmit="salvarNovaEntregaAss(event)">
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Data da Entrega</label>
                            <input type="date" id="assEntData" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Família Assistida</label>
                            <select id="assEntFamilia" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="">Carregando famílias...</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Modelo de Cesta Entregue</label>
                            <select id="assEntCesta" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="">Carregando cestas...</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Quantidade de Cestas</label>
                            <input type="number" id="assEntQtd" class="form-control" required value="1" min="1" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaEntregaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Confirmar Entrega</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    document.getElementById('formNovaEntregaAss').reset();
    document.getElementById('assEntData').value = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    try {
        // Fetch famílias
        const { data: familiasRaw, error: famErr } = await db.from('pessoas')
            .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
            .contains('perfis', ['Titular da Família']);
            
        let familias = [];
        if (famErr) {
            // Fallback se contains der erro
            const { data: allP } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis, ass_familias_meta(codigo, status, tipo)');
            if (allP) {
                familias = allP.filter(p => {
                    const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                    return arr.includes('Titular da Família');
                });
            }
        } else {
            familias = familiasRaw || [];
        }

        let familiaOptions = [];
        const arrAtivas = familias.filter(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return meta.status === 'Ativa';
        });
        
        arrAtivas.sort((a,b) => {
            const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
            const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
            return nA.localeCompare(nB);
        });
        
        familiaOptions = arrAtivas.map(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            const nome = f.nome_curto || f.nome_completo;
            const cod = meta.codigo || 'S/C';
            return `<option value="${f.id}">${cod} - ${nome}</option>`;
        });
        
        document.getElementById('assEntFamilia').innerHTML = '<option value="">-- Selecione a família --</option>' + familiaOptions.join('');

        // Fetch cestas
        const { data: cestas } = await db.from('ass_cestas_modelos').select('id, codigo, tipo').order('tipo');
        document.getElementById('assEntCesta').innerHTML = '<option value="">-- Selecione o modelo --</option>' + 
            (cestas || []).map(c => `<option value="${c.id}">${c.codigo} - ${c.tipo}</option>`).join('');
            
    } catch(e) {
        console.error(e);
    }

    document.getElementById('modalNovaEntregaAss').style.display = 'flex';
};

window.salvarNovaEntregaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Lançando...';

    try {
        const dataStr = document.getElementById('assEntData').value;
        const [ano, mes] = dataStr.split('-');
        
        const payload = {
            data_entrega: dataStr,
            ano_ref: parseInt(ano),
            mes_ref: parseInt(mes),
            pessoa_id: document.getElementById('assEntFamilia').value,
            cesta_id: document.getElementById('assEntCesta').value,
            quantidade_entregue: parseInt(document.getElementById('assEntQtd').value) || 1
        };

        // 1. Inserir a entrega
        const { error: entErr } = await db.from('ass_entregas').insert(payload);
        if (entErr) throw entErr;

        // 2. Dar baixa no estoque
        // Pega a composição da cesta escolhida
        const { data: composicao } = await db.from('ass_cesta_composicao').select('item_id, quantidade').eq('cesta_id', payload.cesta_id);
        
        if (composicao && composicao.length > 0) {
            // Para cada item da cesta, temos que buscar o estoque atual e subtrair
            for (const comp of composicao) {
                const qtdSubtrair = comp.quantidade * payload.quantidade_entregue;
                
                // Busca estoque atual
                const { data: itemData } = await db.from('ass_itens_cesta').select('estoque_atual').eq('id', comp.item_id).single();
                
                if (itemData) {
                    const novoEstoque = (itemData.estoque_atual || 0) - qtdSubtrair;
                    // Atualiza
                    await db.from('ass_itens_cesta').update({ estoque_atual: novoEstoque }).eq('id', comp.item_id);
                }
            }
        }

        document.getElementById('modalNovaEntregaAss').style.display = 'none';
        carregarListaEntregas();
        
    } catch(err) {
        console.error(err);
        alert('Erro ao registrar entrega.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar Entrega';
    }
};

window.excluirEntregaAss = function(id) {
    mostrarModalConfirmacaoAss(
        'Excluir Entrega',
        'Tem certeza que deseja excluir esta entrega?<br><br><strong style="color: #ef4444;">Atenção:</strong> O sistema <b>NÃO</b> devolverá automaticamente o estoque dos itens. Você precisará ajustar manualmente no painel de Itens se for necessário.',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_entregas').delete().eq('id', id);
            if (error) throw error;
            carregarListaEntregas();
        }
    );
};
window.assColetivaFamilias = [];
window.assColetivaCestas = [];
window.assColetivaEntregas = [];
window.assColetivaMes = window.assFiltroMes;
window.assColetivaAno = window.assFiltroAno;

window.abrirModalEntregaColetiva = async function() {
    window.assColetivaMes = window.assFiltroMes;
    window.assColetivaAno = window.assFiltroAno;
    
    if (!document.getElementById('modalEntregaColetivaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="modalEntregaColetivaAss" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="width: 800px; max-width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
                    <h2 style="margin-top: 0; color: var(--text-main);">Entrega Coletiva de Cestas</h2>
                    <p style="color: var(--text-muted); font-size: 14px; margin-top: 0; margin-bottom: 20px;">
                        Lançamento rápido para múltiplas famílias ativas de uma só vez.
                    </p>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: var(--bg-body); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <button class="btn" onclick="mudarMesColetiva(-1)">◀ Anterior</button>
                        <strong id="assColetivaDateDisplay" style="color: var(--primary); font-size: 16px;">...</strong>
                        <button class="btn" onclick="mudarMesColetiva(1)">Próximo ▶</button>
                    </div>

                    <div id="assColetivaListContainer" style="flex: 1; overflow-y: auto; background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        Carregando famílias...
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button type="button" class="btn" onclick="document.getElementById('modalEntregaColetivaAss').style.display='none'">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="salvarEntregaColetivaLote(this)">Salvar Entregas em Lote</button>
                    </div>
                </div>
            </div>
        `);
    }

    document.getElementById('modalEntregaColetivaAss').style.display = 'flex';
    await carregarDadosColetiva();
};

window.mudarMesColetiva = async function(delta) {
    let d = new Date(window.assColetivaAno, window.assColetivaMes - 1, 1);
    d.setMonth(d.getMonth() + delta);
    window.assColetivaAno = d.getFullYear();
    window.assColetivaMes = d.getMonth() + 1;
    await carregarDadosColetiva();
};

window.carregarDadosColetiva = async function() {
    const container = document.getElementById('assColetivaListContainer');
    container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Carregando dados, aguarde...</p>';
    
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    document.getElementById('assColetivaDateDisplay').textContent = `${meses[window.assColetivaMes - 1]} ${window.assColetivaAno}`;

    try {
        // Fetch Familias
        const { data: familiasRaw, error: famErr } = await db.from('pessoas')
            .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
            .contains('perfis', ['Titular da Família']);
            
        let familias = [];
        if (famErr) {
            const { data: allP } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis, ass_familias_meta(codigo, status, tipo)');
            if (allP) {
                familias = allP.filter(p => {
                    const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                    return arr.includes('Titular da Família');
                });
            }
        } else {
            familias = familiasRaw || [];
        }

        const arrAtivas = familias.filter(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return meta.status === 'Ativa';
        });
        
        arrAtivas.sort((a,b) => {
            const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
            const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
            return nA.localeCompare(nB);
        });
        
        window.assColetivaFamilias = arrAtivas.map(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return {
                id: f.id,
                codigo: meta.codigo || 'S/C',
                nome_familia: f.nome_curto || f.nome_completo
            };
        });

        // Fetch Cestas
        const { data: cestas } = await db.from('ass_cestas_modelos').select('id, codigo, tipo').order('tipo');
        window.assColetivaCestas = cestas || [];

        // Fetch Entregas do Mês
        const { data: entregas } = await db.from('ass_entregas')
            .select('id, pessoa_id, cesta_id, quantidade_entregue')
            .eq('ano_ref', window.assColetivaAno)
            .eq('mes_ref', window.assColetivaMes);
        window.assColetivaEntregas = entregas || [];

        renderListColetiva();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center; color: #ef4444;">Erro ao carregar os dados.</p>';
    }
};

window.renderListColetiva = function() {
    const container = document.getElementById('assColetivaListContainer');
    
    if (window.assColetivaFamilias.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Nenhuma família ativa encontrada.</p>';
        return;
    }

    let html = `<table style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="border-bottom: 1px solid var(--border);">
                <th style="text-align: left; padding: 8px; color: var(--text-muted);">Código</th>
                <th style="text-align: left; padding: 8px; color: var(--text-muted);">Família</th>
                <th style="text-align: left; padding: 8px; color: var(--text-muted); width: 250px;">Cesta Entregue</th>
                <th style="text-align: center; padding: 8px; color: var(--text-muted); width: 80px;">Qtd</th>
            </tr>
        </thead>
        <tbody>`;

    window.assColetivaFamilias.forEach(f => {
        const entregue = window.assColetivaEntregas.find(e => e.pessoa_id === f.id);
        const defQtd = entregue ? entregue.quantidade_entregue : 0;
        const defCesta = entregue ? entregue.cesta_id : '';
        const entId = entregue ? entregue.id : '';

        let opts = '<option value="">-- Não recebeu --</option>';
        window.assColetivaCestas.forEach(c => {
            opts += `<option value="${c.id}" ${c.id === defCesta ? 'selected' : ''}>${c.tipo}</option>`;
        });

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" class="row-coletiva" data-fam-id="${f.id}" data-ent-id="${entId}">
                <td style="padding: 12px 8px; color: #10b981; font-weight: 500;">${f.codigo || '-'}</td>
                <td style="padding: 12px 8px; color: var(--text-main); font-weight: 500;">${f.nome_familia}</td>
                <td style="padding: 12px 8px;">
                    <select class="form-control col-cesta" style="width: 100%; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;">
                        ${opts}
                    </select>
                </td>
                <td style="padding: 12px 8px;">
                    <input type="number" class="form-control col-qtd" value="${defQtd}" min="0" style="width: 100%; text-align: center; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;">
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
};

window.salvarEntregaColetivaLote = async function(btn) {
    btn.disabled = true;
    btn.textContent = 'Processando...';

    try {
        const rows = document.querySelectorAll('.row-coletiva');
        let successCount = 0;
        
        // Formatar data da entrega (dia 01 do mes ref, ou hoje se for mês atual)
        let dataEntrega = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const hoje = new Date();
        if (hoje.getFullYear() !== window.assColetivaAno || (hoje.getMonth() + 1) !== window.assColetivaMes) {
            const mesStr = window.assColetivaMes.toString().padStart(2, '0');
            dataEntrega = `${window.assColetivaAno}-${mesStr}-01`;
        }

        for (const row of rows) {
            const famId = row.getAttribute('data-fam-id');
            const entId = row.getAttribute('data-ent-id');
            const cestaId = row.querySelector('.col-cesta').value;
            const qtd = parseInt(row.querySelector('.col-qtd').value) || 0;

            if (qtd > 0 && !entId && cestaId) {
                // Inserir novo
                const payload = {
                    data_entrega: dataEntrega,
                    ano_ref: window.assColetivaAno,
                    mes_ref: window.assColetivaMes,
                    pessoa_id: famId,
                    cesta_id: cestaId,
                    quantidade_entregue: qtd
                };
                const { error: err1 } = await db.from('ass_entregas').insert(payload);
                if (!err1) {
                    await descontarEstoqueColetiva(cestaId, qtd);
                    successCount++;
                }
            } 
            else if (qtd > 0 && entId && cestaId) {
                // Update
                const existing = window.assColetivaEntregas.find(e => e.id === entId);
                if (existing && (existing.cesta_id !== cestaId || existing.quantidade_entregue !== qtd)) {
                    const { error: err2 } = await db.from('ass_entregas').update({
                        cesta_id: cestaId,
                        quantidade_entregue: qtd
                    }).eq('id', entId);
                    if (!err2) successCount++;
                }
            } 
            else if (qtd === 0 && entId) {
                // Delete
                const { error: err3 } = await db.from('ass_entregas').delete().eq('id', entId);
                if (!err3) successCount++;
            }
        }

        alert(`Lote salvo com sucesso! ${successCount} atualizações realizadas.`);
        document.getElementById('modalEntregaColetivaAss').style.display = 'none';
        carregarListaEntregas();

    } catch (e) {
        console.error(e);
        alert('Erro ao salvar entregas em lote.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Entregas em Lote';
    }
};

window.descontarEstoqueColetiva = async function(cestaId, qtdEntrega) {
    try {
        const { data: comp } = await db.from('ass_cesta_composicao').select('item_id, quantidade').eq('cesta_id', cestaId);
        if (comp && comp.length > 0) {
            for (const c of comp) {
                const sub = c.quantidade * qtdEntrega;
                const { data: iData } = await db.from('ass_itens_cesta').select('estoque_atual').eq('id', c.item_id).single();
                if (iData) {
                    await db.from('ass_itens_cesta').update({ estoque_atual: iData.estoque_atual - sub }).eq('id', c.item_id);
                }
            }
        }
    } catch(e) { console.error('Erro estoque coletiva:', e); }
};



window.mostrarModalConfirmacaoAss = function(titulo, mensagem, textoBotaoConfirmar, acaoConfirmar) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.6)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';

    const modal = document.createElement('div');
    modal.style.background = 'var(--bg-panel)';
    modal.style.padding = '24px';
    modal.style.borderRadius = '12px';
    modal.style.width = '400px';
    modal.style.maxWidth = '90%';
    modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    modal.style.border = '1px solid var(--border)';
    modal.style.textAlign = 'center';

    modal.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 16px;">🗑️</div>
        <h3 style="color: var(--text-main); margin: 0 0 12px 0; font-size: 18px;">${titulo}</h3>
        <p style="color: var(--text-muted); margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
            ${mensagem}
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
            <button id="btnCancelExcluirAss" class="btn" style="flex: 1;">Cancelar</button>
            <button id="btnConfirmExcluirAss" class="btn" style="background: #ef4444; color: #ffffff; border-color: #ef4444; flex: 1;">${textoBotaoConfirmar}</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btnCancelExcluirAss').onclick = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('btnConfirmExcluirAss').onclick = async () => {
        const btn = document.getElementById('btnConfirmExcluirAss');
        btn.innerHTML = 'Excluindo...';
        btn.disabled = true;
        try {
            await acaoConfirmar();
            document.body.removeChild(overlay);
        } catch(err) {
            console.error(err);
            alert('Erro ao excluir.');
            btn.innerHTML = 'Tentar Novamente';
            btn.disabled = false;
        }
    };
};

