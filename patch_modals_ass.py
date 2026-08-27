import re

with open('assistencia.js', 'r') as f:
    js = f.read()

# 1. Inject the generic confirm modal at the top or bottom of assistencia.js
generic_modal = """
window.mostrarModalConfirmacaoAss = function(titulo, mensagem, textoBotaoConfirmar, acaoConfirmar) {
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
            <button id="btnCancelExcluirAss" class="btn" style="flex: 1;">Cancelar</button>
            <button id="btnConfirmExcluirAss" class="btn" style="background: #ef4444; color: #ffffff; border-color: #ef4444; flex: 1;">${textoBotaoConfirmar}</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btnCancelExcluirAss').onclick = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('btnConfirmExcluirAss').onclick = async () => {
        const btn = document.getElementById('btnConfirmExcluirAss');
        btn.innerHTML = 'Excluindo...';
        btn.disabled = true;
        try {
            await acaoConfirmar();
            document.body.removeChild(overlay);
        } catch(err) {
            console.error(err);
            alert('Erro ao excluir.');
            btn.innerHTML = 'Tentar Novamente';
            btn.disabled = false;
        }
    };
};

"""
# Append generic modal logic to end of file
js += "\n\n" + generic_modal

# 2. Refactor excluirEntregaAss
old_excluir_entrega = r"window\.excluirEntregaAss = function\(id\) \{.*?(?=window\.excluirEntregaAss|$)"
# Since I replaced it before, I will find the exact block using regex.
import re
match = re.search(r"window\.excluirEntregaAss = function\(id\) \{.*?(?=window\.excluirItemAss|window\.[a-zA-Z]+ =|$)", js, re.DOTALL)
if match:
    new_excluir_entrega = """window.excluirEntregaAss = function(id) {
    mostrarModalConfirmacaoAss(
        'Excluir Entrega',
        'Tem certeza que deseja excluir esta entrega?<br><br><strong style="color: #ef4444;">Atenção:</strong> O sistema <b>NÃO</b> devolverá automaticamente o estoque dos itens. Você precisará ajustar manualmente no painel de Itens se for necessário.',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_entregas').delete().eq('id', id);
            if (error) throw error;
            carregarListaEntregas();
        }
    );
};
"""
    js = js.replace(match.group(0), new_excluir_entrega)

# 3. Refactor excluirItemAss
old_excluir_item = r"window\.excluirItemAss = async function\(id\) \{\s*if\(!confirm\(\"Tem certeza que deseja excluir este item\? Ele será removido de todas as composições de cestas\.\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_itens_cesta'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*carregarItens\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir item\.'\);\s*\}\s*\};"
new_excluir_item = """window.excluirItemAss = function(id) {
    mostrarModalConfirmacaoAss(
        'Excluir Item',
        'Tem certeza que deseja excluir este item? Ele será removido de todas as composições de cestas.',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_itens_cesta').delete().eq('id', id);
            if (error) throw error;
            carregarItens();
        }
    );
};"""
js = re.sub(old_excluir_item, new_excluir_item, js)


# 4. Refactor excluirCestaAss
old_excluir_cesta = r"window\.excluirCestaAss = async function\(id\) \{\s*if\(!confirm\(\"Tem certeza que deseja excluir este modelo de cesta\? Isso apagará sua composição também\.\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_cestas_modelos'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*carregarCestas\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir cesta\.'\);\s*\}\s*\};"
new_excluir_cesta = """window.excluirCestaAss = function(id) {
    mostrarModalConfirmacaoAss(
        'Excluir Cesta',
        'Tem certeza que deseja excluir este modelo de cesta? Isso apagará sua composição também.',
        'Sim, Excluir',
        async () => {
            const { error } = await db.from('ass_cestas_modelos').delete().eq('id', id);
            if (error) throw error;
            carregarCestas();
        }
    );
};"""
js = re.sub(old_excluir_cesta, new_excluir_cesta, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
