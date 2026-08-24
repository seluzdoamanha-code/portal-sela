import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.js'
with open(filepath, 'r') as f:
    content = f.read()

# Carregar lista de perfis do DB
old_modal = """window.abrirHubModalEquipe = async function() {"""
new_modal = """
async function carregarListaPerfisDatalistHub() {
    try {
        const { data, error } = await db.from('configuracoes').select('valor').eq('chave', 'opcoes_perfis').single();
        if (data && data.valor) {
            const list = document.getElementById('listaPapeisComunsHub');
            if (list) {
                list.innerHTML = '';
                const perfis = JSON.parse(data.valor);
                perfis.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    list.appendChild(opt);
                });
            }
        }
    } catch (e) {}
}

window.abrirHubModalEquipe = async function() {
    carregarListaPerfisDatalistHub();"""

content = content.replace(old_modal, new_modal)

# Update carregarHubListaMembrosPlana to populate Responde A and show the parent column
old_tr = """        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? v.pessoas.nome_completo : 'Desconhecido'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="hubAtualizarPapelEquipe('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="hubRemoverMembroEquipe('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;"""

new_tr = """        const parent = v.parent_vinculo_id ? data.find(x => x.id === v.parent_vinculo_id) : null;
        const parentName = parent && parent.pessoas ? parent.pessoas.nome_completo : '-';
        
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? v.pessoas.nome_completo : 'Desconhecido'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="hubAtualizarPapelEquipe('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted); font-size: 12px;">${parentName}</td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="hubRemoverMembroEquipe('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;"""

content = content.replace(old_tr, new_tr)
content = content.replace(".select('id, perfil, pessoas(nome_completo)')", ".select('id, perfil, parent_vinculo_id, pessoas(nome_completo)')")

# Update Responde A select
old_carregar_lista = """    data.forEach(v => {"""
new_carregar_lista = """    
    const selResponde = document.getElementById('hubEqRespondeA');
    if (selResponde) {
        selResponde.innerHTML = '<option value="">Ninguém (Nó Principal)</option>';
        data.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.pessoas ? v.pessoas.nome_completo : 'Desconhecido';
            selResponde.appendChild(opt);
        });
    }

    data.forEach(v => {"""
content = content.replace(old_carregar_lista, new_carregar_lista)

# Update Insert
old_insert = """        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: estruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: null
        });"""
new_insert = """
        const respondeA = document.getElementById('hubEqRespondeA').value || null;
        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: estruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: respondeA
        });"""
content = content.replace(old_insert, new_insert)

with open(filepath, 'w') as f:
    f.write(content)
print("hub.js patched")
