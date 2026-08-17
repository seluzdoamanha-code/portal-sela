// ==========================================
// MÓDULO: FAMÍLIAS ASSISTIDAS
// ==========================================

window.carregarAppFamilias = async function() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="color: var(--text-main); margin: 0; font-size: 24px;">Famílias Assistidas</h2>
                <p style="color: var(--text-muted); margin: 4px 0 0 0; font-size: 14px;">Acompanhamento Social e Diário de Ocorrências</p>
            </div>
        </div>

        <div style="background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
            
            <!-- Menu Interno do App -->
            <div style="display: flex; gap: 8px; padding: 16px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none;">
                <button onclick="mudarAbaFamilias('dashboard')" id="btnFamDashboard" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Dashboard</button>
                <button onclick="mudarAbaFamilias('cadastro')" id="btnFamCadastro" class="btn" style="white-space: nowrap; border-radius: 8px;">👨‍👩‍👧‍👦 Famílias</button>
                
                
                <button onclick="mudarAbaFamilias('ocorrencias')" id="btnFamOcorrencias" class="btn" style="white-space: nowrap; border-radius: 8px;">📋 Ocorrências</button>
            </div>

            <!-- Conteúdo das Abas -->
            <div style="padding: 24px; min-height: 400px;">
                
                <!-- Aba Dashboard -->
                <div id="famDashboard" class="fam-tab-content" style="display: none;">
                    <div id="famDashboardContainer">
                        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                            Carregando indicadores...
                        </div>
                    </div>
                </div>

                <!-- Aba Famílias -->
                <div id="famCadastro" class="fam-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Cadastro de Famílias</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaFamilia()" style="border-radius: 8px; font-weight: 500;">+ Nova Família</button>
                    </div>
                    <div id="famCadastroLista"></div>
                </div>

                <!-- Aba Ocorrências -->
                <div id="famOcorrencias" class="fam-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Ocorrências e Acompanhamento</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()" style="border-radius: 8px; font-weight: 500;">+ Registrar Ocorrência</button>
                    </div>
                    <div id="famOcorrenciasLista"></div>
                </div>

            </div>
        </div>
    `;

    // Inicializa na primeira aba
    window.mudarAbaFamilias('dashboard');
};

// Controle de abas internas
window.mudarAbaFamilias = function(aba) {
    const abas = ['dashboard', 'cadastro', 'ocorrencias'];
    
    abas.forEach(a => {
        // Esconder conteúdo
        const el = document.getElementById('fam' + a.charAt(0).toUpperCase() + a.slice(1));
        if (el) el.style.display = 'none';
        
        // Resetar botões
        const btn = document.getElementById('btnFam' + a.charAt(0).toUpperCase() + a.slice(1));
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.style.fontWeight = 'normal';
            btn.style.color = 'var(--text-main)';
            btn.style.background = 'transparent';
        }
    });

    // Ativar a selecionada
    const elAtiva = document.getElementById('fam' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (elAtiva) elAtiva.style.display = 'block';

    const btnAtivo = document.getElementById('btnFam' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (btnAtivo) {
        btnAtivo.classList.add('btn-primary');
        btnAtivo.style.fontWeight = 'bold';
        btnAtivo.style.color = 'white';
        btnAtivo.style.background = 'var(--primary)';
    }

    // Disparar carregamento de dados conforme a aba
    if (aba === 'dashboard') carregarDashboardFamilias();
    if (aba === 'cadastro') carregarListaFamilias();
    if (aba === 'ocorrencias') carregarListaOcorrencias();
};

// ==========================================
// FUNÇÕES DE CARREGAMENTO (STUBS)
// ==========================================

async function carregarDashboardFamilias() {
    const container = document.getElementById('famDashboardContainer');
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Carregando indicadores...</div>';
    
    try {
        // 1. Radar de Famílias
        const resFam = await db.from('ass_familias').select('id, tipo');
        if (resFam.error) throw resFam.error;
        
        const totalFamilias = resFam.data.length;
        const totalFixas = resFam.data.filter(f => f.tipo === 'Fixa/Assistida').length;
        const totalExtras = totalFamilias - totalFixas;
        
        // 2. Alerta Social (Ocorrências Graves nos últimos 30 dias)
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        
        const resOco = await db.from('ass_ocorrencias')
            .select('tags')
            .gte('data_ocorrencia', trintaDiasAtras.toISOString().split('T')[0]);
            
        let alertasSociais = 0;
        if (resOco.data) {
            resOco.data.forEach(o => {
                if (o.tags && (o.tags.includes('Grave') || o.tags.includes('Atenção') || o.tags.includes('Alerta'))) {
                    alertasSociais++;
                }
            });
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                <!-- Radar de Famílias -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div style="font-size: 32px;">👨‍👩‍👧‍👦</div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Famílias Assistidas Ativas</div>
                    <div style="font-size: 42px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; line-height: 1;">${totalFamilias}</div>
                    
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-muted);">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
                            ${totalFixas} Fixas
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #a855f7;"></span>
                            ${totalExtras} Extras
                        </div>
                    </div>
                </div>

                <!-- Alerta Social -->
                <div style="background: var(--bg-panel); border: 1px solid ${alertasSociais > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div style="font-size: 32px;">${alertasSociais > 0 ? '🚨' : '✅'}</div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Alertas Sociais (30 Dias)</div>
                    <div style="font-size: 42px; font-weight: 700; color: ${alertasSociais > 0 ? '#ef4444' : 'var(--text-main)'}; margin-bottom: 12px; line-height: 1;">${alertasSociais}</div>
                    
                    <div style="font-size: 13px; color: var(--text-muted);">
                        ${alertasSociais > 0 
                            ? 'Ocorrências marcadas como Grave ou Atenção requerem acompanhamento da Diretoria.' 
                            : 'Nenhum alerta crítico registrado recentemente. Tudo sob controle.'}
                    </div>
                </div>
            </div>
        `;
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Erro ao carregar dashboard.</div>';
    }
}

