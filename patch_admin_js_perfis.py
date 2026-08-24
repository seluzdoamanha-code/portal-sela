import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update the select in inicializarBuscaPessoasEquipe to include perfis
old_select = """const { data } = await db.from('pessoas').select('id, nome_completo');"""
new_select = """const { data } = await db.from('pessoas').select('id, nome_completo, perfis');"""
content = content.replace(old_select, new_select)

# 2. Update the div.onclick
old_onclick = """                div.onclick = () => {
                    input.value = p.nome_completo;
                    document.getElementById('eqPessoaId').value = p.id;
                    sugestoes.style.display = 'none';
                };"""
new_onclick = """                div.onclick = () => {
                    input.value = p.nome_completo;
                    document.getElementById('eqPessoaId').value = p.id;
                    sugestoes.style.display = 'none';
                    
                    // Atualiza o datalist com os perfis da pessoa
                    const list = document.getElementById('listaPapeisComuns');
                    if (list) {
                        list.innerHTML = '';
                        let arr = [];
                        if (Array.isArray(p.perfis)) {
                            arr = p.perfis;
                        } else if (typeof p.perfis === 'string') {
                            arr = p.perfis.split(',').map(s => s.trim());
                        }
                        arr.forEach(perf => {
                            if (perf) {
                                const opt = document.createElement('option');
                                opt.value = perf;
                                list.appendChild(opt);
                            }
                        });
                        
                        // Limpar o input se ele não estiver na nova lista
                        const eqPapel = document.getElementById('eqPapel');
                        if (eqPapel) eqPapel.value = '';
                    }
                };"""
content = content.replace(old_onclick, new_onclick)

# 3. Remove global carregarListaPerfisDatalist
old_modal_start = """async function carregarListaPerfisDatalist() {
    try {
        const { data, error } = await db.from('configuracoes').select('valor').eq('chave', 'opcoes_perfis').single();
        if (data && data.valor) {
            const list = document.getElementById('listaPapeisComuns');
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
    } catch (e) {
        console.warn("Erro ao carregar opcoes de perfil", e);
    }
}

window.abrirModalEquipePlana = async function(id, nome, tipo) {
    carregarListaPerfisDatalist();"""
new_modal_start = """
window.abrirModalEquipePlana = async function(id, nome, tipo) {
"""
content = content.replace(old_modal_start, new_modal_start)

# 4. Clean input on modal open to ensure it is empty
old_modal_style = """    document.getElementById('modalEquipePlana').style.display = 'flex';"""
new_modal_style = """    document.getElementById('modalEquipePlana').style.display = 'flex';
    document.getElementById('eqBuscaPessoa').value = '';
    document.getElementById('eqPessoaId').value = '';
    document.getElementById('eqPapel').value = '';
    const list = document.getElementById('listaPapeisComuns');
    if (list) list.innerHTML = '';"""
content = content.replace(old_modal_style, new_modal_style)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js perfis dinâmicos patched")
