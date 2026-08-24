import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/m_organograma.js'
with open(filepath, 'r') as f:
    content = f.read()

old_excluir = """                    const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
                    if (error) throw error;"""

new_excluir = """                    // Busca o vínculo para pegar o pai dele
                    const { data: vinculo } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', id).single();
                    const parentId = vinculo ? vinculo.parent_vinculo_id : null;
                    
                    // Atualiza filhos deste nó para apontar para o pai dele
                    await db.from('vinculos_estrutura').update({ parent_vinculo_id: parentId }).eq('parent_vinculo_id', id);
                    
                    // Exclui
                    const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
                    if (error) throw error;"""

content = content.replace(old_excluir, new_excluir)

with open(filepath, 'w') as f:
    f.write(content)
print("m_organograma.js patched")
