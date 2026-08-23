import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

old_home = """                <div id="tab-home" class="tab-content active">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Visão Geral do Sistema</h3>
                        <p>Painel central de controle. Em breve terá gráficos e atalhos rápidos.</p>
                    </div>
                </div>"""

new_home = """                <div id="tab-home" class="tab-content active">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🏠 Painel Central</h3>
                    
                    <div id="homeDashContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
                        <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center; padding: 40px;">Carregando métricas principais...</div>
                    </div>
                </div>"""

content = content.replace(old_home, new_home)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html home tab updated")
