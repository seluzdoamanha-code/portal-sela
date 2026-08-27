import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. Update salvarUsuarioAutorizado
old_salvar = r"const nivel = document\.getElementById\('bdUserNivel'\)\.value;"
new_salvar = """const checkboxes = document.querySelectorAll('.nivel-checkbox:checked');
    const niveis = Array.from(checkboxes).map(cb => cb.value);
    if (niveis.length === 0) {
        alert("Selecione pelo menos um nível de acesso.");
        return;
    }
    const nivel = niveis.join(',');"""

js = re.sub(old_salvar, new_salvar, js)

# 2. Update render in carregarUsuariosAutorizados
old_render = r"<td style=\"padding: 12px 16px;\"><span style=\"font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: \$\{u\.nivel_acesso === 'admin' \? 'rgba\(236,72,153,0\.1\)' : 'rgba\(56,189,248,0\.1\)'\}; color: \$\{u\.nivel_acesso === 'admin' \? '#ec4899' : '#38bdf8'\}; text-transform: uppercase;\">\$\{u\.nivel_acesso\}</span></td>"

new_render = """<td style="padding: 12px 16px;">
                        ${(u.nivel_acesso || 'comum').split(',').map(n => {
                            let bg = 'rgba(56,189,248,0.1)'; let col = '#38bdf8';
                            if (n === 'admin') { bg = 'rgba(236,72,153,0.1)'; col = '#ec4899'; }
                            if (n === 'admin_global') { bg = 'rgba(239,68,68,0.1)'; col = '#ef4444'; }
                            if (n === 'tesouraria') { bg = 'rgba(16,185,129,0.1)'; col = '#10b981'; }
                            if (n === 'assistencia') { bg = 'rgba(245,158,11,0.1)'; col = '#f59e0b'; }
                            if (n === 'secretaria') { bg = 'rgba(139,92,246,0.1)'; col = '#8b5cf6'; }
                            if (n === 'diretor') { bg = 'rgba(234,179,8,0.1)'; col = '#eab308'; }
                            return `<span style="font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: ${bg}; color: ${col}; text-transform: uppercase; margin-right: 4px; display: inline-block; margin-bottom: 4px;">${n}</span>`;
                        }).join('')}
                    </td>"""

js = js.replace("<td style=\"padding: 12px 16px;\"><span style=\"font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: ${u.nivel_acesso === 'admin' ? 'rgba(236,72,153,0.1)' : 'rgba(56,189,248,0.1)'}; color: ${u.nivel_acesso === 'admin' ? '#ec4899' : '#38bdf8'}; text-transform: uppercase;\">${u.nivel_acesso}</span></td>", new_render)

with open('admin.js', 'w') as f:
    f.write(js)
