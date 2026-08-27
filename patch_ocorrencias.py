import re

with open('familias.js', 'r') as f:
    js = f.read()

# 1. Refactor excluirOcorrenciaAss
old_excluir_oc = r"window\.excluirOcorrenciaAss = async function\(id\) \{\s*if\(!confirm\(\"Deseja realmente excluir esta ocorrência do livro\?\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_ocorrencias'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*carregarListaOcorrencias\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir ocorrência\.'\);\s*\}\s*\};"
new_excluir_oc = """window.excluirOcorrenciaAss = function(id) {
    if (typeof mostrarModalConfirmacaoFamilias !== 'function') {
        if(!confirm("Deseja realmente excluir esta ocorrência do livro?")) return;
        db.from('ass_ocorrencias').delete().eq('id', id).then(() => carregarListaOcorrencias());
        return;
    }
    mostrarModalConfirmacaoFamilias(
        'Excluir Ocorrência',
        'Deseja realmente excluir esta ocorrência do livro?',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_ocorrencias').delete().eq('id', id);
            if (error) throw error;
            carregarListaOcorrencias();
        }
    );
};"""

js = re.sub(old_excluir_oc, new_excluir_oc, js)


# 2. Refactor excluirFamiliaAss
# Wait, let's just do text replacement for the block
match = re.search(r"window\.excluirFamiliaAss = async function\(id\) \{.*?(?=window\.[a-zA-Z]+ =|$)", js, re.DOTALL)
if match:
    new_excluir_fam = """window.excluirFamiliaAss = function(id) {
    if (typeof mostrarModalConfirmacaoFamilias !== 'function') {
        if(!confirm("Tem certeza que deseja excluir esta Família? Se houver entregas registradas, não será possível.")) return;
        db.from('ass_familias').delete().eq('id', id).then(() => { fecharModalFamilia(); window.renderListaFamiliasWeb(); });
        return;
    }
    mostrarModalConfirmacaoFamilias(
        'Excluir Família Legado',
        'Tem certeza que deseja excluir esta Família Legado? Se houver entregas registradas, não será possível excluí-la.',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_familias').delete().eq('id', id);
            if (error) throw error;
            fecharModalFamilia();
            window.renderListaFamiliasWeb();
        }
    );
};
"""
    js = js.replace(match.group(0), new_excluir_fam)

with open('familias.js', 'w') as f:
    f.write(js)
