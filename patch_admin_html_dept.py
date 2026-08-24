import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

old_dept = """                <div id="tab-departamentos" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Organograma e Departamentos</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""

new_dept = """                <div id="tab-departamentos" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🏢 Departamentos</h3>
                    <div id="gridDepartamentos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Departamentos...</div>
                    </div>
                </div>"""

if old_dept in content:
    content = content.replace(old_dept, new_dept)
    with open(filepath, 'w') as f:
        f.write(content)
    print("admin.html tab-departamentos patched")
else:
    print("old_dept not found in admin.html")

