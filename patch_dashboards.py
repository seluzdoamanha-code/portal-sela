import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

dashboard_template = """
                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('{target}', 'perfil')" class="btn btn-{target}-perfil active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Cards Perfil</button>
                        <button onclick="switchSubTab('{target}', 'dados')" class="btn btn-{target}-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                    </div>

                    <!-- Cards Perfil -->
                    <div id="subtab-{target}-perfil" class="subtab-content {target}-subtab active" style="display: block;">
                        <div id="dash-{target}-perfil-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando métricas...</div>
                        </div>
                    </div>

                    <!-- Cards Dados -->
                    <div id="subtab-{target}-dados" class="subtab-content {target}-subtab" style="display: none;">
                        <div id="dash-{target}-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando métricas...</div>
                        </div>
                    </div>
"""

# Replace Associados
old_associados = """                <div id="tab-associados" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Gestão de Associados</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""
new_associados = f"""                <div id="tab-associados" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🤝 Dashboard de Associados</h3>
{dashboard_template.replace('{target}', 'associados')}
                </div>"""
content = content.replace(old_associados, new_associados)


# Replace Pessoas
old_pessoas = """                <div id="tab-pessoas" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Base Global de Pessoas</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""
new_pessoas = f"""                <div id="tab-pessoas" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">👥 Dashboard Global de Pessoas</h3>
{dashboard_template.replace('{target}', 'pessoas')}
                </div>"""
content = content.replace(old_pessoas, new_pessoas)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html patched for dashboards")