async function carregarListaFamilias() {
    const container = document.getElementById('famCadastroLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando famílias...</div>';

    try {
        const { data: familias, error } = await db.from('ass_familias').select(`
            *,
            responsavel:pessoas!ass_familias_responsavel_id_fkey(nome_completo),
            ass_membros_familia(
                id,
                parentesco,
                pessoas(nome_completo)
            )
        `).order('nome_familia');
        
        if (error) throw error;

        if (!familias || familias.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma família cadastrada.</div>';
            return;
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                ${familias.map(f => `
                    <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px; position: relative;">
                        
                        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px;">
                            <button onclick="editarFamiliaAss('${f.id}')" style="background:none; border:none; color: #60a5fa; cursor:pointer;" title="Editar">✏️</button>
                            <button onclick="excluirFamiliaAss('${f.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir">🗑️</button>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <h4 style="color: var(--primary); margin: 0; font-size: 16px;">${f.nome_familia}</h4>
                            <span style="background: #334155; color: #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${f.codigo}</span>
                        </div>
                        
                        <div style="margin-bottom: 12px; font-size: 13px;">
                            <span style="color: var(--text-muted);">Responsável:</span> 
                            <span style="color: var(--text-main); font-weight: 500;">${f.responsavel?.nome_completo || 'Sem cadastro'}</span>
                        </div>
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                            <span style="background: ${f.tipo === 'Extra' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${f.tipo === 'Extra' ? '#eab308' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                ${f.tipo}
                            </span>
                            <span style="background: ${f.status === 'Ativa' || f.status === 'Ativo' ? 'rgba(16,185,129,0.1)' : f.status === 'Triagem' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${f.status === 'Ativa' || f.status === 'Ativo' ? '#10b981' : f.status === 'Triagem' ? '#f59e0b' : '#ef4444'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                ${f.status}
                            </span>
                        </div>

                        <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 12px;">
                            <h6 style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Membros da Família (${f.ass_membros_familia?.length || 0}):</h6>
                            ${!f.ass_membros_familia || f.ass_membros_familia.length === 0 ? '<span style="font-size:12px; color:var(--text-muted);">Nenhum membro vinculado</span>' : 
                                f.ass_membros_familia.map(m => `
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                                        <span style="color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.pessoas?.nome_completo || 'Sem nome'}</span>
                                        <span style="color: var(--text-muted); padding-left: 8px;">${m.parentesco}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar famílias.</div>';
    }
}

async function carregarListaOcorrencias() {
    const container = document.getElementById('famOcorrenciasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando ocorrências...</div>';

    try {
        const { data, error } = await db.from('ass_ocorrencias')
            .select('*, ass_familias(nome_familia, codigo)')
            .order('data_ocorrencia', { ascending: false });
            
        if (error) throw error;

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; color: var(--text-main);">Livro de Ocorrências e Visitas</h3>
                <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()">📝 Registrar Ocorrência</button>
            </div>
            
            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                ${(!data || data.length === 0) ? '<p style="color:var(--text-muted); font-size:13px; text-align: center; padding: 20px;">Nenhuma ocorrência registrada no sistema.</p>' : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                    <th style="padding: 8px 4px; width: 100px;">Data</th>
                                    <th style="padding: 8px 4px; width: 100px;">Cód.</th>
                                    <th style="padding: 8px 4px;">Família</th>
                                    <th style="padding: 8px 4px; width: 120px;">Tipo</th>
                                    <th style="padding: 8px 4px;">Observação</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 80px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(o => {
                                    let corTipo = '#94a3b8'; // Default Normal
                                    if(o.tipo === 'Grave') corTipo = '#ef4444';
                                    if(o.tipo === 'Familiar') corTipo = '#8b5cf6';
                                    if(o.tipo === 'Entrega') corTipo = '#f59e0b';
                                    
                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                        <td style="padding: 12px 4px; color: var(--text-muted);">${o.data_ocorrencia.split('-').reverse().join('/')}</td>
                                        <td style="padding: 12px 4px; color: #60a5fa; font-weight: bold;">${o.codigo}</td>
                                        <td style="padding: 12px 4px; color: var(--text-main); font-weight: 500;">
                                            ${o.ass_familias ? `${o.ass_familias.codigo} - ${o.ass_familias.nome_familia}` : 'Família Removida'}
                                        </td>
                                        <td style="padding: 12px 4px;">
                                            <span style="background: ${corTipo}22; color: ${corTipo}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                                                ${o.tipo}
                                            </span>
                                        </td>
                                        <td style="padding: 12px 4px; color: var(--text-muted); max-width: 300px; white-space: pre-wrap; word-wrap: break-word;">${o.observacao || '-'}</td>
                                        <td style="padding: 12px 4px; text-align: right;">
                                            <button onclick="excluirOcorrenciaAss('${o.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir Ocorrência">🗑️</button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = html;

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar ocorrências.</div>';
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
// MODAL DE FAMÍLIAS
// ==========================================

window.abrirModalNovaFamilia = async function() {
    if(!document.getElementById('modalNovaFamiliaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaFamiliaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <h3 id="modalNovaFamiliaAssTitle" style="margin-top: 0; color: var(--text-main);">Nova Família Assistida</h3>
                    
                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                        <span style="color: #60a5fa; font-weight: bold; font-size: 13px;">⚠️ Importante:</span><br>
                        <span style="color: #94a3b8; font-size: 13px;">O Responsável e os Membros devem estar previamentes cadastrados no sistema (Tabela Pessoas) com o perfil "Membro da Família". Sem isso, eles não aparecerão na lista de buscas abaixo.</span>
                    </div>

                    <form id="formNovaFamiliaAss" onsubmit="salvarNovaFamiliaAss(event)">
                        <input type="hidden" id="assFamiliaId">
                        
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código (Ex: A01)</label>
                                <input type="text" id="assFamCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Nome de Identificação (Ex: Família Souza)</label>
                                <input type="text" id="assFamNome" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Tipo de Assistência</label>
                                <select id="assFamTipo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                    <option value="Fixa/Assistida">Fixa / Assistida</option>
                                    <option value="Extra">Extra</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Status</label>
                                <select id="assFamStatus" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                    <option value="Ativa">Ativa</option>
                                    <option value="Triagem">Triagem</option>
                                    <option value="Inativa">Inativa</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <label style="display: block; color: var(--primary); font-weight: 500; margin-bottom: 8px;">Responsável Legal</label>
                            <select id="assFamResponsavel" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="">Carregando pessoas...</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 8px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <label style="display: block; color: var(--text-main); font-weight: 500;">Membros da Família</label>
                                <button type="button" class="btn" onclick="adicionarLinhaMembroAss()" style="padding: 4px 8px; font-size: 12px;">+ Adicionar Membro</button>
                            </div>
                            <div id="assFamMembrosContainer" style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
                                <!-- Linhas de membros dinamicas -->
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaFamiliaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Família</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    document.getElementById('formNovaFamiliaAss').reset();
    document.getElementById('assFamiliaId').value = '';
    document.getElementById('modalNovaFamiliaAssTitle').textContent = 'Nova Família Assistida';
    document.getElementById('assFamMembrosContainer').innerHTML = ''; // limpa membros
    
    // Carregar pessoas do banco
    const btn = document.querySelector('#formNovaFamiliaAss button[type="submit"]');
    btn.disabled = true;
    
    try {
        const { data: pessoas, error } = await db.from('pessoas').select('id, nome_completo, perfis').order('nome_completo');
        if(error) throw error;
        
        // Pode ser útil guardar pra usar nos selects de membros
        window.assPessoasGlobais = pessoas;

        // Populate Responsável
        const selectResp = document.getElementById('assFamResponsavel');
        selectResp.innerHTML = window.gerarOpcoesPessoasAss('');
            
    } catch(err) {
        console.error("Erro ao carregar pessoas:", err);
    } finally {
        btn.disabled = false;
    }

    document.getElementById('modalNovaFamiliaAss').style.display = 'flex';
};

window.gerarOpcoesPessoasAss = function(selecionadoId = '') {
    const pessoas = window.assPessoasGlobais || [];
    const comPerfil = pessoas.filter(p => p.perfis && p.perfis.includes('Membro da Família'));
    const semPerfil = pessoas.filter(p => !p.perfis || !p.perfis.includes('Membro da Família'));
    
    let html = '<option value="">-- Selecione --</option>';
    
    if (comPerfil.length > 0) {
        html += '<optgroup label="Com perfil: Membro da Família">';
        html += comPerfil.map(p => `<option value="${p.id}" ${p.id === selecionadoId ? 'selected' : ''}>${p.nome_completo}</option>`).join('');
        html += '</optgroup>';
    }
    
    if (semPerfil.length > 0) {
        html += '<optgroup label="Demais Cadastros (Sem perfil)">';
        html += semPerfil.map(p => `<option value="${p.id}" ${p.id === selecionadoId ? 'selected' : ''}>${p.nome_completo}</option>`).join('');
        html += '</optgroup>';
    }
    
    return html;
};

window.adicionarLinhaMembroAss = function(pessoaId = '', parentesco = '') {
    const container = document.getElementById('assFamMembrosContainer');
    
    const div = document.createElement('div');
    div.className = 'ass-membro-linha';
    div.style = 'display: flex; gap: 8px; margin-bottom: 8px;';
    
    const pessoasOptions = window.gerarOpcoesPessoasAss(pessoaId);

    div.innerHTML = `
        <select class="form-control mem-pessoa" required style="flex: 2; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;">
            ${pessoasOptions}
        </select>
        <input type="text" class="form-control mem-parentesco" required placeholder="Parentesco (Ex: Filho)" value="${parentesco}" style="flex: 1; background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 6px; border-radius: 4px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Remover">✖</button>
    `;
    container.appendChild(div);
};

window.salvarNovaFamiliaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const idEdit = document.getElementById('assFamiliaId').value;
        const payloadFam = {
            codigo: document.getElementById('assFamCodigo').value.trim(),
            tipo: document.getElementById('assFamTipo').value,
            nome_familia: document.getElementById('assFamNome').value.trim(),
            responsavel_id: document.getElementById('assFamResponsavel').value || null,
            status: document.getElementById('assFamStatus').value
        };

        let famId = idEdit;

        if (idEdit) {
            // Update
            const { error: famError } = await db.from('ass_familias').update(payloadFam).eq('id', idEdit);
            if(famError) throw famError;
            
            // Delete membros antigos
            await db.from('ass_membros_familia').delete().eq('familia_id', idEdit);
        } else {
            // Insert
            const { data: famData, error: famError } = await db.from('ass_familias').insert(payloadFam).select('id').single();
            if(famError) throw famError;
            famId = famData.id;
        }

        // Insert Membros
        const linhas = document.querySelectorAll('.ass-membro-linha');
        const membros = [];
        linhas.forEach(l => {
            const pid = l.querySelector('.mem-pessoa').value;
            const par = l.querySelector('.mem-parentesco').value.trim();
            if(pid && par) {
                membros.push({
                    familia_id: famId,
                    pessoa_id: pid,
                    parentesco: par
                });
            }
        });

        if(membros.length > 0) {
            const { error: memError } = await db.from('ass_membros_familia').insert(membros);
            if (memError) throw memError;
        }

        document.getElementById('modalNovaFamiliaAss').style.display = 'none';
        carregarListaFamilias();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar Família. Verifique se o código não está duplicado.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Família';
    }
};

window.editarFamiliaAss = async function(id) {
    await abrirModalNovaFamilia(); // vai carregar pessoas globais
    document.getElementById('modalNovaFamiliaAssTitle').textContent = 'Editar Família Assistida';
    
    try {
        const { data: familia, error } = await db.from('ass_familias').select('*, ass_membros_familia(*)').eq('id', id).single();
        if(error) throw error;
        
        document.getElementById('assFamiliaId').value = familia.id;
        document.getElementById('assFamCodigo').value = familia.codigo;
        document.getElementById('assFamNome').value = familia.nome_familia;
        document.getElementById('assFamTipo').value = familia.tipo;
        document.getElementById('assFamStatus').value = familia.status;
        document.getElementById('assFamResponsavel').value = familia.responsavel_id || '';
        
        if (familia.ass_membros_familia) {
            familia.ass_membros_familia.forEach(m => {
                adicionarLinhaMembroAss(m.pessoa_id, m.parentesco);
            });
        }
    } catch(err) {
        console.error(err);
        alert('Erro ao carregar Família.');
    }
};

window.excluirFamiliaAss = async function(id) {
    if(!confirm("Tem certeza que deseja excluir esta Família? Se houver entregas registradas, não será possível.")) return;
    try {
        const { error } = await db.from('ass_familias').delete().eq('id', id);
        if (error) throw error;
        carregarListaFamilias();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir família. Verifique se já não existem entregas registradas para ela.');
    }
};

// ==========================================
// OUTROS STUBS
// ==========================================
// ==========================================
// MODAIS DE OCORRÊNCIAS
// ==========================================

window.abrirModalNovaOcorrencia = async function() {
    if(!document.getElementById('modalNovaOcorrenciaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaOcorrenciaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 500px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Registrar Nova Ocorrência</h3>

                    <form id="formNovaOcorrenciaAss" onsubmit="salvarNovaOcorrenciaAss(event)">
                        <div style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Data</label>
                                <input type="date" id="assOcorData" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código (Ex: RO001)</label>
                                <input type="text" id="assOcorCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Família Envolvida</label>
                            <select id="assOcorFamilia" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="">Carregando famílias...</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Tipo de Ocorrência</label>
                            <select id="assOcorTipo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="Normal">Normal (Visita/Acompanhamento)</option>
                                <option value="Grave">Grave (Problema/Alerta)</option>
                                <option value="Entrega">Problema na Entrega</option>
                                <option value="Familiar">Conflito/Questão Familiar</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Relato / Observação</label>
                            <textarea id="assOcorObs" class="form-control" rows="4" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px; resize: vertical;"></textarea>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn" onclick="document.getElementById('modalNovaOcorrenciaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Ocorrência</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    document.getElementById('formNovaOcorrenciaAss').reset();
    document.getElementById('assOcorData').value = new Date().toISOString().split('T')[0];
    
    // Gerar um código sugerido (RO + Timestamp)
    const timestamp = new Date().getTime().toString().slice(-4);
    document.getElementById('assOcorCodigo').value = 'RO' + timestamp;
    
    try {
        const { data: familias } = await db.from('ass_familias').select('id, nome_familia, codigo').order('nome_familia');
        document.getElementById('assOcorFamilia').innerHTML = '<option value="">-- Selecione a família --</option>' + 
            (familias || []).map(f => `<option value="${f.id}">${f.codigo} - ${f.nome_familia}</option>`).join('');
    } catch(e) {
        console.error(e);
    }

    document.getElementById('modalNovaOcorrenciaAss').style.display = 'flex';
};

window.salvarNovaOcorrenciaAss = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const payload = {
            data_ocorrencia: document.getElementById('assOcorData').value,
            codigo: document.getElementById('assOcorCodigo').value.trim(),
            familia_id: document.getElementById('assOcorFamilia').value,
            tipo: document.getElementById('assOcorTipo').value,
            observacao: document.getElementById('assOcorObs').value.trim()
        };

        const { error } = await db.from('ass_ocorrencias').insert(payload);
        if (error) throw error;

        document.getElementById('modalNovaOcorrenciaAss').style.display = 'none';
        carregarListaOcorrencias();
        
    } catch(err) {
        console.error(err);
        if (err.code === '23505') {
            alert('Erro: Já existe uma ocorrência com este Código (RO).');
        } else {
            alert('Erro ao registrar ocorrência.');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Ocorrência';
    }
};

window.excluirOcorrenciaAss = async function(id) {
    if(!confirm("Deseja realmente excluir esta ocorrência do livro?")) return;
    try {
        const { error } = await db.from('ass_ocorrencias').delete().eq('id', id);
        if (error) throw error;
        carregarListaOcorrencias();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir ocorrência.');
    }
};

