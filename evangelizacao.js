// ==========================================
// MÓDULO WEB: EVANGELIZAÇÃO INFANTIL E JUVENIL
// ==========================================

window.carregarModuloEvangelizacao = async function() {
    const container = document.getElementById('containerApps');
    container.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
            <!-- Menu Lateral do Mini App -->
            <div style="width: 250px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; flex-shrink: 0;">
                <div style="padding: 16px; border-bottom: 1px solid var(--border); background: rgba(16, 185, 129, 0.05);">
                    <h2 style="font-size: 16px; color: #10b981; margin: 0;">🌱 Evangelização</h2>
                    <p style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Gestão de Turmas e Aulas</p>
                </div>
                <div style="padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <button onclick="mudarAbaEvang('inicio')" id="btnAbaEvangInicio" class="btn" style="text-align: left; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border); justify-content: flex-start;">🏠 Início</button>
                    <button onclick="mudarAbaEvang('turmas')" id="btnAbaEvangTurmas" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">🏫 Turmas e Matrículas</button>
                    <button onclick="mudarAbaEvang('aulas')" id="btnAbaEvangAulas" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">📅 Planejamento Anual</button>
                    <button onclick="mudarAbaEvang('diario')" id="btnAbaEvangDiario" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">📝 Diário de Classe</button>
                    <button onclick="mudarAbaEvang('boletim')" id="btnAbaEvangBoletim" class="btn" style="text-align: left; background: transparent; color: var(--text-muted); border: 1px solid transparent; justify-content: flex-start;">📊 Boletim Final</button>
                </div>
            </div>

            <!-- Conteúdo -->
            <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
                <div id="evangContent">
                    <div style="color: var(--text-muted); font-size: 14px;">Selecione uma opção no menu ao lado...</div>
                </div>
            </div>
        </div>
    `;
    
    // Inicia na aba Inicio
    mudarAbaEvang('inicio');
};

window.mudarAbaEvang = function(aba) {
    const ids = ['Inicio', 'Turmas', 'Aulas', 'Diario', 'Boletim'];
    ids.forEach(id => {
        const btn = document.getElementById('btnAbaEvang' + id);
        if (btn) {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid transparent';
        }
    });

    const btnAtivo = document.getElementById('btnAbaEvang' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (btnAtivo) {
        btnAtivo.style.background = 'var(--bg-panel)';
        btnAtivo.style.color = 'var(--text-main)';
        btnAtivo.style.border = '1px solid var(--border)';
    }

    const content = document.getElementById('evangContent');
    content.innerHTML = '<div style="color:var(--text-muted);">Carregando...</div>';

    if (aba === 'inicio') {
        carregarEvangInicio();
    } else if (aba === 'turmas') {
        carregarEvangTurmas();
    } else if (aba === 'aulas') {
        carregarEvangAulas();
    } else if (aba === 'diario') {
        carregarEvangDiario();
    } else if (aba === 'boletim') {
        content.innerHTML = '<h3 style="color:#10b981;">Boletim de Avaliação</h3><p style="color:var(--text-muted);">Módulo em desenvolvimento...</p>';
    }
};

window.carregarEvangInicio = function() {
    const content = document.getElementById('evangContent');
    content.innerHTML = `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 48px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
            <h3 style="color: #10b981; margin: 0 0 8px 0; font-size: 24px;">Evangelização Infantil e Juvenil</h3>
            <p style="color: var(--text-muted); font-size: 15px; max-width: 450px; margin: 0 auto 32px auto; line-height: 1.5;">
                Bem-vindo ao módulo de gestão da Evangelização. Aqui você pode gerenciar turmas, matricular evangelizandos, planejar aulas e registrar o diário de classe.
            </p>
            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #10b981; color: white; border: none; padding: 12px 24px; font-weight: 500; font-size: 15px;" onclick="mudarAbaEvang('turmas')">Gerenciar Turmas e Matrículas</button>
                <button class="btn" style="background: transparent; color: var(--text-main); border: 1px solid var(--border); padding: 12px 24px; font-weight: 500; font-size: 15px;" onclick="mudarAbaEvang('aulas')">Planejamento de Aulas</button>
            </div>
        </div>
    `;
};

// ==========================================
// GESTÃO DE TURMAS
// ==========================================
window.carregarEvangTurmas = async function() {
    const content = document.getElementById('evangContent');
    try {
        const { data: turmas, error } = await db.from('app_evang_turmas').select('*').order('nome');
        if (error) throw error;

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="color: #10b981; margin: 0;">Turmas de Evangelização</h3>
                <button class="btn btn-primary" onclick="novaTurmaEvang()">+ Nova Turma</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
        `;
        
        if (!turmas || turmas.length === 0) {
            html += `<div style="color: var(--text-muted); font-size: 14px;">Nenhuma turma cadastrada.</div>`;
        } else {
            turmas.forEach(t => {
                html += `
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 16px;">${t.nome}</h4>
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📅 Ano: ${t.ano_letivo}</div>
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">⏰ ${t.dia_semana}, ${t.horario.substring(0,5)}</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn" style="flex: 1; font-size: 12px;" onclick="gerenciarMatriculas('${t.id}', '${t.nome}')">Gerenciar Matrículas</button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        content.innerHTML = html;

    } catch (e) {
        content.innerHTML = `<div style="color:#ef4444;">Erro ao carregar turmas: ${e.message}</div>`;
    }
};

window.novaTurmaEvang = async function() {
    const { value: formValues } = await Swal.fire({
        title: 'Nova Turma',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nome da Turma (Ex: Ciclo I)">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Ano (Ex: 2026)" type="number" value="2026">' +
            '<input id="swal-input3" class="swal2-input" placeholder="Dia (Ex: Terça-feira)" value="Terça-feira">' +
            '<input id="swal-input4" class="swal2-input" placeholder="Horário (Ex: 19:30)" type="time" value="19:30">',
        focusConfirm: false,
        preConfirm: () => {
            return {
                nome: document.getElementById('swal-input1').value,
                ano: document.getElementById('swal-input2').value,
                dia: document.getElementById('swal-input3').value,
                hora: document.getElementById('swal-input4').value
            }
        }
    });

    if (formValues) {
        if(!formValues.nome) return alert('Nome da turma é obrigatório.');
        
        try {
            const { error } = await db.from('app_evang_turmas').insert([{
                nome: formValues.nome,
                ano_letivo: parseInt(formValues.ano) || new Date().getFullYear(),
                dia_semana: formValues.dia,
                horario: formValues.hora
            }]);
            
            if (error) throw error;
            carregarEvangTurmas();
        } catch(e) {
            alert('Erro ao salvar: ' + e.message);
        }
    }
};

window.gerenciarMatriculas = async function(turmaId, turmaNome) {
    const content = document.getElementById('evangContent');
    content.innerHTML = '<div style="color:var(--text-muted);">Carregando dados...</div>';
    
    try {
        // Carregar matrículas da turma
        const { data: matriculas, error } = await db.from('app_evang_matriculas')
            .select('*, pessoas(nome_completo, celular)')
            .eq('turma_id', turmaId);
            
        if (error) throw error;
        
        // Pessoas cadastradas que tem perfil de Evangelizando ou Evangelizador
        const { data: todasPessoas, error: errP } = await db.from('pessoas')
            .select('id, nome_completo, perfis')
            .order('nome_completo');
            
        if (errP) throw errP;
        
        const evangelizandos = todasPessoas.filter(p => p.perfis && (p.perfis.includes('Evangelizando') || p.perfis.includes('Evangelizanda')));
        const evangelizadores = todasPessoas.filter(p => p.perfis && (p.perfis.includes('Evangelizador') || p.perfis.includes('Evangelizadora')));
        
        const matriculadosIds = matriculas.map(m => m.pessoa_id);
        const dispoEvangelizandos = evangelizandos.filter(p => !matriculadosIds.includes(p.id));
        const dispoEvangelizadores = evangelizadores.filter(p => !matriculadosIds.includes(p.id));
        
        let html = `
            <div style="margin-bottom: 24px;">
                <button class="btn" onclick="carregarEvangTurmas()" style="margin-bottom: 16px; font-size: 12px;">← Voltar</button>
                <h3 style="color: #10b981; margin: 0;">Matrículas: ${turmaNome}</h3>
            </div>
            
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <!-- Lista de Matrículados -->
                <div style="flex: 1; min-width: 300px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                    <h4 style="margin: 0 0 16px 0; color: var(--text-main);">Pessoas na Turma</h4>
        `;
        
        if (matriculas.length === 0) {
            html += `<div style="color: var(--text-muted); font-size: 13px;">Nenhuma pessoa matriculada.</div>`;
        } else {
            // Sort: Evangelizadores first
            matriculas.sort((a,b) => {
                if (a.papel === 'Evangelizador' && b.papel !== 'Evangelizador') return -1;
                if (a.papel !== 'Evangelizador' && b.papel === 'Evangelizador') return 1;
                return (a.pessoas?.nome_completo || '').localeCompare(b.pessoas?.nome_completo || '');
            });
            
            matriculas.forEach(m => {
                const isProf = m.papel === 'Evangelizador';
                const badgeStyle = isProf ? 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981;' : 'background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6;';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 14px; color: var(--text-main); font-weight: 500;">${m.pessoas?.nome_completo || 'Desconhecido'}</div>
                            <span style="font-size: 10px; padding: 2px 6px; border-radius: 12px; ${badgeStyle}">${m.papel}</span>
                        </div>
                        <button onclick="removerMatriculaEvang('${m.id}', '${turmaId}', '${turmaNome}')" style="background: none; border: none; color: #ef4444; cursor: pointer;" title="Remover da Turma">✕</button>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                
                <!-- Adicionar Matrícula -->
                <div style="flex: 1; min-width: 300px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                    <h4 style="margin: 0 0 16px 0; color: var(--text-main);">Vincular Pessoa</h4>
                    
                    <div style="flex: 1; margin-bottom: 16px;">
                        <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Vincular Evangelizador</label>
                        <div style="display: flex; gap: 8px;">
                            <select id="selEvangelizador" class="input" style="flex: 1;">
                                <option value="">-- Selecione a pessoa --</option>
                                ${dispoEvangelizadores.map(p => `<option value="${p.id}">${p.nome_completo}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" onclick="addMatriculaEvang('${turmaId}', '${turmaNome}', 'selEvangelizador', 'Evangelizador')">Vincular</button>
                        </div>
                    </div>
                    
                    <div style="flex: 1;">
                        <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Vincular Evangelizando</label>
                        <div style="display: flex; gap: 8px;">
                            <select id="selEvangelizando" class="input" style="flex: 1;">
                                <option value="">-- Selecione a pessoa --</option>
                                ${dispoEvangelizandos.map(p => `<option value="${p.id}">${p.nome_completo}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" onclick="addMatriculaEvang('${turmaId}', '${turmaNome}', 'selEvangelizando', 'Evangelizando')">Vincular</button>
                        </div>
                    </div>
                    
                    <p style="font-size: 11px; color: var(--text-muted); margin-top: 16px;">A lista acima exibe apenas pessoas que possuam o Perfil de 'Evangelizando' ou 'Evangelizador' no seu cadastro global. Se alguém não aparece aqui, verifique o perfil na tela de Gestão de Pessoas.</p>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
    } catch(e) {
        content.innerHTML = `<div style="color:#ef4444;">Erro ao carregar matrículas: ${e.message}</div>`;
    }
};

window.addMatriculaEvang = async function(turmaId, turmaNome, selectId, papel) {
    const pessoaId = document.getElementById(selectId).value;
    if (!pessoaId) return alert('Selecione uma pessoa.');
    
    try {
        const { error } = await db.from('app_evang_matriculas').insert([{
            turma_id: turmaId,
            pessoa_id: pessoaId,
            papel: papel
        }]);
        if (error) throw error;
        gerenciarMatriculas(turmaId, turmaNome);
    } catch(e) {
        alert("Erro ao matricular: " + e.message);
    }
};

window.removerMatriculaEvang = async function(matriculaId, turmaId, turmaNome) {
    if (!confirm('Deseja realmente remover esta pessoa da turma? O histórico de faltas também será apagado.')) return;
    try {
        const { error } = await db.from('app_evang_matriculas').delete().eq('id', matriculaId);
        if (error) throw error;
        gerenciarMatriculas(turmaId, turmaNome);
    } catch(e) {
        alert("Erro ao remover: " + e.message);
    }
};

// ==========================================
// PLANEJAMENTO DE AULAS
// ==========================================

window.carregarEvangAulas = async function() {
    const content = document.getElementById('evangContent');
    content.innerHTML = '<div style="color:var(--text-muted);">Carregando dados...</div>';
    
    try {
        const { data: turmas, error } = await db.from('app_evang_turmas').select('*').order('nome');
        if (error) throw error;
        
        if (!turmas || turmas.length === 0) {
            content.innerHTML = '<div style="color:var(--text-muted);">Crie uma turma primeiro.</div>';
            return;
        }
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
                    <div>
                        <h3 style="color: #10b981; margin: 0 0 8px 0;">Planejamento Anual de Aulas</h3>
                        <select id="selEvangTurmaAulas" class="input" style="min-width: 200px;" onchange="listarAulasTurma()">
                            <option value="">-- Selecione a Turma --</option>
                            ${turmas.map(t => `<option value="${t.id}">${t.nome} (${t.ano_letivo}) - ${t.dia_semana || 'Sem Dia'}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn" style="background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border);" onclick="gerarLoteEvangAulas()">Gerar Lote de Aulas</button>
                    <button class="btn btn-primary" onclick="novaEvangAula()">+ Nova Aula</button>
                </div>
            <div id="listaEvangAulas" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                <div style="color: var(--text-muted); font-size: 14px;">Selecione uma turma acima para ver o planejamento.</div>
            </div>
        `;
        content.innerHTML = html;
        
    } catch(e) {
        content.innerHTML = `<div style="color:#ef4444;">Erro: ${e.message}</div>`;
    }
};

window.listarAulasTurma = async function() {
    const turmaId = document.getElementById('selEvangTurmaAulas').value;
    const div = document.getElementById('listaEvangAulas');
    
    if (!turmaId) {
        div.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Selecione uma turma acima para ver o planejamento.</div>';
        return;
    }
    
    div.innerHTML = '<div style="color:var(--text-muted);">Buscando aulas...</div>';
    
    try {
        const { data: aulas, error } = await db.from('app_evang_aulas')
            .select('*')
            .eq('turma_id', turmaId)
            .order('data_aula');
            
        if (error) throw error;
        
        if (!aulas || aulas.length === 0) {
            div.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Nenhuma aula cadastrada para esta turma.</div>';
            return;
        }
        
        let html = `
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted);">Data</th>
                        <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted);">Status</th>
                        <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted);">Tema Planejado</th>
                        <th style="text-align: right; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted);">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        aulas.forEach(a => {
            const dataParts = a.data_aula.split('-');
            const dataBR = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
            
            let badge = '';
            if (a.status === 'Realizada') badge = '<span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Realizada</span>';
            else if (a.status === 'Cancelada') badge = '<span style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Cancelada</span>';
            else badge = '<span style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Planejada</span>';
            
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px; color: var(--text-main); font-weight: 500;">${dataBR}</td>
                    <td style="padding: 12px;">${badge}</td>
                    <td style="padding: 12px; color: var(--text-muted);">${a.tema || '<i>Sem tema definido</i>'}</td>
                    <td style="padding: 12px; text-align: right; white-space: nowrap;">
                        <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; border: 1px solid var(--border); background: transparent;" onclick="editarEvangAula('${a.id}', '${a.data_aula}', '${(a.tema||'').replace(/'/g, "\\'")}')">Editar</button>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="excluirEvangAula('${a.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        div.innerHTML = html;
        
    } catch(e) {
        div.innerHTML = `<div style="color:#ef4444;">Erro ao carregar aulas: ${e.message}</div>`;
    }
};

window.novaEvangAula = async function() {
    const turmaSelect = document.getElementById('selEvangTurmaAulas');
    if (!turmaSelect) return alert("Vá para a aba Aulas primeiro.");
    const turmaId = turmaSelect.value;
    
    if (!turmaId) return alert("Selecione uma turma primeiro para adicionar uma aula nela.");
    
    const { value: formValues } = await Swal.fire({
        title: 'Nova Aula',
        html:
            '<label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Data da Aula</label>' +
            '<input id="swal-aula-data" class="swal2-input" type="date" style="margin-top:0;">' +
            '<label style="display:block; text-align:left; margin-top:16px; margin-bottom:4px; font-size:12px;">Tema Planejado (Opcional)</label>' +
            '<input id="swal-aula-tema" class="swal2-input" placeholder="Ex: Parábola do Semeador" style="margin-top:0;">',
        focusConfirm: false,
        preConfirm: () => {
            return {
                data: document.getElementById('swal-aula-data').value,
                tema: document.getElementById('swal-aula-tema').value
            }
        }
    });

    if (formValues) {
        if(!formValues.data) return alert('A data é obrigatória.');
        
        try {
            // Verificar se ja existe
            const { data: ext } = await db.from('app_evang_aulas').select('id').eq('turma_id', turmaId).eq('data_aula', formValues.data);
            if (ext && ext.length > 0) return alert('Já existe uma aula planejada para esta data nesta turma.');
            
            const { error } = await db.from('app_evang_aulas').insert([{
                turma_id: turmaId,
                data_aula: formValues.data,
                tema: formValues.tema || 'Tema a definir'
            }]);
            
            if (error) throw error;
            listarAulasTurma();
            Swal.fire('Sucesso!', 'Aula adicionada com sucesso.', 'success');
        } catch(e) {
            alert('Erro ao adicionar aula: ' + e.message);
        }
    }
};

window.editarEvangAula = async function(id, data_atual, tema_atual) {
    const { value: formValues } = await Swal.fire({
        title: 'Editar Aula',
        html:
            '<label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Data da Aula</label>' +
            `<input id="swal-aula-data" class="swal2-input" type="date" value="${data_atual}" style="margin-top:0;">` +
            '<label style="display:block; text-align:left; margin-top:16px; margin-bottom:4px; font-size:12px;">Tema Planejado</label>' +
            `<input id="swal-aula-tema" class="swal2-input" value="${tema_atual === 'Tema a definir' ? '' : tema_atual}" placeholder="Ex: Parábola do Semeador" style="margin-top:0;">`,
        focusConfirm: false,
        preConfirm: () => {
            return {
                data: document.getElementById('swal-aula-data').value,
                tema: document.getElementById('swal-aula-tema').value
            }
        }
    });

    if (formValues) {
        if(!formValues.data) return alert('A data é obrigatória.');
        
        try {
            const { error } = await db.from('app_evang_aulas').update({
                data_aula: formValues.data,
                tema: formValues.tema || 'Tema a definir'
            }).eq('id', id);
            
            if (error) throw error;
            listarAulasTurma();
        } catch(e) {
            alert('Erro ao editar aula: ' + e.message);
        }
    }
};

window.gerarLoteEvangAulas = async function() {
    const turmaSelect = document.getElementById('selEvangTurmaAulas');
    if (!turmaSelect) return alert("Vá para a aba Aulas primeiro.");
    const turmaId = turmaSelect.value;
    
    if (!turmaId) return alert("Selecione uma turma primeiro para gerar o lote de aulas.");
    
    // Obter informacoes da turma para saber o dia da semana
    const { data: turmaData } = await db.from('app_evang_turmas').select('dia_semana, ano_letivo').eq('id', turmaId).single();
    
    let diaSugerido = turmaData?.dia_semana || 'Terça-feira';
    
    const { value: formValues } = await Swal.fire({
        title: 'Gerar Lote de Aulas',
        width: 500,
        html:
            '<div style="text-align: left; font-size: 14px; margin-bottom: 16px; color: var(--text-muted);">As aulas serão geradas para o dia da semana especificado, dentro do período. Aulas já existentes nas mesmas datas serão puladas.</div>' +
            '<label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Dia da Semana</label>' +
            `<select id="swal-lote-dia" class="swal2-input" style="margin-top:0; width: 100%;">
                <option value="0" ${diaSugerido === 'Domingo' ? 'selected' : ''}>Domingo</option>
                <option value="1" ${diaSugerido === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                <option value="2" ${diaSugerido === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                <option value="3" ${diaSugerido === 'Quarta-feira' ? 'selected' : ''}>Quarta-feira</option>
                <option value="4" ${diaSugerido === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                <option value="5" ${diaSugerido === 'Sexta-feira' ? 'selected' : ''}>Sexta-feira</option>
                <option value="6" ${diaSugerido === 'Sábado' ? 'selected' : ''}>Sábado</option>
            </select>` +
            '<div style="display: flex; gap: 16px; margin-top: 16px;">' +
            '<div style="flex:1;"><label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Data Inicial</label>' +
            `<input id="swal-lote-inicio" class="swal2-input" type="date" style="margin-top:0; width:100%;"></div>` +
            '<div style="flex:1;"><label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Data Final</label>' +
            `<input id="swal-lote-fim" class="swal2-input" type="date" style="margin-top:0; width:100%;"></div>` +
            '</div>',
        focusConfirm: false,
        preConfirm: () => {
            return {
                dia: parseInt(document.getElementById('swal-lote-dia').value),
                inicio: document.getElementById('swal-lote-inicio').value,
                fim: document.getElementById('swal-lote-fim').value
            }
        }
    });

    if (formValues) {
        if (!formValues.inicio || !formValues.fim) return alert('Informe as datas inicial e final.');
        
        let dStart = new Date(formValues.inicio + "T12:00:00");
        let dEnd = new Date(formValues.fim + "T12:00:00");
        
        if (dStart > dEnd) return alert("Data inicial não pode ser maior que a final.");
        
        // Encontrar os dias
        let diasASalvar = [];
        let curr = new Date(dStart.getTime());
        while(curr <= dEnd) {
            if (curr.getDay() === formValues.dia) {
                const yyyy = curr.getFullYear();
                const mm = String(curr.getMonth() + 1).padStart(2, '0');
                const dd = String(curr.getDate()).padStart(2, '0');
                diasASalvar.push(`${yyyy}-${mm}-${dd}`);
            }
            curr.setDate(curr.getDate() + 1);
        }
        
        if (diasASalvar.length === 0) return alert('Nenhum dia correspondente encontrado no período informado.');
        
        Swal.fire({ title: 'Gerando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
        
        try {
            // Pegar as já existentes pra não duplicar
            const { data: ext } = await db.from('app_evang_aulas').select('data_aula').eq('turma_id', turmaId).in('data_aula', diasASalvar);
            const jaExistentes = (ext || []).map(a => a.data_aula);
            
            const novasAulas = [];
            for (let diaStr of diasASalvar) {
                if (!jaExistentes.includes(diaStr)) {
                    novasAulas.push({
                        turma_id: turmaId,
                        data_aula: diaStr,
                        tema: 'Tema a definir',
                        status: 'Planejada'
                    });
                }
            }
            
            if (novasAulas.length === 0) {
                Swal.fire('Aviso', 'Todas as datas desse período já estavam cadastradas!', 'info');
                return;
            }
            
            const { error: errIns } = await db.from('app_evang_aulas').insert(novasAulas);
            if (errIns) throw errIns;
            
            Swal.fire('Sucesso!', `${novasAulas.length} novas aulas foram criadas!`, 'success');
            listarAulasTurma();
        } catch(e) {
            Swal.fire('Erro', 'Ocorreu um erro ao gerar: ' + e.message, 'error');
        }
    }
};

window.excluirEvangAula = async function(aulaId) {
    if (!confirm('Excluir esta aula do calendário? O diário de classe também será apagado.')) return;
    try {
        const { error } = await db.from('app_evang_aulas').delete().eq('id', aulaId);
        if (error) throw error;
        listarAulasTurma();
    } catch(e) {
        alert("Erro ao excluir: " + e.message);
    }
};

window.registrarOcorrenciaEvang = async function(pessoaId, nomePessoa) {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const { value: formValues } = await Swal.fire({
        title: 'Registrar Ocorrência',
        width: 500,
        html:
            `<div style="text-align: left; font-size: 14px; margin-bottom: 16px; color: var(--text-muted);">Esta ocorrência será enviada diretamente para o prontuário do aluno na <strong>Assistência Social / DIJ</strong>.</div>` +
            `<div style="margin-bottom: 16px; text-align: left;"><strong style="color:var(--text-main);">${nomePessoa}</strong></div>` +
            '<label style="display:block; text-align:left; margin-bottom:4px; font-size:12px;">Data</label>' +
            `<input id="swal-oco-data" class="swal2-input" type="date" value="${dataAtual}" style="margin-top:0; width: 100%;">` +
            '<label style="display:block; text-align:left; margin-top:16px; margin-bottom:4px; font-size:12px;">Descreva o Ocorrido</label>' +
            `<textarea id="swal-oco-obs" class="swal2-textarea" placeholder="Ex: Criança relatou fome, agressividade incomum, etc." style="margin-top:0; width: 100%; min-height: 100px;"></textarea>`,
        focusConfirm: false,
        preConfirm: () => {
            return {
                data: document.getElementById('swal-oco-data').value,
                obs: document.getElementById('swal-oco-obs').value
            }
        }
    });

    if (formValues) {
        if (!formValues.data || !formValues.obs) return alert('A data e a observação são obrigatórias.');
        
        Swal.fire({ title: 'Salvando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
        
        try {
            const { error } = await db.from('ass_ocorrencias').insert([{
                pessoa_id: pessoaId,
                data_ocorrencia: formValues.data,
                codigo: 'RO-DIJ',
                tipo: 'Evangelização / DIJ',
                observacao: formValues.obs
            }]);
            
            if (error) throw error;
            
            Swal.fire('Sucesso!', 'Ocorrência registrada com sucesso.', 'success');
        } catch(e) {
            Swal.fire('Erro', 'Ocorreu um erro ao salvar: ' + e.message, 'error');
        }
    }
};

// ==========================================
// DIÁRIO DE CLASSE (FREQUÊNCIA)
// ==========================================

window.carregarEvangDiario = async function() {
    const content = document.getElementById('evangContent');
    content.innerHTML = '<div style="color:var(--text-muted);">Carregando turmas...</div>';
    
    try {
        const { data: turmas, error } = await db.from('app_evang_turmas').select('*').order('nome');
        if (error) throw error;
        
        let html = `
            <div style="margin-bottom: 24px;">
                <h3 style="color: #10b981; margin: 0 0 16px 0;">Diário de Classe - Frequência</h3>
                <div style="display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Turma</label>
                        <select id="selDiarioTurma" class="input" style="width: 100%;" onchange="carregarDatasAulasDiario()">
                            <option value="">-- Selecione --</option>
                            ${turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Data da Aula</label>
                        <select id="selDiarioAula" class="input" style="width: 100%;" onchange="carregarListaChamada()" disabled>
                            <option value="">Selecione a Turma primeiro</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="listaChamadaContainer" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; min-height: 200px;">
                <div style="color: var(--text-muted); font-size: 14px; text-align: center; margin-top: 20px;">
                    Selecione a turma e a data da aula acima para realizar a chamada.
                </div>
            </div>
        `;
        content.innerHTML = html;
        
    } catch(e) {
        content.innerHTML = `<div style="color:#ef4444;">Erro: ${e.message}</div>`;
    }
};

window.carregarDatasAulasDiario = async function() {
    const turmaId = document.getElementById('selDiarioTurma').value;
    const selAula = document.getElementById('selDiarioAula');
    const container = document.getElementById('listaChamadaContainer');
    
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; margin-top: 20px;">Selecione a turma e a data da aula acima para realizar a chamada.</div>';
    
    if (!turmaId) {
        selAula.innerHTML = '<option value="">Selecione a Turma primeiro</option>';
        selAula.disabled = true;
        return;
    }
    
    selAula.innerHTML = '<option value="">Carregando...</option>';
    selAula.disabled = true;
    
    try {
        const { data: aulas, error } = await db.from('app_evang_aulas')
            .select('id, data_aula, tema, status')
            .eq('turma_id', turmaId)
            .order('data_aula', { ascending: false });
            
        if (error) throw error;
        
        if (!aulas || aulas.length === 0) {
            selAula.innerHTML = '<option value="">Nenhuma aula planejada</option>';
            return;
        }
        
        let options = '<option value="">-- Escolha a data --</option>';
        aulas.forEach(a => {
            const dataParts = a.data_aula.split('-');
            const dataBR = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
            const label = `${dataBR} - ${a.tema || 'Sem tema'} (${a.status})`;
            options += `<option value="${a.id}">${label}</option>`;
        });
        
        selAula.innerHTML = options;
        selAula.disabled = false;
        
    } catch(e) {
        selAula.innerHTML = '<option value="">Erro ao carregar</option>';
        console.error(e);
    }
};

window.carregarListaChamada = async function() {
    const turmaId = document.getElementById('selDiarioTurma').value;
    const aulaId = document.getElementById('selDiarioAula').value;
    const container = document.getElementById('listaChamadaContainer');
    
    if (!turmaId || !aulaId) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; margin-top: 20px;">Selecione a turma e a data da aula acima para realizar a chamada.</div>';
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Montando diário de classe...</div>';
    
    try {
        // 1. Buscar alunos matriculados na turma
        const { data: matriculas, error: errMat } = await db.from('app_evang_matriculas')
            .select('id, pessoa_id, papel, pessoas(nome_completo)')
            .eq('turma_id', turmaId)
            .eq('papel', 'Evangelizando');
            
        if (errMat) throw errMat;
        
        if (!matriculas || matriculas.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">Nenhum Evangelizando(a) matriculado nesta turma. Vá na aba Turmas e vincule os alunos.</div>';
            return;
        }
        
        const { data: aulaInfo, error: errAula } = await db.from('app_evang_aulas')
            .select('atividades_realizadas, observacoes_diarias')
            .eq('id', aulaId).single();
            
        // 2. Buscar frequência já existente para esta aula
        const { data: frequencias, error: errFreq } = await db.from('app_evang_frequencia')
            .select('*')
            .eq('aula_id', aulaId);
            
        if (errFreq) throw errFreq;
        
        const freqMap = {};
        if (frequencias) {
            frequencias.forEach(f => {
                freqMap[f.matricula_id] = { presente: f.presente, observacao: f.observacao || '' };
            });
        }
        
        // Ordenar alunos alfabeticamente
        matriculas.sort((a,b) => (a.pessoas?.nome_completo || '').localeCompare(b.pessoas?.nome_completo || ''));
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="margin: 0; color: var(--text-main);">Chamada - ${matriculas.length} Alunos</h4>
                <button class="btn btn-primary" onclick="salvarDiarioClasse('${aulaId}')">Salvar Chamada</button>
            </div>
            
            <div style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid var(--border); overflow: hidden; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">
                            <th style="padding: 12px; text-align: left; color: var(--text-muted); width: 40%;">Nome do Evangelizando</th>
                            <th style="padding: 12px; text-align: center; color: var(--text-muted); width: 20%;">Presença</th>
                            <th style="padding: 12px; text-align: left; color: var(--text-muted); width: 40%;">Observação / Justificativa (Falta)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        matriculas.forEach(m => {
            const mId = m.id;
            const record = freqMap[mId];
            const isPresente = record ? record.presente : true; // Padrão é true
            const obsValue = record ? record.observacao : '';
            const hasRecord = !!record;
            
            // Se já tem registro e é falso, desmarca. Se não tem registro, deixa marcado (padrão PRESENTE)
            const checked = (hasRecord && !isPresente) ? '' : 'checked';
            
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px; color: var(--text-main); font-weight: 500; display: flex; justify-content: space-between; align-items: center;">
                        <span>${m.pessoas?.nome_completo || 'Desconhecido'}</span>
                        <button onclick="window.registrarOcorrenciaEvang('${m.pessoa_id}', '${(m.pessoas?.nome_completo || '').replace(/'/g, "\\'")}')" style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 4px; cursor: pointer; color: #f59e0b; padding: 2px 6px; font-size: 11px;" title="Registrar Ocorrência na Assistência Social">⚠️ Ocorrência</button>
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <label style="display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="chamada-checkbox" data-matriculaid="${mId}" ${checked} style="width: 18px; height: 18px; accent-color: #10b981;" onchange="document.getElementById('obs-${mId}').placeholder = this.checked ? 'Observação (opcional)' : 'Motivo da falta (ex: Doença)'">
                        </label>
                    </td>
                    <td style="padding: 12px;">
                        <input type="text" class="chamada-obs" id="obs-${mId}" data-matriculaid="${mId}" value="${obsValue}" placeholder="${checked ? 'Observação (opcional)' : 'Motivo da falta (ex: Doença)'}" style="width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--border); color: var(--text-main); font-size: 13px; padding: 4px; outline: none;">
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
                <div style="flex: 1; min-width: 250px;">
                    <label style="font-size: 13px; color: var(--text-muted); display: block; margin-bottom: 4px;">Atividades Realizadas na Aula</label>
                    <textarea id="txtAtividadesRealizadas" class="input" style="width: 100%; min-height: 80px;" placeholder="Descreva brevemente o que foi trabalhado em aula (ex: Contação de História e Desenho)">${aulaInfo?.atividades_realizadas || ''}</textarea>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <label style="font-size: 13px; color: var(--text-muted); display: block; margin-bottom: 4px;">Observações Gerais da Turma (Diário)</label>
                    <textarea id="txtObservacoesDiarias" class="input" style="width: 100%; min-height: 80px;" placeholder="Clima da turma, agitação, recados dados aos pais, etc.">${aulaInfo?.observacoes_diarias || ''}</textarea>
                </div>
            </div>
            
            <div style="margin-top: 16px; text-align: right;">
                <button class="btn btn-primary" onclick="salvarDiarioClasse('${aulaId}')">Salvar Diário de Classe</button>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch(e) {
        container.innerHTML = `<div style="color:#ef4444;">Erro ao montar diário: ${e.message}</div>`;
    }
};

window.salvarDiarioClasse = async function(aulaId) {
    const checkboxes = document.querySelectorAll('.chamada-checkbox');
    const records = [];
    
    checkboxes.forEach(chk => {
        const mId = chk.getAttribute('data-matriculaid');
        const obsInput = document.getElementById('obs-' + mId);
        records.push({
            aula_id: aulaId,
            matricula_id: mId,
            presente: chk.checked,
            observacao: obsInput ? obsInput.value : null
        });
    });
    
    if (records.length === 0) return;
    
    const atividades = document.getElementById('txtAtividadesRealizadas').value;
    const observacoes = document.getElementById('txtObservacoesDiarias').value;
    
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = 'Salvando...';
    btn.disabled = true;
    
    try {
        // Apagar frequencias anteriores dessa aula (substituição completa)
        await db.from('app_evang_frequencia').delete().eq('aula_id', aulaId);
        
        // Inserir novas frequencias
        const { error: errIns } = await db.from('app_evang_frequencia').insert(records);
        if (errIns) throw errIns;
        
        // Atualizar status da aula e as observações gerais
        await db.from('app_evang_aulas').update({ 
            status: 'Realizada',
            atividades_realizadas: atividades,
            observacoes_diarias: observacoes
        }).eq('id', aulaId);
        
        // Atualiza a combo para mostrar o status Realizada
        const turmaId = document.getElementById('selDiarioTurma').value;
        await carregarDatasAulasDiario();
        // Restaura a seleção
        document.getElementById('selDiarioAula').value = aulaId;
        
        btn.innerText = 'Salvo com sucesso!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerText = textoOriginal;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        
    } catch (e) {
        alert("Erro ao salvar diário: " + e.message);
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
};
