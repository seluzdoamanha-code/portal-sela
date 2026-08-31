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
                    <button onclick="mudarAbaEvang('turmas')" id="btnAbaEvangTurmas" class="btn" style="text-align: left; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border); justify-content: flex-start;">🏫 Turmas e Matrículas</button>
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
    
    // Inicia na aba Turmas
    mudarAbaEvang('turmas');
};

window.mudarAbaEvang = function(aba) {
    const ids = ['Turmas', 'Aulas', 'Diario', 'Boletim'];
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

    if (aba === 'turmas') {
        carregarEvangTurmas();
    } else if (aba === 'aulas') {
        content.innerHTML = '<h3 style="color:#10b981;">Planejamento de Aulas</h3><p style="color:var(--text-muted);">Módulo em desenvolvimento...</p>';
    } else if (aba === 'diario') {
        content.innerHTML = '<h3 style="color:#10b981;">Diário de Classe</h3><p style="color:var(--text-muted);">Módulo em desenvolvimento...</p>';
    } else if (aba === 'boletim') {
        content.innerHTML = '<h3 style="color:#10b981;">Boletim de Avaliação</h3><p style="color:var(--text-muted);">Módulo em desenvolvimento...</p>';
    }
};

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
            .select('*, pessoas(nome, celular)')
            .eq('turma_id', turmaId);
            
        if (error) throw error;
        
        // Pessoas cadastradas que tem perfil de Evangelizando ou Evangelizador
        const { data: todasPessoas, error: errP } = await db.from('pessoas')
            .select('id, nome, perfis')
            .order('nome');
            
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
                return (a.pessoas?.nome || '').localeCompare(b.pessoas?.nome || '');
            });
            
            matriculas.forEach(m => {
                const isProf = m.papel === 'Evangelizador';
                const badgeStyle = isProf ? 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981;' : 'background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6;';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 14px; color: var(--text-main); font-weight: 500;">${m.pessoas?.nome || 'Desconhecido'}</div>
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
                    
                    <label style="font-size: 12px; color: var(--text-muted);">Evangelizadores Disponíveis</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; margin-top: 4px;">
                        <select id="selEvangelizador" class="input" style="flex: 1;">
                            <option value="">Selecione...</option>
                            ${dispoEvangelizadores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="addMatriculaEvang('${turmaId}', '${turmaNome}', 'selEvangelizador', 'Evangelizador')">Vincular</button>
                    </div>
                    
                    <label style="font-size: 12px; color: var(--text-muted);">Evangelizandos (Alunos) Disponíveis</label>
                    <div style="display: flex; gap: 8px; margin-top: 4px;">
                        <select id="selEvangelizando" class="input" style="flex: 1;">
                            <option value="">Selecione...</option>
                            ${dispoEvangelizandos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="addMatriculaEvang('${turmaId}', '${turmaNome}', 'selEvangelizando', 'Evangelizando')">Vincular</button>
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
