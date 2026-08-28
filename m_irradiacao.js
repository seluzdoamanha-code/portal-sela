document.addEventListener("DOMContentLoaded", () => {
    if (typeof verificarAutenticacao === 'function') {
        verificarAutenticacao();
    }
    carregarSugestoes();
    
    const form = document.getElementById('formIrradiacao');
    if (form) {
        form.addEventListener('submit', salvarIrradiacao);
    }
});

let lastInsertedIds = [];

// Voltar para o hub com o ID correto
window.voltarParaHub = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || localStorage.getItem('estrutura_atual');
    if (id) {
        window.location.href = `m_hub.html?id=${id}&tipo=irradiacao`;
    } else {
        window.location.href = 'm_index.html';
    }
};

// Lógica de toggle Desencarnado
window.toggleDesencarnadoIrr = function(isChecked) {
    const groupEndereco = document.getElementById('groupIrrEndereco');
    const inputEndereco = document.getElementById('inIrrEndereco');
    const chkQuartaDesencarnado = document.querySelector('input[value="Quarta-feira (Desencarnado)"]');
    const chks = document.querySelectorAll('.chk-dia');
    
    if (isChecked) {
        // Esconde endereço
        groupEndereco.style.display = 'none';
        inputEndereco.value = '';
        inputEndereco.removeAttribute('required');
        
        // Desmarca todos e marca apenas Quarta (Desencarnado)
        chks.forEach(chk => {
            chk.checked = false;
            chk.parentElement.classList.remove('selected');
        });
        
        if (chkQuartaDesencarnado) {
            chkQuartaDesencarnado.checked = true;
            chkQuartaDesencarnado.parentElement.classList.add('selected');
        }
    } else {
        // Mostra endereço
        groupEndereco.style.display = 'block';
        
        if (chkQuartaDesencarnado) {
            chkQuartaDesencarnado.checked = false;
            chkQuartaDesencarnado.parentElement.classList.remove('selected');
        }
    }
};

async function carregarSugestoes() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const estruturaId = urlParams.get('id') || localStorage.getItem('estrutura_atual');
        
        let query = db.from('app_irradiacao_solicitacoes').select('nome_solicitado, endereco');
            
        if (estruturaId) {
            query = query.eq('estrutura_id', estruturaId);
        }
        
        const { data, error } = await query.order('criado_em', { ascending: false }).limit(100);
            
        if (!error && data) {
            window.sugestoesIrradiacao = {};
            const datalist = document.getElementById('listaNomesIrr');
            datalist.innerHTML = ''; // limpa lista
            data.forEach(item => {
                const n = (item.nome_solicitado || '').toUpperCase();
                if (!window.sugestoesIrradiacao[n]) {
                    window.sugestoesIrradiacao[n] = item.endereco ? item.endereco.toUpperCase() : '';
                    const opt = document.createElement('option');
                    opt.value = n;
                    datalist.appendChild(opt);
                }
            });
            
            const inNome = document.getElementById('inIrrNome');
            const inEnd = document.getElementById('inIrrEndereco');
            const chkDesencarnado = document.getElementById('chkIrrDesencarnado');
            
            inNome.addEventListener('input', (e) => {
                const val = e.target.value.toUpperCase();
                if (window.sugestoesIrradiacao && window.sugestoesIrradiacao[val] !== undefined) {
                    if (!chkDesencarnado.checked && !inEnd.value) {
                        inEnd.value = window.sugestoesIrradiacao[val];
                    }
                }
            });
        }
    } catch(e) { 
        console.error('Erro ao carregar sugestões', e); 
    }
}

async function salvarIrradiacao(e) {
    e.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const estruturaId = urlParams.get('id') || localStorage.getItem('estrutura_atual');
    
    if (!estruturaId) {
        alert("Erro: ID da estrutura não encontrado.");
        return;
    }

    const btnSave = document.getElementById('btnSaveIrr');
    let nome = document.getElementById('inIrrNome').value.trim().toUpperCase();
    const endereco = document.getElementById('inIrrEndereco').value.trim().toUpperCase();
    const isDesencarnado = document.getElementById('chkIrrDesencarnado').checked;
    
    if (isDesencarnado && !nome.startsWith('🌟 ')) {
        nome = '🌟 ' + nome;
    }

    const dias = Array.from(document.querySelectorAll('.chk-dia:checked')).map(el => el.value);
    
    if (dias.length === 0) {
        alert("Selecione pelo menos um dia para a Irradiação.");
        return;
    }
    
    btnSave.disabled = true;
    btnSave.textContent = 'Enviando...';
    
    try {
        let criadoPor = 'Desconhecido';
        try {
            const profStr = localStorage.getItem('sela_user_profile');
            if (profStr) {
                const prof = JSON.parse(profStr);
                criadoPor = prof.nome_curto || (prof.nome || '').trim().split(' ')[0] || 'Desconhecido';
            }
        } catch(e) {}

        const recordsToInsert = dias.map(dia => ({
            estrutura_id: estruturaId,
            nome_solicitado: nome,
            endereco: isDesencarnado ? null : endereco,
            dias_semana: dia,
            status: 'pendente',
            leituras: 0,
            criado_por: criadoPor
        }));
        
        const { data, error } = await db
            .from('app_irradiacao_solicitacoes')
            .insert(recordsToInsert)
            .select();
            
        if (error) throw error;
        
        lastInsertedIds = data.map(r => r.id);
        
        // Esconde formulário, mostra sucesso
        document.getElementById('formContainer').style.display = 'none';
        document.getElementById('panelSuccess').style.display = 'block';
        
        document.getElementById('resumeContent').innerHTML = `
            <strong style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Nome(s):</strong><br>
            <div style="font-size: 15px; font-weight: 500; margin-bottom: 12px;">${nome}</div>
            
            ${!isDesencarnado ? `
            <strong style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Endereço:</strong><br>
            <div style="font-size: 15px; font-weight: 500; margin-bottom: 12px;">${endereco || 'Não informado'}</div>
            ` : ''}
            
            <strong style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Dias:</strong><br>
            <div style="font-size: 15px; font-weight: 500;">${dias.join('<br>')}</div>
        `;
        
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar solicitação. Tente novamente.");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Enviar Solicitação';
    }
}

window.novaSolicitacaoIrr = function() {
    document.getElementById('formIrradiacao').reset();
    document.querySelectorAll('.tag-checkbox-ui').forEach(el => el.classList.remove('selected'));
    
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('panelSuccess').style.display = 'none';
    document.getElementById('groupIrrEndereco').style.display = 'block';
    
    lastInsertedIds = [];
};

window.cancelarSolicitacaoIrr = async function() {
    if (lastInsertedIds.length === 0) return;
    
    if (!confirm("Tem certeza que deseja cancelar e apagar esta solicitação?")) return;
    
    const btn = document.getElementById('btnCancelIrr');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Apagando...';
    
    try {
        const { error } = await db
            .from('app_irradiacao_solicitacoes')
            .delete()
            .in('id', lastInsertedIds);
            
        if (error) throw error;
        
        alert("Solicitação apagada com sucesso.");
        window.novaSolicitacaoIrr();
    } catch (err) {
        console.error(err);
        alert("Erro ao apagar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};
