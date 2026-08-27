import re

with open('familias.js', 'r') as f:
    js = f.read()

# 1. Inject the generic confirm modal at the top or bottom of familias.js
generic_modal = """
window.mostrarModalConfirmacaoFamilias = function(titulo, mensagem, textoBotaoConfirmar, acaoConfirmar) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.6)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';

    const modal = document.createElement('div');
    modal.style.background = 'var(--bg-panel)';
    modal.style.padding = '24px';
    modal.style.borderRadius = '12px';
    modal.style.width = '400px';
    modal.style.maxWidth = '90%';
    modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    modal.style.border = '1px solid var(--border)';
    modal.style.textAlign = 'center';

    modal.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 16px;">🗑️</div>
        <h3 style="color: var(--text-main); margin: 0 0 12px 0; font-size: 18px;">${titulo}</h3>
        <p style="color: var(--text-muted); margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
            ${mensagem}
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
            <button id="btnCancelExcluirFam" class="btn" style="flex: 1;">Cancelar</button>
            <button id="btnConfirmExcluirFam" class="btn" style="background: #ef4444; color: #ffffff; border-color: #ef4444; flex: 1;">${textoBotaoConfirmar}</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btnCancelExcluirFam').onclick = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('btnConfirmExcluirFam').onclick = async () => {
        const btn = document.getElementById('btnConfirmExcluirFam');
        btn.innerHTML = 'Processando...';
        btn.disabled = true;
        try {
            await acaoConfirmar();
            document.body.removeChild(overlay);
        } catch(err) {
            console.error(err);
            alert('Erro na operação.');
            btn.innerHTML = 'Tentar Novamente';
            btn.disabled = false;
        }
    };
};
"""

js += "\n\n" + generic_modal

# 2. Refactor excluirOcorrenciaAss
old_excluir_oc = r"window\.excluirOcorrenciaAss = async function\(id\) \{\s*if\(!confirm\(\"Deseja realmente excluir esta ocorrência do livro\?\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_ocorrencias'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*carregarOcorrenciasAss\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir ocorrência\.'\);\s*\}\s*\};"
new_excluir_oc = """window.excluirOcorrenciaAss = function(id) {
    mostrarModalConfirmacaoFamilias(
        'Excluir Ocorrência',
        'Deseja realmente excluir esta ocorrência do livro?',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_ocorrencias').delete().eq('id', id);
            if (error) throw error;
            carregarOcorrenciasAss();
        }
    );
};"""
js = re.sub(old_excluir_oc, new_excluir_oc, js)

# 3. Refactor excluirFamiliaAss
old_excluir_fam = r"window\.excluirFamiliaAss = async function\(id\) \{\s*if\(!confirm\(\"Tem certeza que deseja excluir esta Família\? Se houver entregas registradas, não será possível\.\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_familias'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*fecharModalFamilia\(\);\s*window\.renderListaFamiliasWeb\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir família\. Verifique se há dependências\.'\);\s*\}\s*\};"
new_excluir_fam = """window.excluirFamiliaAss = function(id) {
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
};"""
js = re.sub(old_excluir_fam, new_excluir_fam, js)

with open('familias.js', 'w') as f:
    f.write(js)
