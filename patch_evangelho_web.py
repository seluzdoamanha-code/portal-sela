import re

with open('hub.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# 1. Add "isEvangelho" shortcut to homeAppsGrid
target1 = r'(const isAtendimento = nomeEstrutura\.includes\(\'atendimento\'\);)'
replacement1 = r"""\1
        const isEvangelho = nomeEstrutura.includes('evangelho');"""

js_content = re.sub(target1, replacement1, js_content)

# 2. Add the card to the apps grid
target2 = r'(if \(isAtendimento && config\.apps\) \{)'
replacement2 = r"""if (isEvangelho && config.apps) {
            hasApps = true;
            appsGrid.innerHTML += `
                <div class="card-agenda" style="background: rgba(16, 185, 129, 0.02); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #10b981; font-size: 14px; margin-bottom: 6px;">🏡 EVANGELHO NO LAR</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">Gestão de implantações e acompanhamento de Evangelho no Lar.</div>
                    </div>
                    <button class="btn" onclick="mudarAbaAtalho('abaApps')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 12px; padding: 6px 12px;">Abrir Painel ➔</button>
                </div>
            `;
        }

        \1"""

js_content = re.sub(target2, replacement2, js_content)

# 3. Add to the abaApps container initialization
target3 = r'(} else if \(isAtendimento\) \{)'
replacement3 = r"""} else if (isEvangelho) {
            btnApps.style.display = 'block';
            if (typeof window.carregarModuloEvangelho === 'function') {
                window.carregarModuloEvangelho();
            }
        \1"""

js_content = re.sub(target3, replacement3, js_content)

# 4. Append the module at the end of the file
module_code = """

// ==========================================
// MÓDULO WEB: EVANGELHO NO LAR
// ==========================================

window.carregarModuloEvangelho = async function() {
    const container = document.getElementById('containerApps');
    container.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
            <!-- Menu Lateral do Mini App -->
            <div style="width: 250px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; flex-shrink: 0;">
                <div style="padding: 16px; border-bottom: 1px solid var(--border); background: rgba(16, 185, 129, 0.05);">
                    <h2 style="font-size: 16px; color: #10b981; margin: 0;">🏡 Evangelho no Lar</h2>
                    <p style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Caixa de Entrada e Gestão</p>
                </div>
                <div style="padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <button onclick="mudarAbaEvangelho('caixa')" id="btnAbaEvCx" class="btn" style="text-align: left; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border); justify-content: flex-start;">📥 Caixa de Entrada</button>
                    <button onclick="mudarAbaEvangelho('andamento')" id="btnAbaEvAnd" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">🔄 Em Andamento</button>
                    <button onclick="mudarAbaEvangelho('concluidos')" id="btnAbaEvConc" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">✅ Implantados</button>
                </div>
            </div>

            <!-- Conteúdo -->
            <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
                <div id="evangelhoContent">
                    <div style="color: var(--text-muted); font-size: 14px;">Carregando dados...</div>
                </div>
            </div>
        </div>
        
        <!-- Modal Nova Implantação -->
        <div class="modal-overlay" id="modalEvangelho">
            <div class="modal-content" style="max-width: 600px;">
                <h2 style="margin-bottom: 16px; color: #10b981;">Implantação de Evangelho no Lar</h2>
                <form id="formEvangelho">
                    <input type="hidden" id="inEvId">
                    <input type="hidden" id="inEvPessoaId">
                    <input type="hidden" id="inEvSessaoId">
                    
                    <div style="margin-bottom: 20px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #10b981; font-weight: 600;" id="lblEvPessoa"></div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label>Data Prevista / Implantação</label>
                            <input type="date" id="inEvData" required>
                        </div>
                        <div class="form-group">
                            <label>Hora Prevista</label>
                            <input type="time" id="inEvHora">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label>Dia da Semana Fixo (Família)</label>
                            <select id="inEvDiaSemana">
                                <option value="">Selecione...</option>
                                <option value="Domingo">Domingo</option>
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira">Quarta-feira</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                                <option value="Sexta-feira">Sexta-feira</option>
                                <option value="Sábado">Sábado</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Horário Fixo</label>
                            <input type="time" id="inEvHorarioFixo">
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>Equipe Responsável (Selecione as pessoas)</label>
                        <select id="inEvEquipe" multiple style="height: 100px;">
                            <!-- Preenchido via JS -->
                        </select>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Segure CTRL/CMD para selecionar vários.</div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
                        <label>Status da Implantação / Parecer Final</label>
                        <select id="inEvStatus">
                            <option value="Fila de Espera">Fila de Espera (Apenas marcado)</option>
                            <option value="Em andamento">Em andamento (Equipe designada)</option>
                            <option value="Implantado">✅ Implantado com Sucesso</option>
                            <option value="Precisando de Acompanhamento">⚠️ Precisando de Acompanhamento</option>
                            <option value="Não Implantado">❌ Não Implantado / Desistência</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalEvangelho').classList.remove('show')">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="background: #10b981; border-color: #10b981;">Salvar Implantação</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal Acompanhamento -->
        <div class="modal-overlay" id="modalEvAcompanhamento">
            <div class="modal-content" style="max-width: 400px;">
                <h2 style="margin-bottom: 16px;">Registrar Acompanhamento</h2>
                <form id="formEvAcompanhamento">
                    <input type="hidden" id="inAcompEvId">
                    <div class="form-group">
                        <label>Data do Contato</label>
                        <input type="date" id="inAcompData" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="inAcompConfirmado" style="width: 18px; height: 18px; accent-color: #10b981;">
                            Confirmou que realizou o Evangelho?
                        </label>
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label>Observação / Parecer</label>
                        <textarea id="inAcompObs" rows="3" required placeholder="Como foi? Dúvidas?"></textarea>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalEvAcompanhamento').classList.remove('show')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Preparar eventos
    document.getElementById('formEvangelho').addEventListener('submit', salvarEvangelho);
    document.getElementById('formEvAcompanhamento').addEventListener('submit', salvarEvAcompanhamento);
    
    // Carregar Equipe (todas as pessoas ativas para o select multiplo)
    try {
        const { data: pessoas } = await db.from('pessoas').select('id, nome_curto, nome_completo').eq('status', 'Ativo').order('nome_completo');
        if (pessoas) {
            const sel = document.getElementById('inEvEquipe');
            window.evangelhoPessoasDict = {}; // para buscas rápidas
            pessoas.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.text = p.nome_completo;
                sel.appendChild(opt);
                window.evangelhoPessoasDict[p.id] = p.nome_curto || p.nome_completo;
            });
        }
    } catch (e) { console.error(e); }

    // Carregar primeira aba
    mudarAbaEvangelho('caixa');
};

window.mudarAbaEvangelho = function(aba) {
    document.getElementById('btnAbaEvCx').style.background = 'transparent';
    document.getElementById('btnAbaEvCx').style.color = 'var(--text-muted)';
    document.getElementById('btnAbaEvCx').style.borderColor = 'transparent';
    
    document.getElementById('btnAbaEvAnd').style.background = 'transparent';
    document.getElementById('btnAbaEvAnd').style.color = 'var(--text-muted)';
    document.getElementById('btnAbaEvAnd').style.borderColor = 'transparent';
    
    document.getElementById('btnAbaEvConc').style.background = 'transparent';
    document.getElementById('btnAbaEvConc').style.color = 'var(--text-muted)';
    document.getElementById('btnAbaEvConc').style.borderColor = 'transparent';
    
    let btnAtivo = document.getElementById('btnAbaEvCx');
    if (aba === 'andamento') btnAtivo = document.getElementById('btnAbaEvAnd');
    if (aba === 'concluidos') btnAtivo = document.getElementById('btnAbaEvConc');
    
    btnAtivo.style.background = 'var(--bg-panel)';
    btnAtivo.style.color = 'var(--text-main)';
    btnAtivo.style.borderColor = 'var(--border)';
    
    carregarConteudoEvangelho(aba);
};

window.carregarConteudoEvangelho = async function(aba) {
    const content = document.getElementById('evangelhoContent');
    content.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Carregando...</div>';
    
    try {
        // 1. Fetch from app_evangelho_lar
        const { data: registros, error: err1 } = await db.from('app_evangelho_lar').select(`
            *,
            pessoas!app_evangelho_lar_pessoa_id_fkey (id, nome_curto, nome_completo, celular)
        `);
        if (err1) throw err1;
        
        let html = '';
        
        if (aba === 'caixa') {
            // Fetch Sessoes Atendimento Fraterno that have evangelho_lar = true
            const { data: sessoes, error: err2 } = await db.from('app_atendimento_sessoes').select(`
                id, data,
                app_atendimento_fraterno!inner (
                    paciente_id,
                    pessoas!inner (id, nome_curto, nome_completo, celular)
                )
            `).eq('evangelho_lar', true);
            
            if (err2) throw err2;
            
            // Filter sessions that are NOT already in app_evangelho_lar
            const idsProcessados = registros.filter(r => r.sessao_origem_id).map(r => r.sessao_origem_id);
            const fila = sessoes.filter(s => !idsProcessados.includes(s.id));
            
            // Also include from app_evangelho_lar where status is 'Fila de Espera'
            const filaManuais = registros.filter(r => r.status_implantacao === 'Fila de Espera');
            
            if (fila.length === 0 && filaManuais.length === 0) {
                html = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Nenhum pedido de implantação na Caixa de Entrada.</div>';
            } else {
                html += '<h3 style="margin-bottom: 16px; color: var(--text-main);">Caixa de Entrada (Aguardando Implantação)</h3>';
                html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
                
                fila.forEach(s => {
                    const pac = s.app_atendimento_fraterno.pessoas;
                    const zap = pac.celular ? `<a href="https://wa.me/55${pac.celular.replace(/\D/g,'')}" target="_blank" style="font-size: 12px; color: #10b981; text-decoration: none;">📱 ${pac.celular}</a>` : '';
                    html += `
                        <div style="padding: 16px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 15px;">${pac.nome_completo}</div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Pedido via Atendimento Fraterno em ${s.data.split('-').reverse().join('/')}</div>
                                ${zap}
                            </div>
                            <button class="btn btn-primary" style="background: #10b981; border-color: #10b981;" onclick="abrirModalEvangelho(null, '${pac.id}', '${pac.nome_completo}', '${s.id}')">Iniciar Processo</button>
                        </div>
                    `;
                });
                
                filaManuais.forEach(r => {
                    const pac = r.pessoas;
                    html += `
                        <div style="padding: 16px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); font-size: 15px;">${pac.nome_completo}</div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Aguardando designação de equipe</div>
                            </div>
                            <button class="btn btn-primary" style="background: #10b981; border-color: #10b981;" onclick="abrirModalEvangelho('${r.id}')">Continuar</button>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
        } else {
            let filtrados = [];
            if (aba === 'andamento') {
                filtrados = registros.filter(r => r.status_implantacao === 'Em andamento' || r.status_implantacao === 'Precisando de Acompanhamento');
            } else {
                filtrados = registros.filter(r => r.status_implantacao === 'Implantado' || r.status_implantacao === 'Não Implantado');
            }
            
            if (filtrados.length === 0) {
                html = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Nenhum registro encontrado nesta aba.</div>`;
            } else {
                html += '<div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">';
                
                window.evangelhoDataList = filtrados; // To use in modal
                
                filtrados.forEach(r => {
                    const pac = r.pessoas;
                    const equipe = Array.isArray(r.equipe_json) ? r.equipe_json.map(id => window.evangelhoPessoasDict[id] || 'Desconhecido').join(', ') : 'Não definida';
                    
                    const dataImp = r.data_implantacao ? r.data_implantacao.split('-').reverse().join('/') : 'A definir';
                    let statusColor = '#3b82f6';
                    if (r.status_implantacao === 'Implantado') statusColor = '#10b981';
                    if (r.status_implantacao === 'Precisando de Acompanhamento') statusColor = '#f59e0b';
                    if (r.status_implantacao === 'Não Implantado') statusColor = '#ef4444';
                    
                    // Renderizar Acompanhamentos
                    let acompHtml = '';
                    if (r.acompanhamentos_json && Array.isArray(r.acompanhamentos_json) && r.acompanhamentos_json.length > 0) {
                        acompHtml = '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px;">';
                        acompHtml += '<div style="font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Últimos Acompanhamentos:</div>';
                        // Pegar os ultimos 2
                        r.acompanhamentos_json.slice(-2).reverse().forEach(a => {
                            const icon = a.confirmado ? '✅' : '❌';
                            acompHtml += `<div style="margin-bottom: 4px;"><span style="color:var(--text-muted)">${a.data.split('-').reverse().join('/')}</span> ${icon} ${a.comentario}</div>`;
                        });
                        acompHtml += '</div>';
                    }
                    
                    html += `
                        <div style="padding: 16px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; position: relative;">
                            <span style="position: absolute; top: 16px; right: 16px; background: ${statusColor}20; color: ${statusColor}; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 12px;">${r.status_implantacao}</span>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 16px; margin-bottom: 4px; padding-right: 90px;">${pac.nome_completo}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📅 Implantação: ${dataImp} ${r.hora_implantacao ? 'às ' + r.hora_implantacao : ''}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">🔄 Rotina: ${r.dia_semana_evangelho || '?'} às ${r.horario_evangelho || '?'}</div>
                            <div style="font-size: 13px; color: var(--text-muted);">👥 Equipe: ${equipe}</div>
                            
                            ${acompHtml}
                            
                            <div style="margin-top: 16px; display: flex; gap: 8px;">
                                <button class="btn btn-secondary" style="flex: 1; font-size: 12px; padding: 6px;" onclick="abrirModalEvangelho('${r.id}')">Editar</button>
                                <button class="btn btn-secondary" style="flex: 1; font-size: 12px; padding: 6px;" onclick="abrirAcompanhamentoEv('${r.id}')">+ Acompanhamento</button>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }
        }
        
        content.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        content.innerHTML = '<div style="color: red; padding: 20px;">Erro ao carregar dados.</div>';
    }
};

window.abrirModalEvangelho = function(id, pessoaId = '', pessoaNome = '', sessaoId = '') {
    const form = document.getElementById('formEvangelho');
    form.reset();
    
    if (id) {
        // Modo Edição
        const r = window.evangelhoDataList.find(x => x.id === id);
        if (!r) return;
        
        document.getElementById('inEvId').value = r.id;
        document.getElementById('inEvPessoaId').value = r.pessoa_id;
        document.getElementById('inEvSessaoId').value = r.sessao_origem_id || '';
        document.getElementById('lblEvPessoa').innerHTML = `🏡 Evangelho no Lar de:<br><span style="font-size: 20px;">${r.pessoas.nome_completo}</span>`;
        
        document.getElementById('inEvData').value = r.data_implantacao || '';
        document.getElementById('inEvHora').value = r.hora_implantacao || '';
        document.getElementById('inEvDiaSemana').value = r.dia_semana_evangelho || '';
        document.getElementById('inEvHorarioFixo').value = r.horario_evangelho || '';
        document.getElementById('inEvStatus').value = r.status_implantacao || 'Em andamento';
        
        // Equipe select multiple
        const selEquipe = document.getElementById('inEvEquipe');
        Array.from(selEquipe.options).forEach(opt => {
            if (r.equipe_json && Array.isArray(r.equipe_json) && r.equipe_json.includes(opt.value)) {
                opt.selected = true;
            } else {
                opt.selected = false;
            }
        });
        
    } else {
        // Novo a partir da Caixa de Entrada
        document.getElementById('inEvId').value = '';
        document.getElementById('inEvPessoaId').value = pessoaId;
        document.getElementById('inEvSessaoId').value = sessaoId;
        document.getElementById('lblEvPessoa').innerHTML = `🏡 Implantação para:<br><span style="font-size: 20px;">${pessoaNome}</span>`;
        document.getElementById('inEvStatus').value = 'Em andamento';
    }
    
    document.getElementById('modalEvangelho').classList.add('show');
};

window.salvarEvangelho = async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('inEvId').value;
    
    // Obter selecionados
    const selEquipe = document.getElementById('inEvEquipe');
    const equipe = Array.from(selEquipe.selectedOptions).map(o => o.value);
    
    const payload = {
        pessoa_id: document.getElementById('inEvPessoaId').value,
        data_implantacao: document.getElementById('inEvData').value || null,
        hora_implantacao: document.getElementById('inEvHora').value || null,
        dia_semana_evangelho: document.getElementById('inEvDiaSemana').value,
        horario_evangelho: document.getElementById('inEvHorarioFixo').value || null,
        equipe_json: equipe,
        status_implantacao: document.getElementById('inEvStatus').value
    };
    
    const sessaoOrigem = document.getElementById('inEvSessaoId').value;
    if (sessaoOrigem) payload.sessao_origem_id = sessaoOrigem;
    
    try {
        if (id) {
            const { error } = await db.from('app_evangelho_lar').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await db.from('app_evangelho_lar').insert([payload]);
            if (error) throw error;
        }
        
        document.getElementById('modalEvangelho').classList.remove('show');
        
        // Descobrir qual aba atualizar
        if (payload.status_implantacao === 'Fila de Espera') mudarAbaEvangelho('caixa');
        else if (payload.status_implantacao === 'Implantado' || payload.status_implantacao === 'Não Implantado') mudarAbaEvangelho('concluidos');
        else mudarAbaEvangelho('andamento');
        
    } catch (err) {
        alert("Erro ao salvar: " + err.message);
    }
};

window.abrirAcompanhamentoEv = function(id) {
    document.getElementById('formEvAcompanhamento').reset();
    document.getElementById('inAcompEvId').value = id;
    
    // Sugerir a data de hoje
    document.getElementById('inAcompData').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('modalEvAcompanhamento').classList.add('show');
};

window.salvarEvAcompanhamento = async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('inAcompEvId').value;
    const r = window.evangelhoDataList.find(x => x.id === id);
    if (!r) return;
    
    const novoAcomp = {
        data: document.getElementById('inAcompData').value,
        confirmado: document.getElementById('inAcompConfirmado').checked,
        comentario: document.getElementById('inAcompObs').value
    };
    
    const acompList = r.acompanhamentos_json || [];
    acompList.push(novoAcomp);
    
    try {
        const { error } = await db.from('app_evangelho_lar').update({ acompanhamentos_json: acompList }).eq('id', id);
        if (error) throw error;
        
        document.getElementById('modalEvAcompanhamento').classList.remove('show');
        // Recarregar a mesma aba atual
        carregarConteudoEvangelho('andamento'); // Supondo que ele sempre faz isso na aba andamento
    } catch (err) {
        alert("Erro ao adicionar acompanhamento: " + err.message);
    }
};

"""
with open('hub.js', 'a', encoding='utf-8') as f:
    f.write(module_code)

print("Web version complete")
