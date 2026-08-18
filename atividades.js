const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estruturasGlobais = [];
let estruturaEditandoId = null;
let atalhosUsuario = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarEstruturas();
    setupModal();
    
    // Esconder o botão de criar nova estrutura para não-admins
    const isAdmin = (typeof window.isAdmin === 'function' && window.isAdmin());
    const btnNovo = document.getElementById('btnNovaEstrutura');
    if (btnNovo && !isAdmin) {
        btnNovo.style.display = 'none';
    }
    
    const inputSearch = document.getElementById('searchEstrutura');
    const filterTipo = document.getElementById('filterTipoEstrutura');

    inputSearch.addEventListener('input', window.aplicarFiltros);
    filterTipo.addEventListener('change', window.aplicarFiltros);
});

window.aplicarFiltros = () => {
    try {
        const inputSearch = document.getElementById('searchEstrutura');
        const filterTipo = document.getElementById('filterTipoEstrutura');
        
        const termoBusca = (inputSearch ? inputSearch.value : '').toLowerCase();
        const tipoSelecionado = filterTipo ? filterTipo.value : '';
        
        let filtrados = estruturasGlobais.filter(e => {
            const nomeMatch = (e.nome || '').toLowerCase().includes(termoBusca);
            const tipoMatch = tipoSelecionado ? e.tipo === tipoSelecionado : true;
            return nomeMatch && tipoMatch;
        });

        // Ordem alfabética
        filtrados.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        renderizarTabela(filtrados);
    } catch (err) {
        console.error("Erro no aplicarFiltros:", err);
    }
};

async function carregarEstruturas(silencioso = false) {
    if (!silencioso) {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('tableContainer').style.display = 'none';
    }
    
    const { data: { session } } = await db.auth.getSession();
    const userEmail = session?.user?.email;
    let atalhos = [];
    if (userEmail) {
        const { data: atalhosData } = await db.from('usuario_atalhos').select('estrutura_id').eq('email', userEmail);
        atalhos = (atalhosData || []).map(a => a.estrutura_id);
    }
    atalhosUsuario = atalhos;

    // Na tabela 'estruturas', queremos saber quantas pessoas tem, mas isso está na vinculos_estrutura.
    // Por enquanto, faremos o select básico. Depois adicionamos as contagens.
    const { data, error } = await db.from('estruturas').select('*').order('nome');
    
    // Busca os vínculos para sabermos o total de pessoas em cada departamento
    const { data: vinculosData } = await db.from('vinculos_estrutura').select('estrutura_id');
    const vinculos = vinculosData || [];
    
    if (error) {
        document.getElementById('loadingState').textContent = 'Erro ao carregar: ' + error.message;
        return;
    }
    
    // Conta quantas pessoas tem em cada estrutura e joga dentro do objeto
    estruturasGlobais = (data || []).map(e => {
        e.total_pessoas = vinculos.filter(v => v.estrutura_id === e.id).length;
        return e;
    });
    
    if (estruturasGlobais.length === 0) {
        document.getElementById('loadingState').textContent = 'Nenhuma Estrutura (Departamento/Família) cadastrada ainda.';
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('tableContainer').style.display = 'none';
    } else {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'block';
        window.aplicarFiltros(); 
    }
}

