// SELA Mobile - Evangelho no Lar

const urlParams = new URLSearchParams(window.location.search);
window.estruturaId = urlParams.get('id');

window.evangelhoDataList = [];
window.evangelhoPessoasDict = {};

function formatarCelularEv(v) {
    if (!v) return '';
    let d = v.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return v;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar Equipe (apenas pessoas com perfil Atendente Fraterno)
    try {
        const { data: pessoas } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis').eq('status', 'Ativo').order('nome_completo');
        if (pessoas) {
            const sel = document.getElementById('inEvEquipeAdd');
            window.evangelhoPessoasDict = {};
            
            const atendentes = pessoas.filter(p => {
                if (!p.perfis) return false;
                if (Array.isArray(p.perfis)) return p.perfis.includes('Atendente Fraterno');
                if (typeof p.perfis === 'string') return p.perfis.includes('Atendente Fraterno');
                return false;
            });
            
            atendentes.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.text = p.nome_completo;
                sel.appendChild(opt);
            });
            
            pessoas.forEach(p => {
                window.evangelhoPessoasDict[p.id] = p.nome_curto || p.nome_completo;
            });
        }
    } catch (e) { console.error(e); }

    document.getElementById('formEv').addEventListener('submit', salvarEvangelho);
    document.getElementById('formEvAcomp').addEventListener('submit', salvarEvAcompanhamento);

    mudarAba('cx', document.querySelector('.aba-btn[data-target="cx"]'));
});

window.mudarAba = function (alvo, btnClicked) {
    document.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.aba-content').forEach(c => c.classList.remove('active'));

    if (btnClicked) {
        btnClicked.classList.add('active');
    } else {
        document.querySelector(`.aba-btn[data-target="${alvo}"]`).classList.add('active');
    }

    document.getElementById(`aba-${alvo}`).classList.add('active');
    carregarDados(alvo);
};

