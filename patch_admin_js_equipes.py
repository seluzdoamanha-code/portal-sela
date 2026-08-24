import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

funcs = """
// ==========================================
// MÓDULO: DEPARTAMENTOS E ATIVIDADES (Equipe Plana)
// ==========================================

let currentEstruturaId = null;
let currentEstruturaNome = "";

async function carregarDashboardsDepartamentosEAtividades() {
    const { data: estruturas, error: errEst } = await db.from('estruturas').select('id, nome, tipo, icone, cor').order('nome');
    const { data: vinculos, error: errVinc } = await db.from('vinculos_estrutura').select('estrutura_id');
    
    if (errEst || errVinc) {
        console.error("Erro ao carregar estruturas/vinculos:", errEst, errVinc);
        return;
    }
    
    // Contagem
    const contagem = {};
    vinculos.forEach(v => {
        contagem[v.estrutura_id] = (contagem[v.estrutura_id] || 0) + 1;
    });
    
    const gridDept = document.getElementById('gridDepartamentos');
    const gridAtiv = document.getElementById('gridAtividades');
    
    if (gridDept) gridDept.innerHTML = '';
    if (gridAtiv) gridAtiv.innerHTML = '';
    
    estruturas.forEach(est => {
        const qtd = contagem[est.id] || 0;
        const icon = est.icone || '📁';
        const color = est.cor || '#3b82f6';
        
        const card = document.createElement('div');
        card.style.cssText = `background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 20px; border-left: 4px solid ${color}; cursor: pointer; transition: transform 0.2s; display: flex; flex-direction: column; gap: 12px;`;
        card.onmouseover = () => card.style.transform = 'translateY(-2px)';
        card.onmouseout = () => card.style.transform = 'translateY(0)';
        card.onclick = () => abrirModalEquipePlana(est.id, est.nome, est.tipo);
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 24px;">${icon}</div>
                <div style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${qtd} membros</div>
            </div>
            <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${est.nome}</div>
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: auto;">${est.tipo}</div>
        `;
        
        if (est.tipo === 'Departamento' || est.tipo === 'Administrativo') {
            if (gridDept) gridDept.appendChild(card);
        } else {
            if (gridAtiv) gridAtiv.appendChild(card);
        }
    });
    
    if (gridDept && gridDept.children.length === 0) gridDept.innerHTML = '<div style="color:var(--text-muted);">Nenhum departamento cadastrado.</div>';
    if (gridAtiv && gridAtiv.children.length === 0) gridAtiv.innerHTML = '<div style="color:var(--text-muted);">Nenhuma atividade cadastrada.</div>';
    
    inicializarBuscaPessoasEquipe();
}

// Inicializa a busca de pessoas (Autocompletar)
let pessoasBuscaCache = [];
async function inicializarBuscaPessoasEquipe() {
    const input = document.getElementById('eqBuscaPessoa');
    const sugestoes = document.getElementById('eqSugestoes');
    if (!input) return;
    
    if (pessoasBuscaCache.length === 0) {
        const { data } = await db.from('pessoas').select('id, nome_completo');
        if (data) pessoasBuscaCache = data;
    }
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val.length < 2) {
            sugestoes.style.display = 'none';
            return;
        }
        
        const filter = pessoasBuscaCache.filter(p => p.nome_completo && p.nome_completo.toLowerCase().includes(val)).slice(0, 8);
        
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
                    document.getElementById('eqPessoaId').value = p.id;
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

window.abrirModalEquipePlana = async function(id, nome, tipo) {
    currentEstruturaId = id;
    currentEstruturaNome = nome;
    
    document.getElementById('modalEquipePlanaTitle').textContent = `Equipe: ${nome}`;
    document.getElementById('modalEquipePlanaSub').textContent = `Gerenciando estrutura tipo: ${tipo}`;
    
    document.getElementById('modalEquipePlana').style.display = 'flex';
    
    await carregarListaMembrosPlana();
};

window.fecharModalEquipePlana = function() {
    document.getElementById('modalEquipePlana').style.display = 'none';
    carregarDashboardsDepartamentosEAtividades(); // Refresh counters
};

async function carregarListaMembrosPlana() {
    const tbody = document.getElementById('eqListaMembros');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:16px;">Carregando...</td></tr>';
    
    const { data, error } = await db.from('vinculos_estrutura').select('id, perfil, pessoas(nome_completo)').eq('estrutura_id', currentEstruturaId);
    if (error) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Erro ao carregar equipe.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px;">Ninguém nesta equipe ainda.</td></tr>';
        return;
    }
    
    // Sort by role then name
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
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="atualizarPapelEquipePlana('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="removerMembroEquipePlana('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.adicionarMembroEquipePlana = async function() {
    const pessoaId = document.getElementById('eqPessoaId').value;
    const pessoaNome = document.getElementById('eqBuscaPessoa').value;
    const papel = document.getElementById('eqPapel').value;
    
    if (!pessoaId) {
        alert("Por favor, busque e selecione uma pessoa da lista.");
        return;
    }
    
    try {
        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: currentEstruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: null // Inserção plana, sem nó pai fixo!
        });
        if (error) throw error;
        
        document.getElementById('eqBuscaPessoa').value = '';
        document.getElementById('eqPessoaId').value = '';
        document.getElementById('eqPapel').value = '';
        
        await carregarListaMembrosPlana();
    } catch(e) {
        console.error(e);
        alert("Erro ao adicionar: " + e.message);
    }
};

window.removerMembroEquipePlana = async function(vinculoId) {
    if (!confirm("Remover este membro da equipe?")) return;
    
    try {
        // Logica segura do organograma aplicada: orfanar filhos para previnir cascade delete failure
        const { data: v } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', vinculoId).single();
        const pId = v ? v.parent_vinculo_id : null;
        await db.from('vinculos_estrutura').update({ parent_vinculo_id: pId }).eq('parent_vinculo_id', vinculoId);
        
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', vinculoId);
        if (error) throw error;
        
        await carregarListaMembrosPlana();
    } catch(e) {
        console.error(e);
        alert("Erro ao remover: " + e.message);
    }
};

window.atualizarPapelEquipePlana = async function(vinculoId, novoPapel) {
    try {
        const { error } = await db.from('vinculos_estrutura').update({ perfil: novoPapel }).eq('id', vinculoId);
        if (error) throw error;
    } catch(e) {
        console.error(e);
        alert("Erro ao atualizar papel.");
    }
};
"""

content += funcs

# Call carregarDashboardsDepartamentosEAtividades in admin check
old_admin = "carregarAssociadosMensalidades();"
new_admin = """carregarAssociadosMensalidades();
        carregarDashboardsDepartamentosEAtividades();"""
content = content.replace(old_admin, new_admin)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js patched")
