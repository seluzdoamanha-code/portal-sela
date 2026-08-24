import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/organograma.js'
with open(filepath, 'r') as f:
    content = f.read()

old_excluir = """window.excluirVinculo = async (id) => {
    if (!confirm("Tem certeza que deseja remover esta pessoa da árvore?")) return;
    
    try {
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
        if (error) throw error;
        
        carregarArvore(); // Recarrega o D3
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir. Tente novamente.');
    }
};"""

new_excluir = """window.excluirVinculo = async (id) => {
    if (!confirm("Tem certeza que deseja remover esta pessoa da árvore? Membros abaixo dela serão realocados para cima.")) return;
    
    try {
        // Busca o vínculo para pegar o pai dele
        const { data: vinculo } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', id).single();
        const parentId = vinculo ? vinculo.parent_vinculo_id : null;
        
        // Atualiza filhos deste nó para apontar para o pai dele (ou null se for raiz)
        await db.from('vinculos_estrutura').update({ parent_vinculo_id: parentId }).eq('parent_vinculo_id', id);
        
        // Agora exclui o vínculo de forma segura
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
        if (error) throw error;
        
        carregarArvore(); // Recarrega o D3
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir. Tente novamente.');
    }
};"""

content = content.replace(old_excluir, new_excluir)

with open(filepath, 'w') as f:
    f.write(content)
print("organograma.js patched")
