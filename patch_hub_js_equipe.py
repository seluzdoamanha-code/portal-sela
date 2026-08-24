import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update carregarEquipe to show the button if user is lider
old_carregar = """        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }"""
        
new_carregar = """        
        let isLider = false;
        if (window.isAdminGlobal && window.isAdminGlobal()) {
            isLider = true;
        } else if (data) {
            data.forEach(v => {
                if (v.pessoas && v.pessoas.email === userEmail) {
                    const p = (v.perfil || '').toLowerCase();
                    if (tagsLideranca.some(t => p.includes(t))) isLider = true;
                }
            });
        }
        
        const btnGerenciar = document.getElementById('btnHubGerenciarEquipe');
        if (btnGerenciar) {
            btnGerenciar.style.display = isLider ? 'block' : 'none';
        }

        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }"""
        
content = content.replace(old_carregar, new_carregar)

# 2. Add functions at the end of the file
hub_funcs = """

// ==========================================
// MODAL DE GESTÃO DE EQUIPE (MODO LISTA)
// ==========================================

window.abrirHubModalEquipe = async function() {
    document.getElementById('hubModalEquipePlana').style.display = 'flex';
    inicializarBuscaPessoasHubEquipe();
    await carregarHubListaMembrosPlana();
};

window.fecharHubModalEquipe = function() {
    document.getElementById('hubModalEquipePlana').style.display = 'none';
    carregarEquipe(); // Recarrega os gridMembros originais do Hub
};

async function carregarHubListaMembrosPlana() {
    const tbody = document.getElementById('hubEqListaMembros');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:16px;">Carregando...</td></tr>';
    
    const { data, error } = await db.from('vinculos_estrutura').select('id, perfil, pessoas(nome_completo)').eq('estrutura_id', estruturaId);
    if (error) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Erro ao carregar equipe.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px;">Ninguém nesta equipe ainda.</td></tr>';
        return;
    }
    
    // Sort
    data.sort((a, b) => {
        const pA = (a.perfil || '').toLowerCase();
        const pB = (b.perfil || '').toLowerCase();
        if (pA.includes('diretor') && !pB.includes('diretor')) return -1;
        if (pB.includes('diretor') && !pA.includes('diretor')) return 1;
        const nA = a.pessoas ? a.pessoas.nome_completo : '';
        const nB = b.pessoas ? b.pessoas.nome_completo : '';
        return nA.localeCompare(nB);
    });
    
    data.forEach(v => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? v.pessoas.nome_completo : 'Desconhecido'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="hubAtualizarPapelEquipe('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="hubRemoverMembroEquipe('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let hubPessoasBuscaCache = [];
async function inicializarBuscaPessoasHubEquipe() {
    const input = document.getElementById('hubEqBuscaPessoa');
    const sugestoes = document.getElementById('hubEqSugestoes');
    if (!input) return;
    
    if (hubPessoasBuscaCache.length === 0) {
        const { data } = await db.from('pessoas').select('id, nome_completo');
        if (data) hubPessoasBuscaCache = data;
    }
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val.length < 2) {
            sugestoes.style.display = 'none';
            return;
        }
        
        const filter = hubPessoasBuscaCache.filter(p => p.nome_completo && p.nome_completo.toLowerCase().includes(val)).slice(0, 8);
        
        if (filter.length > 0) {
            sugestoes.innerHTML = '';
            filter.forEach(p => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = p.nome_completo;
                div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.1)';
                div.onmouseout = () => div.style.background = 'transparent';
                div.onclick = () => {
                    input.value = p.nome_completo;
                    document.getElementById('hubEqPessoaId').value = p.id;
                    sugestoes.style.display = 'none';
                };
                sugestoes.appendChild(div);
            });
            sugestoes.style.display = 'block';
        } else {
            sugestoes.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== sugestoes) {
            sugestoes.style.display = 'none';
        }
    });
}

window.hubAdicionarMembroEquipe = async function() {
    const pessoaId = document.getElementById('hubEqPessoaId').value;
    const papel = document.getElementById('hubEqPapel').value;
    
    if (!pessoaId) {
        alert("Por favor, busque e selecione uma pessoa da lista.");
        return;
    }
    
    try {
        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: estruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: null
        });
        if (error) throw error;
        
        document.getElementById('hubEqBuscaPessoa').value = '';
        document.getElementById('hubEqPessoaId').value = '';
        document.getElementById('hubEqPapel').value = '';
        
        await carregarHubListaMembrosPlana();
    } catch(e) {
        alert("Erro ao adicionar: " + e.message);
    }
};

window.hubRemoverMembroEquipe = async function(vinculoId) {
    if (!confirm("Remover este membro da equipe?")) return;
    
    try {
        const { data: v } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', vinculoId).single();
        const pId = v ? v.parent_vinculo_id : null;
        await db.from('vinculos_estrutura').update({ parent_vinculo_id: pId }).eq('parent_vinculo_id', vinculoId);
        
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', vinculoId);
        if (error) throw error;
        
        await carregarHubListaMembrosPlana();
    } catch(e) {
        alert("Erro ao remover: " + e.message);
    }
};

window.hubAtualizarPapelEquipe = async function(vinculoId, novoPapel) {
    try {
        const { error } = await db.from('vinculos_estrutura').update({ perfil: novoPapel }).eq('id', vinculoId);
        if (error) throw error;
    } catch(e) {
        alert("Erro ao atualizar papel.");
    }
};
"""

content += hub_funcs

with open(filepath, 'w') as f:
    f.write(content)
print("hub.js patched for teams")
