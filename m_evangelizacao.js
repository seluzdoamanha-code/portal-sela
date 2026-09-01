// ==========================================
// MÓDULO MOBILE: EVANGELIZAÇÃO - DIÁRIO DE CLASSE
// ==========================================

let _turmas = [];
let _aulas = [];
let _matriculas = [];
let _frequencias = {}; // map of matricula_id -> frequencia record

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar Turmas iniciais
    await listarTurmasMobile();
});

async function listarTurmasMobile() {
    const db = window.supabaseClient;
    const selTurma = document.getElementById('selMobileTurma');
    
    try {
        const { data, error } = await db
            .from('app_evang_turmas')
            .select('*')
            .order('ano_letivo', { ascending: false })
            .order('nome');
            
        if (error) throw error;
        
        _turmas = data || [];
        
        selTurma.innerHTML = '<option value="">-- Selecione a Turma --</option>';
        _turmas.forEach(t => {
            selTurma.innerHTML += `<option value="${t.id}">${t.nome} (${t.ano_letivo})</option>`;
        });
        
    } catch (e) {
        console.error("Erro ao carregar turmas:", e);
        selTurma.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

window.mobileTurmaChanged = async function() {
    const turmaId = document.getElementById('selMobileTurma').value;
    const selAula = document.getElementById('selMobileAula');
    const container = document.getElementById('listaChamadaMobile');
    const resumo = document.getElementById('resumoAulaMobile');
    const titulo = document.getElementById('tituloChamada');
    const btnSalvar = document.getElementById('btnSalvarDiario');
    
    // Reset view
    resumo.style.display = 'none';
    titulo.style.display = 'none';
    btnSalvar.style.display = 'none';
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px;">Selecione a turma e a aula para abrir o diário.</div>';
    
    if (!turmaId) {
        selAula.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        selAula.disabled = true;
        return;
    }
    
    const db = window.supabaseClient;
    selAula.innerHTML = '<option value="">Carregando aulas...</option>';
    selAula.disabled = true;
    
    try {
        // Busca aulas a partir de hoje e também aulas passadas (ordenadas pelas mais recentes primeiro)
        const { data, error } = await db
            .from('app_evang_aulas')
            .select('*')
            .eq('turma_id', turmaId)
            .order('data_aula', { ascending: false });
            
        if (error) throw error;
        
        _aulas = data || [];
        
        if (_aulas.length === 0) {
            selAula.innerHTML = '<option value="">Nenhuma aula planejada</option>';
            return;
        }
        
        selAula.innerHTML = '<option value="">-- Selecione a Data da Aula --</option>';
        _aulas.forEach(a => {
            const dateObj = new Date(a.data_aula + 'T12:00:00');
            const dataStr = dateObj.toLocaleDateString('pt-BR');
            let label = dataStr;
            if (a.status === 'Realizada') label += ' (✓ Realizada)';
            
            selAula.innerHTML += `<option value="${a.id}">${label}</option>`;
        });
        
        selAula.disabled = false;
        
    } catch (e) {
        console.error("Erro ao carregar aulas:", e);
        selAula.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

window.mobileAulaChanged = async function() {
    const aulaId = document.getElementById('selMobileAula').value;
    const turmaId = document.getElementById('selMobileTurma').value;
    const container = document.getElementById('listaChamadaMobile');
    const resumo = document.getElementById('resumoAulaMobile');
    const titulo = document.getElementById('tituloChamada');
    const btnSalvar = document.getElementById('btnSalvarDiario');
    
    if (!aulaId) {
        resumo.style.display = 'none';
        titulo.style.display = 'none';
        btnSalvar.style.display = 'none';
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px;">Selecione a turma e a aula para abrir o diário.</div>';
        return;
    }
    
    const aulaSelecionada = _aulas.find(a => a.id === aulaId);
    if (aulaSelecionada) {
        document.getElementById('txtTemaAulaMobile').textContent = aulaSelecionada.tema || 'Tema a definir';
        resumo.style.display = 'block';
    }
    
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Carregando alunos...</div>';
    
    const db = window.supabaseClient;
    
    try {
        // 1. Buscar matrículas
        const { data: matriculas, error: errMat } = await db
            .from('app_evang_matriculas')
            .select('id, pessoa_id, status, pessoas(nome_completo)')
            .eq('turma_id', turmaId)
            .eq('status', 'Ativa')
            .order('pessoas(nome_completo)');
            
        if (errMat) throw errMat;
        
        // Ordenação manual caso a ordenação da foreign table falhe (Supabase as vezes não ordena foreign table perfeitamente)
        _matriculas = (matriculas || []).sort((a, b) => {
            const nomeA = a.pessoas?.nome_completo || '';
            const nomeB = b.pessoas?.nome_completo || '';
            return nomeA.localeCompare(nomeB);
        });
        
        if (_matriculas.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Nenhum aluno ativo nesta turma.</div>';
            return;
        }
        
        // 2. Buscar presenças lançadas para esta aula
        const { data: freqs, error: errFreq } = await db
            .from('app_evang_frequencia')
            .select('*')
            .eq('aula_id', aulaId);
            
        if (errFreq) throw errFreq;
        
        _frequencias = {};
        (freqs || []).forEach(f => {
            _frequencias[f.matricula_id] = f;
        });
        
        // 3. Renderizar lista de alunos
        titulo.style.display = 'block';
        btnSalvar.style.display = 'flex';
        container.innerHTML = '';
        
        _matriculas.forEach(m => {
            const mId = m.id;
            const nome = m.pessoas?.nome_completo || 'Aluno Desconhecido';
            const freqRecord = _frequencias[mId];
            
            let isPresente = false;
            let isFalta = false;
            let obs = '';
            
            if (freqRecord) {
                isPresente = freqRecord.presente;
                isFalta = !freqRecord.presente;
                obs = freqRecord.observacao || '';
            }
            
            container.innerHTML += `
                <div class="aluno-card" data-matricula="${mId}">
                    <div class="aluno-header">
                        <div class="aluno-nome">${nome}</div>
                        <!-- Botão Assistência Rápida Mobile opcional? Talvez no futuro -->
                    </div>
                    
                    <div class="presenca-controls">
                        <button class="btn-presenca presente ${isPresente ? 'active' : ''}" onclick="togglePresenca('${mId}', 'presente')">Presente</button>
                        <button class="btn-presenca falta ${isFalta ? 'active' : ''}" onclick="togglePresenca('${mId}', 'falta')">Falta</button>
                    </div>
                    
                    <input type="text" class="obs-input" id="obs-${mId}" placeholder="Motivo / Observação (Opcional)" value="${obs}">
                </div>
            `;
        });
        
    } catch (e) {
        console.error("Erro ao carregar diário:", e);
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 40px 0;">Erro ao carregar diário. Tente novamente.</div>';
    }
}

window.togglePresenca = function(matriculaId, tipo) {
    const card = document.querySelector(`.aluno-card[data-matricula="${matriculaId}"]`);
    const btnPresente = card.querySelector('.btn-presenca.presente');
    const btnFalta = card.querySelector('.btn-presenca.falta');
    
    if (tipo === 'presente') {
        btnPresente.classList.add('active');
        btnFalta.classList.remove('active');
    } else {
        btnFalta.classList.add('active');
        btnPresente.classList.remove('active');
    }
}

window.salvarDiarioMobile = async function() {
    const aulaId = document.getElementById('selMobileAula').value;
    if (!aulaId) return;
    
    const db = window.supabaseClient;
    const cards = document.querySelectorAll('.aluno-card');
    
    const registros = [];
    
    let faltaMarcacao = false;
    
    cards.forEach(card => {
        const mId = card.getAttribute('data-matricula');
        const isPresente = card.querySelector('.btn-presenca.presente').classList.contains('active');
        const isFalta = card.querySelector('.btn-presenca.falta').classList.contains('active');
        const obs = card.querySelector(`#obs-${mId}`).value.trim();
        
        if (!isPresente && !isFalta) {
            faltaMarcacao = true;
        }
        
        // Se pelo menos um botão foi clicado (ou se já estava no bd)
        if (isPresente || isFalta) {
            registros.push({
                aula_id: aulaId,
                matricula_id: mId,
                presente: isPresente,
                observacao: obs || null,
                atualizado_em: new Date().toISOString()
            });
        }
    });
    
    if (faltaMarcacao) {
        const confirmar = await Swal.fire({
            title: 'Faltam Alunos!',
            text: 'Alguns alunos não tiveram presença ou falta marcada. Deseja salvar mesmo assim? (Eles ficarão sem lançamento)',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, Salvar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirmar.isConfirmed) return;
    }
    
    Swal.fire({ title: 'Salvando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    try {
        if (registros.length > 0) {
            const { error: errUpsert } = await db
                .from('app_evang_frequencia')
                .upsert(registros, { onConflict: 'aula_id, matricula_id' });
                
            if (errUpsert) throw errUpsert;
        }
        
        // Atualiza status da aula para Realizada caso tenha lançamentos
        if (registros.length > 0) {
            await db.from('app_evang_aulas').update({ status: 'Realizada' }).eq('id', aulaId);
            
            // Atualiza local cache e dropdown (mudar label visualmente)
            const aulaOpt = document.querySelector(`#selMobileAula option[value="${aulaId}"]`);
            if (aulaOpt && !aulaOpt.textContent.includes('Realizada')) {
                aulaOpt.textContent += ' (✓ Realizada)';
            }
        }
        
        Swal.fire('Salvo!', 'O diário de classe foi salvo com sucesso.', 'success');
        
    } catch (e) {
        console.error("Erro ao salvar diário mobile:", e);
        Swal.fire('Erro', 'Não foi possível salvar: ' + e.message, 'error');
    }
}