window.carregarDados = async function (aba) {
    const listCx = document.getElementById('cxList');
    const listAnd = document.getElementById('andamentoList');
    const listConc = document.getElementById('concluidosList');

    if (aba === 'cx') listCx.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">Carregando...</div>';
    if (aba === 'andamento') listAnd.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">Carregando...</div>';
    if (aba === 'concluidos') listConc.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">Carregando...</div>';

    try {
        // Fetch from app_evangelho_lar
        const { data: registros, error: err1 } = await db.from('app_evangelho_lar').select(`
            *,
            pessoas!app_evangelho_lar_pessoa_id_fkey (id, nome_curto, nome_completo, celular, endereco, bairro, cidade, estado)
        `);
        if (err1) throw err1;

        if (aba === 'cx') {
            // Fetch Sessoes Atendimento Fraterno that have evangelho_lar = true
            const { data: sessoes, error: err2 } = await db.from('app_atendimento_sessoes').select(`
                id, data,
                app_atendimento_fraterno!inner (
                    paciente_id,
                    pessoas!app_atendimento_fraterno_paciente_id_fkey!inner (id, nome_curto, nome_completo, celular, endereco, bairro, cidade, estado)
                )
            `).eq('evangelho_lar', true);

            if (err2) throw err2;

            const idsProcessados = registros.filter(r => r.sessao_origem_id).map(r => r.sessao_origem_id);
            const fila = sessoes.filter(s => !idsProcessados.includes(s.id));
            const filaManuais = registros.filter(r => r.status_implantacao === 'Fila de Espera');

            if (fila.length === 0 && filaManuais.length === 0) {
                listCx.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">Nenhum pedido de implantação pendente.</div>';
            } else {
                let html = '';
                fila.forEach(s => {
                    const pac = s.app_atendimento_fraterno.pessoas;
                    const zap = pac.celular ? `<a href="https://wa.me/55${pac.celular.replace(/\D/g, '')}" target="_blank" style="font-size: 13px; color: #10b981; text-decoration: none;">📱 ${formatarCelularEv(pac.celular)}</a>` : '';
                    html += `
                        <div class="ev-card">
                            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px; color: var(--text-main);">${pac.nome_completo}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Pedido em: ${s.data.split('-').reverse().join('/')}</div>
                            ${zap}
                            <div style="margin-top: 16px;">
                                <button class="m-btn m-btn-primary" style="width: 100%; background: #10b981; border-color: #10b981;" onclick="abrirSheetEv(null, '${pac.id}', '${pac.nome_completo.replace(/'/g, "\\'")}', '${s.id}')">Iniciar Processo</button>
                            </div>
                        </div>
                    `;
                });
                
                filaManuais.forEach(r => {
                    const pac = r.pessoas;
                    const zap = pac.celular ? `<div style="margin-bottom: 8px;"><a href="https://wa.me/55${pac.celular.replace(/\D/g, '')}" target="_blank" style="font-size: 13px; color: #10b981; text-decoration: none;">📱 ${formatarCelularEv(pac.celular)}</a></div>` : '';
                    html += `
                        <div class="ev-card">
                            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px; color: var(--text-main);">${pac.nome_completo}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Aguardando designação de equipe</div>
                            ${zap}
                            <div style="margin-top: 16px;">
                                <button class="m-btn m-btn-primary" style="width: 100%; background: #10b981; border-color: #10b981;" onclick="abrirSheetEv('${r.id}')">Continuar</button>
                            </div>
                        </div>
                    `;
                });
                listCx.innerHTML = html;
            }
        } else {
            let filtrados = [];
            if (aba === 'andamento') {
                filtrados = registros.filter(r => r.status_implantacao === 'Em andamento' || r.status_implantacao === 'Precisando de Acompanhamento');
            } else {
                filtrados = registros.filter(r => r.status_implantacao === 'Implantado' || r.status_implantacao === 'Não Implantado');
            }

            if (filtrados.length === 0) {
                if (aba === 'andamento') listAnd.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">Nenhuma implantação em andamento.</div>';
                if (aba === 'concluidos') listConc.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">Nenhum histórico finalizado.</div>';
            } else {
                let html = '';
                window.evangelhoDataList = filtrados;

                filtrados.forEach(r => {
                    const pac = r.pessoas;
                    const zap = pac.celular ? `<a href="https://wa.me/55${pac.celular.replace(/\D/g, '')}" target="_blank" style="font-size: 13px; color: #10b981; text-decoration: none;">📱 ${formatarCelularEv(pac.celular)}</a>` : '';
                    
                    let equipeNomes = 'Não definida';
                    if (r.equipe_json && Array.isArray(r.equipe_json) && r.equipe_json.length > 0) {
                        equipeNomes = r.equipe_json.map(id => window.evangelhoPessoasDict[id] || '...').join(', ');
                    }

                    const horaImp = r.hora_implantacao ? r.hora_implantacao.substring(0,5) : '---';
                    const horaEv = r.horario_evangelho ? r.horario_evangelho.substring(0,5) : '---';
                    const dataImp = r.data_implantacao ? r.data_implantacao.split('-').reverse().join('/') : 'A definir';
                    let statusColor = '#3b82f6';
                    if (r.status_implantacao === 'Implantado') statusColor = '#10b981';
                    if (r.status_implantacao === 'Precisando de Acompanhamento') statusColor = '#f59e0b';
                    if (r.status_implantacao === 'Não Implantado') statusColor = '#ef4444';

                    const endCompleto = [pac.endereco, pac.bairro, pac.cidade ? `${pac.cidade} - ${pac.estado || ''}` : ''].filter(Boolean).join(', ') || 'Endereço não informado';

                    let acompHtml = '';
                    if (r.acompanhamentos_json && Array.isArray(r.acompanhamentos_json) && r.acompanhamentos_json.length > 0) {
                        acompHtml = '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 12px;">';
                        acompHtml += '<div style="font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Últimos Contatos:</div>';
                        
                        const hoje = new Date().toISOString().split('T')[0];
                        const comIndex = r.acompanhamentos_json.map((a, i) => ({ ...a, _origIndex: i }));
                        const ordenados = comIndex.sort((a, b) => b.data.localeCompare(a.data));
                        
                        ordenados.slice(0, 3).forEach(a => {
                            if (!a.data) return;
                            const isFuturo = a.data >= hoje;
                            const dtStr = a.data.split('-').reverse().join('/');
                            const obs = a.comentario || '';
                            const eqAcomp = (a.equipe && Array.isArray(a.equipe) && a.equipe.length > 0) 
                                ? a.equipe.map(id => window.evangelhoPessoasDict[id] || '...').join(', ') 
                                : '';
                            
                            if (isFuturo) {
                                acompHtml += `<div style="margin-bottom: 6px; padding: 6px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px; position: relative;">
                                    <button title="Editar" onclick="abrirSheetEvAcomp('${r.id}', ${a._origIndex})" style="position: absolute; right: 8px; top: 8px; background: transparent; border: none; font-size: 14px; cursor: pointer; color: #d97706;">✏️</button>
                                    <div style="color: #d97706; font-weight: 600; margin-bottom: 2px;">⏰ ${dtStr} - Compromisso Agendado</div>
                                    <div style="color: var(--text-main); margin-bottom: ${eqAcomp ? '2px' : '0'}; padding-right: 24px;">${obs}</div>
                                    ${eqAcomp ? `<div style="color: var(--text-muted); font-size: 11px;">👥 Responsável / Participantes: ${eqAcomp}</div>` : ''}
                                </div>`;
                            } else {
                                const icon = a.confirmado ? '✅' : '📝';
                                acompHtml += `<div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.05);">
                                    <div style="margin-bottom: 4px;"><span style="color:var(--text-muted)">${dtStr}</span> ${icon} ${obs}</div>
                                    ${eqAcomp ? `<div style="color: var(--text-muted); font-size: 11px;">👥 Participantes: ${eqAcomp}</div>` : ''}
                                </div>`;
                            }
                        });
                        acompHtml += '</div>';
                    }

                    html += `
                        <div class="ev-card">
                            <div class="ev-status-badge" style="background: ${statusColor}20; color: ${statusColor};">${r.status_implantacao}</div>
                            
                            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px; color: var(--text-main); padding-right: 80px;">${pac.nome_completo}</div>
                            ${zap}
                            <div style="margin-top: 8px;"></div>
                            
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📍 ${endCompleto}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📅 Implantação: ${dataImp} às ${horaImp}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">🔄 Rotina: ${r.dia_semana_evangelho || '?'} às ${horaEv}</div>
                            <div style="font-size: 13px; color: var(--text-muted);">👥 Equipe da Implantação: ${equipeNomes}</div>
                            
                            ${acompHtml}
                            
                            <div style="margin-top: 16px; display: flex; gap: 8px;">
                                <button class="m-btn m-btn-outline" style="flex: 1;" onclick="abrirSheetEv('${r.id}')">Editar</button>
                                <button class="m-btn" style="flex: 1; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" onclick="abrirSheetEvAcomp('${r.id}')">+ Contato</button>
                            </div>
                        </div>
                    `;
                });

                if (aba === 'andamento') listAnd.innerHTML = html;
                if (aba === 'concluidos') listConc.innerHTML = html;
            }
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados');
    }
};

window.evangelhoEquipeAtual = [];

window.addEvangelhoEquipe = function() {
    const sel = document.getElementById('inEvEquipeAdd');
    const id = sel.value;
    if (!id) return;
    
    if (!window.evangelhoEquipeAtual.includes(id)) {
        window.evangelhoEquipeAtual.push(id);
        renderEvangelhoEquipe();
    }
    sel.value = '';
};

window.removeEvangelhoEquipe = function(id) {
    window.evangelhoEquipeAtual = window.evangelhoEquipeAtual.filter(x => x !== id);
    renderEvangelhoEquipe();
};

window.renderEvangelhoEquipe = function() {
    const container = document.getElementById('evEquipeLista');
    if (window.evangelhoEquipeAtual.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; text-align: center;">Ninguém na equipe ainda.</div>';
        return;
    }
    
    let html = '';
    window.evangelhoEquipeAtual.forEach(id => {
        const nome = window.evangelhoPessoasDict[id] || 'Desconhecido';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-panel); border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; margin-bottom: 4px;">
                <span style="font-size: 13px; color: var(--text-main); font-weight: 500;">${nome}</span>
                <button type="button" onclick="removeEvangelhoEquipe('${id}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 16px; line-height: 1;">&times;</button>
            </div>
        `;
    });
    container.innerHTML = html;
};

window.abrirSheetEv = function (id, pessoaId = '', pessoaNome = '', sessaoId = '') {
    const form = document.getElementById('formEv');
    form.reset();
    window.evangelhoEquipeAtual = [];

    if (id) {
        // Edit mode
        const r = window.evangelhoDataList.find(x => x.id === id);
        if (!r) return;

        document.getElementById('inEvId').value = r.id;
        document.getElementById('inEvPessoaId').value = r.pessoa_id;
        document.getElementById('inEvSessaoId').value = r.sessao_origem_id || '';
        document.getElementById('lblEvPessoa').innerHTML = `🙏 Evangelho de<br><span style="font-size: 18px;">${r.pessoas.nome_completo}</span>`;

        document.getElementById('inEvData').value = r.data_implantacao || '';
        document.getElementById('inEvHora').value = r.hora_implantacao || '';
        document.getElementById('inEvDiaSemana').value = r.dia_semana_evangelho || '';
        document.getElementById('inEvHorarioFixo').value = r.horario_evangelho || '';
        document.getElementById('inEvStatus').value = r.status_implantacao || 'Em andamento';

        if (r.equipe_json && Array.isArray(r.equipe_json)) {
            window.evangelhoEquipeAtual = [...r.equipe_json];
        }
    } else {
        // New mode
        document.getElementById('inEvId').value = '';
        document.getElementById('inEvPessoaId').value = pessoaId;
        document.getElementById('inEvSessaoId').value = sessaoId;
        document.getElementById('lblEvPessoa').innerHTML = `🙏 Implantação para<br><span style="font-size: 18px;">${pessoaNome}</span>`;
        document.getElementById('inEvStatus').value = 'Em andamento';
    }

    renderEvangelhoEquipe();
    document.getElementById('sheetEv').classList.add('show');
};

window.fecharSheetEv = function () {
    document.getElementById('sheetEv').classList.remove('show');
};

window.salvarEvangelho = async function (e) {
    e.preventDefault();

    const id = document.getElementById('inEvId').value;
    const equipe = window.evangelhoEquipeAtual || [];

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

        fecharSheetEv();
        
        if (payload.status_implantacao === 'Fila de Espera') mudarAba('cx');
        else if (payload.status_implantacao === 'Implantado' || payload.status_implantacao === 'Não Implantado') mudarAba('concluidos');
        else mudarAba('andamento');

    } catch (err) {
        alert("Erro ao salvar: " + err.message);
    }
};

window.acompEquipeAtual = [];

window.addAcompEquipe = function() {
    const sel = document.getElementById('inAcompEquipeAdd');
    const id = sel.value;
    if (!id) return;
    
    if (!window.acompEquipeAtual.includes(id)) {
        window.acompEquipeAtual.push(id);
        renderAcompEquipe();
    }
    sel.value = '';
};

window.removeAcompEquipe = function(id) {
    window.acompEquipeAtual = window.acompEquipeAtual.filter(x => x !== id);
    renderAcompEquipe();
};

window.renderAcompEquipe = function() {
    const container = document.getElementById('acompEquipeLista');
    if (window.acompEquipeAtual.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; text-align: center;">Equipe não selecionada.</div>';
        return;
    }
    
    let html = '';
    window.acompEquipeAtual.forEach(id => {
        const nome = window.evangelhoPessoasDict[id] || 'Desconhecido';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 6px; margin-bottom: 2px;">
                <span style="font-size: 13px; color: var(--text-main); font-weight: 500;">${nome}</span>
                <button type="button" onclick="removeAcompEquipe('${id}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 16px; line-height: 1;">&times;</button>
            </div>
        `;
    });
    container.innerHTML = html;
};

