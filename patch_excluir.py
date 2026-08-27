import re
with open('assistencia.js', 'r') as f:
    js = f.read()

old_func = r"window\.excluirEntregaAss = async function\(id\) \{\s*if\(!confirm\(\"Deseja realmente excluir esta entrega\? \(O sistema NÃO devolverá automaticamente o estoque dos itens, você precisará ajustar manualmente\)\.\"\)\) return;\s*try \{\s*const \{ error \} = await db\.from\('ass_entregas'\)\.delete\(\)\.eq\('id', id\);\s*if \(error\) throw error;\s*carregarListaEntregas\(\);\s*\} catch\(err\) \{\s*console\.error\(err\);\s*alert\('Erro ao excluir entrega\.'\);\s*\}\s*\};"

new_func = """window.excluirEntregaAss = function(id) {
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
        <h3 style="color: var(--text-main); margin: 0 0 12px 0; font-size: 18px;">Excluir Entrega</h3>
        <p style="color: var(--text-muted); margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
            Tem certeza que deseja excluir esta entrega?<br><br>
            <strong style="color: #ef4444;">Atenção:</strong> O sistema <b>NÃO</b> devolverá automaticamente o estoque dos itens. Você precisará ajustar manualmente no painel de Itens se for necessário.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
            <button id="btnCancelExcluir" class="btn" style="flex: 1;">Cancelar</button>
            <button id="btnConfirmExcluir" class="btn" style="background: #ef4444; color: #ffffff; border-color: #ef4444; flex: 1;">Sim, Excluir</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btnCancelExcluir').onclick = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('btnConfirmExcluir').onclick = async () => {
        const btn = document.getElementById('btnConfirmExcluir');
        btn.innerHTML = 'Excluindo...';
        btn.disabled = true;
        try {
            const { error } = await db.from('ass_entregas').delete().eq('id', id);
            if (error) throw error;
            document.body.removeChild(overlay);
            carregarListaEntregas();
        } catch(err) {
            console.error(err);
            alert('Erro ao excluir entrega.');
            btn.innerHTML = 'Tentar Novamente';
            btn.disabled = false;
        }
    };
};"""

js = re.sub(old_func, new_func, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