function renderizarTabela(dados) {
    const tbody = document.getElementById('tableEstruturas');
    tbody.innerHTML = '';
    
    dados.forEach(estrutura => {
        const icone = window.obterIconeEstrutura ? window.obterIconeEstrutura(estrutura.nome, estrutura.tipo) : '🏛️';
        
        const isFavorito = atalhosUsuario.includes(estrutura.id);
        const estrela = isFavorito ? '⭐' : '☆';
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500; font-size: 16px;">
                    <span onclick="alternarFavorito('${estrutura.id}')" style="cursor: pointer; font-size: 18px; margin-right: 8px; user-select: none;" title="Fixar no menu lateral">${estrela}</span>
                    ${icone} ${estrutura.nome}
                </td>
                <td>
                    <span style="background: rgba(79,70,229,0.2); color: #818cf8; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${estrutura.tipo}
                    </span>
                </td>
                <td style="color: var(--text-muted); font-size: 14px;">
                    👥 ${estrutura.total_pessoas} pessoa(s)
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                        ${(typeof window.isAdmin === 'function' && window.isAdmin()) ? `
                        <button onclick="editarEstrutura('${estrutura.id}')" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            Editar
                        </button>
                        <button onclick="excluirEstrutura('${estrutura.id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                            Excluir
                        </button>
                        ` : ''}
                        <a href="hub.html?id=${estrutura.id}" style="background: var(--primary); color: #fff; border: 1px solid var(--primary); border-radius: 6px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 4px rgba(79,70,229,0.3);" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">
                            Hub
                        </a>
                    </div>
                </td>
        `;
    });
}

function setupModal() {
    const modal = document.getElementById('modalEstrutura');
    const btnNovo = document.getElementById('btnNovaEstrutura');
    const btnClose = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancelModal');
    const form = document.getElementById('formEstrutura');
    
    const fecharModal = () => { 
        modal.classList.remove('show'); 
        form.reset();
        document.getElementById('inTabEquipe').checked = true;
        document.getElementById('inTabAgenda').checked = true;
        document.getElementById('inTabProjetos').checked = true;
        document.getElementById('inTabDocumentos').checked = true;
        document.getElementById('inTabTesouraria').checked = false;
        const form = document.getElementById('formEstrutura');
        if (form) form.reset();
        estruturaEditandoId = null;
    };
    
    btnNovo.addEventListener('click', () => modal.classList.add('show'));
    btnClose.addEventListener('click', fecharModal);
    btnCancel.addEventListener('click', fecharModal);
    
    const form = document.getElementById('formEstrutura');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btnSaveModal');
            
            try {
                btnSave.disabled = true;
                btnSave.textContent = 'Salvando...';
                
                const tipo = document.getElementById('inTipoEstrutura').value;
                const nome = document.getElementById('inNomeEstrutura').value;
                
                const isIrradiacao = (nome || '').toLowerCase().includes('irradia') || (nome || '').toLowerCase().includes('sela');
                const isAssistencia = (nome || '').toLowerCase().includes('assist') && (nome || '').toLowerCase().includes('social');
                const isAtendimento = (nome || '').toLowerCase().includes('atendimento');
                
                const abas_config = {
                    equipe: document.getElementById('inTabEquipe')?.checked ?? true,
                    agenda: document.getElementById('inTabAgenda')?.checked ?? true,
                    projetos: document.getElementById('inTabProjetos')?.checked ?? true,
                    documentos: document.getElementById('inTabDocumentos')?.checked ?? true,
                    tesouraria: document.getElementById('inTabTesouraria')?.checked ?? false,
                    apps: document.getElementById('inTabApps')?.checked ?? (isIrradiacao || isAssistencia || isAtendimento)
                };
                
                const dados = {
                    tipo: tipo,
                    nome: nome,
                    abas_config: abas_config
                };
                
                if (estruturaEditandoId) {
                    const { error } = await db.from('estruturas').update(dados).eq('id', estruturaEditandoId);
                    if (error) throw error;
                } else {
                    const { error } = await db.from('estruturas').insert([dados]);
                    if (error) throw error;
                }
                
                fecharModal();
                carregarEstruturas();
            } catch (error) {
                console.error('Erro ao salvar estrutura:', error);
                alert('Erro ao salvar. Verifique o console: ' + error.message);
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Salvar Estrutura';
                }
            }
        });
    }
}

window.alternarFavorito = async function(id) {
    const { data: { session } } = await db.auth.getSession();
    const userEmail = session?.user?.email;
    if (!userEmail) return;
    
    const isFavorito = atalhosUsuario.includes(id);
    try {
        if (isFavorito) {
            const { error } = await db.from('usuario_atalhos').delete().eq('email', userEmail).eq('estrutura_id', id);
            if (error) throw error;
        } else {
            const { error } = await db.from('usuario_atalhos').insert([{ email: userEmail, estrutura_id: id }]);
            if (error) throw error;
        }
        
        await carregarEstruturas(true);
        if (typeof window.carregarAtalhosDinamicos === 'function') {
            await window.carregarAtalhosDinamicos();
        }
    } catch (err) {
        console.error("Erro ao alternar favorito:", err);
    }
};

window.editarEstrutura = async (id) => {
    if (typeof window.isAdmin === 'function' && !window.isAdmin()) {
        alert("Ação não autorizada.");
        return;
    }
    const estr = estruturasGlobais.find(e => e.id === id);
    if (!estr) return;
    
    estruturaEditandoId = id;
    

    document.getElementById('inTipoEstrutura').value = estr.tipo;
    document.getElementById('inNomeEstrutura').value = estr.nome;
    
    // Config abas
    const isIrradiacao = (estr.nome || '').toLowerCase().includes('irradia') || (estr.nome || '').toLowerCase().includes('sela');
    const isAssistencia = (estr.nome || '').toLowerCase().includes('assist') && (estr.nome || '').toLowerCase().includes('social');
    const isAtendimento = (estr.nome || '').toLowerCase().includes('atendimento');
    
    const config = estr.abas_config || {
        equipe: true, agenda: true, projetos: true, documentos: true,
        tesouraria: false,
        apps: isIrradiacao || isAssistencia || isAtendimento
    };
    
    document.getElementById('inTabEquipe').checked = !!config.equipe;
    document.getElementById('inTabAgenda').checked = !!config.agenda;
    document.getElementById('inTabProjetos').checked = !!config.projetos;
    document.getElementById('inTabDocumentos').checked = !!config.documentos;
    document.getElementById('inTabTesouraria').checked = !!config.tesouraria;
    document.getElementById('inTabApps').checked = !!config.apps;

    
    document.getElementById('modalEstrutura').classList.add('show');
};

window.excluirEstrutura = async (id) => {
    if (typeof window.isAdmin === 'function' && !window.isAdmin()) {
        alert("Ação não autorizada.");
        return;
    }
    if (!confirm("Tem certeza que deseja excluir esta estrutura? Todas as permissões e vínculos abaixo dela poderão ser afetados.")) return;
    
    try {
        const { error } = await db.from('estruturas').delete().eq('id', id);
        if (error) throw error;
        
        carregarEstruturas();
    } catch (error) {
        console.error('Erro ao excluir estrutura:', error);
        alert('Erro ao excluir. Tente novamente.');
    }
};
