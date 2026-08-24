(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    const estruturaId = urlParams.get('id');

    let vinculosGlobais = [];
    let pessoasParaSelect = [];

    document.addEventListener('DOMContentLoaded', async () => {
        if (!estruturaId) {
            Swal.fire('Erro', 'Nenhuma atividade/estrutura informada.', 'error');
            return;
        }

        document.getElementById('btnVoltar').addEventListener('click', () => {
            window.location.href = `m_hub.html?id=${estruturaId}`;
        });

        document.getElementById('btnNovoMembro').addEventListener('click', () => {
            abrirModal();
        });

        // Setup modal listeners
        const selPessoa = document.getElementById('inPessoa');
        selPessoa.addEventListener('change', (e) => {
            const pessoaId = e.target.value;
            const selectPerfil = document.getElementById('mInPerfil');
            const groupPerfil = document.getElementById('mGroupPerfil');
            selectPerfil.innerHTML = '';
            
            if (!pessoaId) {
                groupPerfil.style.display = 'none';
                return;
            }
            
            const p = pessoasParaSelect.find(x => x.id == pessoaId);
            const tags = p.papeis || [];
            
            if (tags.length === 0) {
                selectPerfil.innerHTML = '<option value="">(Pessoa sem papéis definidos)</option>';
                selectPerfil.disabled = true;
                document.getElementById('btnSaveModal').disabled = true;
            } else {
                selectPerfil.disabled = false;
                document.getElementById('btnSaveModal').disabled = false;
                tags.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    selectPerfil.appendChild(opt);
                });
            }
            groupPerfil.style.display = 'block';
        });

        document.getElementById('formNovoMembro').addEventListener('submit', salvarNovoMembro);

        await carregarPessoas();
        await carregarArvore();
    });

    async function carregarPessoas() {
        const { data, error } = await db.from('pessoas').select('id, nome_curto, nome_completo, cpf_cnpj, tipo_pessoa, papeis').order('nome_completo');
        if (data) {
            // Filtrar apenas associados efetivos
            const efetivos = data.filter(p => p.papeis && p.papeis.includes('Associado Efetivo'));
            pessoasParaSelect = efetivos;
            
            const selPessoa = document.getElementById('inPessoa');
            let html = '<option value="">-- Selecione um membro --</option>';
            efetivos.forEach(p => {
                const name = p.nome_curto || p.nome_completo || 'Sem Nome';
                html += `<option value="${p.id}">${name}</option>`;
            });
            selPessoa.innerHTML = html;
        }
    }

    async function carregarArvore() {
        const container = document.getElementById('treeContainer');
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 40px;">Carregando organograma...</div>';

        try {
            const { data, error } = await db
                .from('vinculos_estrutura')
                .select(`
                    id,
                    parent_vinculo_id,
                    perfil,
                    pessoas (
                        id,
                        nome_completo,
                        nome_curto,
                        papeis
                    )
                `)
                .eq('estrutura_id', estruturaId);

            if (error) throw error;

            vinculosGlobais = data || [];
            
            // Popular select de líderes do modal
            const selParent = document.getElementById('mInParent');
            selParent.innerHTML = '<option value="">-- Ninguém (Será o topo) --</option>';
            vinculosGlobais.forEach(v => {
                const nome = v.pessoas?.nome_curto || v.pessoas?.nome_completo || 'Desconhecido';
                selParent.innerHTML += `<option value="${v.id}">${nome} (${v.perfil})</option>`;
            });

            if (vinculosGlobais.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 40px;">Nenhum membro adicionado ao organograma ainda.</div>';
                return;
            }

            // Construir representação em árvore na vertical
            container.innerHTML = '';
            
            // Encontrar nós raízes (quem não tem pai ou o pai não existe na lista atual)
            const idsValidos = vinculosGlobais.map(v => v.id);
            const raizes = vinculosGlobais.filter(v => !v.parent_vinculo_id || !idsValidos.includes(v.parent_vinculo_id));
            
            raizes.forEach(raiz => {
                renderizarNoRecursivo(raiz, 0, container);
            });

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="text-align: center; color: var(--danger); font-size: 14px; padding: 40px;">Erro ao carregar organograma.</div>';
        }
    }

    function renderizarNoRecursivo(no, nivel, container) {
        const wrapper = document.createElement('div');
        wrapper.className = `tree-node-wrapper indent-${nivel}`;
        
        const nome = no.pessoas?.nome_curto || no.pessoas?.nome_completo || 'Desconhecido';
        const nPerfil = no.perfil || 'Membro';
        
        // Alerta de inconsistência de cargo
        let corRole = 'var(--text-muted)';
        if (no.pessoas) {
            const tags = no.pessoas.papeis || [];
            if (!tags.includes(nPerfil)) {
                corRole = 'var(--danger)';
            }
        }

        wrapper.innerHTML = `
            <div class="tree-node-card">
                <div class="tree-node-info">
                    <div class="tree-node-name">${nome}</div>
                    <div style="font-size: 11px; color: ${corRole}; margin-top: 2px;">${nPerfil}</div>
                </div>
                <div class="tree-node-actions">
                    <button class="btn-node-action btn-delete" onclick="excluirVinculo('${no.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(wrapper);
        
        // Encontrar filhos deste nó e renderizar
        const filhos = vinculosGlobais.filter(v => v.parent_vinculo_id === no.id);
        filhos.forEach(filho => {
            renderizarNoRecursivo(filho, nivel + 1, container);
        });
    }

    window.excluirVinculo = async function(id) {
        Swal.fire({
            title: 'Excluir Membro?',
            text: "Os subordinados diretos deste cargo subirão de nível ou ficarão órfãos na árvore.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim, remover',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Busca o vínculo para pegar o pai dele
                    const { data: vinculo } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', id).single();
                    const parentId = vinculo ? vinculo.parent_vinculo_id : null;
                    
                    // Atualiza filhos deste nó para apontar para o pai dele
                    await db.from('vinculos_estrutura').update({ parent_vinculo_id: parentId }).eq('parent_vinculo_id', id);
                    
                    // Exclui
                    const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
                    if (error) throw error;
                    
                    Swal.fire('Removido!', 'O membro foi removido do organograma.', 'success');
                    carregarArvore();
                } catch(e) {
                    Swal.fire('Erro!', 'Falha ao remover membro.', 'error');
                }
            }
        });
    };

    window.abrirModal = function() {
        document.getElementById('modalNovoMembro').style.display = 'flex';
    };

    window.fecharModal = function() {
        document.getElementById('modalNovoMembro').style.display = 'none';
        document.getElementById('formNovoMembro').reset();
        document.getElementById('mGroupPerfil').style.display = 'none';
    };

    async function salvarNovoMembro(e) {
        e.preventDefault();
        
        const pessoaId = document.getElementById('inPessoa').value;
        const perfil = document.getElementById('mInPerfil').value;
        const parentId = document.getElementById('mInParent').value || null;

        try {
            const { error } = await db.from('vinculos_estrutura').insert([{
                estrutura_id: estruturaId,
                pessoa_id: pessoaId,
                perfil: perfil,
                parent_vinculo_id: parentId
            }]);

            if (error) throw error;
            
            fecharModal();
            carregarArvore();
        } catch(err) {
            Swal.fire('Erro!', 'Não foi possível salvar o membro: ' + err.message, 'error');
        }
    }
})();