window.abrirSheetEvAcomp = function (id, index = -1) {
    document.getElementById('formEvAcomp').reset();
    document.getElementById('inAcompEvId').value = id;
    document.getElementById('inAcompEvIndex').value = index;
    
    const r = window.evangelhoDataList.find(x => x.id === id);
    window.acompEquipeAtual = [];
    
    if (index >= 0 && r && r.acompanhamentos_json) {
        const acomp = r.acompanhamentos_json[index];
        if (acomp) {
            document.getElementById('inAcompData').value = acomp.data;
            document.getElementById('inAcompConfirmado').checked = acomp.confirmado;
            document.getElementById('inAcompObs').value = acomp.comentario || acomp.observacao || '';
            if (acomp.equipe && Array.isArray(acomp.equipe)) {
                window.acompEquipeAtual = [...acomp.equipe];
            }
        }
    } else {
        document.getElementById('inAcompData').value = new Date().toISOString().split('T')[0];
    }
    
    renderAcompEquipe();
    document.getElementById('sheetEvAcomp').classList.add('show');
};

window.fecharSheetEvAcomp = function () {
    document.getElementById('sheetEvAcomp').classList.remove('show');
};

window.salvarEvAcompanhamento = async function (e) {
    e.preventDefault();

    const id = document.getElementById('inAcompEvId').value;
    const index = parseInt(document.getElementById('inAcompEvIndex').value);
    const r = window.evangelhoDataList.find(x => x.id === id);
    if (!r) return;

    const dt = document.getElementById('inAcompData').value;
    const novoAcomp = {
        data: dt,
        confirmado: document.getElementById('inAcompConfirmado').checked,
        comentario: document.getElementById('inAcompObs').value,
        equipe: window.acompEquipeAtual || []
    };

    const acompList = r.acompanhamentos_json || [];
    let isNovo = true;
    
    if (index >= 0 && index < acompList.length) {
        acompList[index] = novoAcomp;
        isNovo = false;
    } else {
        acompList.push(novoAcomp);
    }

    try {
        const { error } = await db.from('app_evangelho_lar').update({ acompanhamentos_json: acompList }).eq('id', id);
        if (error) throw error;
        
        const hoje = new Date().toISOString().split('T')[0];
        if (isNovo && dt >= hoje && novoAcomp.equipe.length > 0) {
            const pessoaNome = r.pessoas ? r.pessoas.nome_completo : 'Paciente';
            const notifs = novoAcomp.equipe.map(pessoa_id => ({
                pessoa_id: pessoa_id,
                titulo: 'Agendamento: Evangelho no Lar',
                mensagem: `Você foi escalado para um Acompanhamento Presencial em ${dt.split('-').reverse().join('/')} na casa de ${pessoaNome}.`
            }));
            db.from('app_notificacoes').insert(notifs).then(() => {}).catch(() => {});
        }

        fecharSheetEvAcomp();
        
        const currentTabBtn = document.querySelector('.m-tab.active');
        if (currentTabBtn) {
            carregarDados(currentTabBtn.getAttribute('data-target') || 'andamento');
        } else {
            carregarDados('andamento');
        }
    } catch (err) {
        alert("Erro ao adicionar acompanhamento: " + err.message);
    }
};
