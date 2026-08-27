import re

with open('app.js', 'r') as f:
    js = f.read()

# 1. Update setupModal() btnNovaPessoa
old_btn = r"const btnNovo = document\.getElementById\('btnNovaPessoa'\);\s*if \(typeof window\.podeEditarPessoas === 'function' && !window\.podeEditarPessoas\(\)\) \{\s*if \(btnNovo\) btnNovo\.style\.display = 'none';\s*\}"

new_btn = """const btnNovo = document.getElementById('btnNovaPessoa');
    if (typeof window.podeEditarPessoas === 'function' && !window.podeEditarPessoas()) {
        if (btnNovo) {
            btnNovo.disabled = true;
            btnNovo.style.background = 'rgba(255,255,255,0.05)';
            btnNovo.style.color = 'var(--text-muted)';
            btnNovo.style.border = '1px solid var(--border)';
            btnNovo.style.cursor = 'not-allowed';
            btnNovo.title = 'Acesso restrito';
            // Previne clique caso o disabled falhe em algum navegador
            btnNovo.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
        }
    }"""

js = re.sub(old_btn, new_btn, js)

# 2. Update renderizarTabela() action buttons
old_table_actions = r"\$\(typeof window\.podeEditarPessoas === 'function' && window\.podeEditarPessoas\(\)\) \? `\s*<button onclick=\"editarPessoa\('\$\{pessoa\.id\}'\)\" style=\"background: rgba\(255,255,255,0\.05\); color: var\(--text-main\); border: 1px solid var\(--border\); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0\.2s; white-space: nowrap;\" onmouseover=\"this\.style\.background='rgba\(255,255,255,0\.1\)'\" onmouseout=\"this\.style\.background='rgba\(255,255,255,0\.05\)'\">\s*Editar\s*</button>\s*<button onclick=\"excluirPessoa\('\$\{pessoa\.id\}'\)\" style=\"background: rgba\(239,68,68,0\.1\); color: #ef4444; border: 1px solid rgba\(239,68,68,0\.3\); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0\.2s; white-space: nowrap;\" onmouseover=\"this\.style\.background='rgba\(239,68,68,0\.2\)'\" onmouseout=\"this\.style\.background='rgba\(239,68,68,0\.1\)'\">\s*Excluir\s*</button>\s*` : ''\}"

new_table_actions = """(typeof window.podeEditarPessoas === 'function' && window.podeEditarPessoas()) ? `
                        <button onclick="editarPessoa('${pessoa.id}')" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            Editar
                        </button>
                        <button onclick="excluirPessoa('${pessoa.id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                            Excluir
                        </button>
                        ` : `
                        <button disabled title="Acesso restrito" style="background: rgba(255,255,255,0.02); color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: not-allowed; white-space: nowrap; opacity: 0.5;">
                            Editar
                        </button>
                        <button disabled title="Acesso restrito" style="background: rgba(255,255,255,0.02); color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: not-allowed; white-space: nowrap; opacity: 0.5;">
                            Excluir
                        </button>
                        `"""

# I need to escape curly braces for python format or regex if used improperly, but re.sub uses string directly for the replacement
# However, the target string has \$ and \{ which must be unescaped for the replacement block.
# Actually I will just replace using standard string replace because regex with all these characters is brittle.

with open('update_rbac.py', 'w') as f:
    pass

