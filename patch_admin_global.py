import re

with open('admin.html', 'r') as f:
    html = f.read()

old_select = r"<option value=\"comum\">Comum</option>\s*<option value=\"admin\">Administrador</option>"
new_select = """<option value="comum">Comum</option>
                                        <option value="admin">Administrador</option>
                                        <option value="admin_global">Admin Global</option>"""

html = re.sub(old_select, new_select, html)

with open('admin.html', 'w') as f:
    f.write(html)

with open('admin.js', 'r') as f:
    js = f.read()

old_badge = r"<span style=\"font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: \$\{u\.nivel_acesso === 'admin' \? 'rgba\(236,72,153,0\.1\)' : 'rgba\(56,189,248,0\.1\)'\}; color: \$\{u\.nivel_acesso === 'admin' \? '#ec4899' : '#38bdf8'\}; text-transform: uppercase;\">\$\{u\.nivel_acesso\}</span>"

new_badge = """<span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; 
                        background: ${u.nivel_acesso === 'admin_global' ? 'var(--primary, #f97316)' : (u.nivel_acesso === 'admin' ? 'rgba(236,72,153,0.1)' : 'rgba(56,189,248,0.1)')}; 
                        color: ${u.nivel_acesso === 'admin_global' ? '#ffffff' : (u.nivel_acesso === 'admin' ? '#ec4899' : '#38bdf8')}; 
                        text-transform: uppercase;">
                        ${u.nivel_acesso}
                    </span>"""

js = js.replace(old_badge, new_badge)

with open('admin.js', 'w') as f:
    f.write(js)
