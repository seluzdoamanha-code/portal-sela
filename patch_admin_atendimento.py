import re

with open('admin.html', 'r') as f:
    html = f.read()

old_miniapps_subtabs = r"<div class=\"admin-subtabs\" style=\"display: flex; gap: 8px; margin-bottom: 24px;\">\s*<button onclick=\"switchSubTab\('miniapps', 'irradiacao'\)\" class=\"btn btn-miniapps-irradiacao active\" style=\"flex: 1; background: var\(--primary\); color: white; border: none; border-radius: 8px; padding: 10px;\">Irradiação</button>\s*</div>"
new_miniapps_subtabs = """<div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('miniapps', 'irradiacao')" class="btn btn-miniapps-irradiacao active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Irradiação</button>
                        <button onclick="switchSubTab('miniapps', 'atendimento')" class="btn btn-miniapps-atendimento" style="flex: 1; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Atendimento Espiritual</button>
                    </div>"""

html = re.sub(old_miniapps_subtabs, new_miniapps_subtabs, html)

old_irradiacao_content = r"<div id=\"subtab-miniapps-irradiacao\" class=\"subtab-content miniapps-subtab active\" style=\"display: block;\">\s*<div id=\"containerEstatMiniAppIrradiacao\" style=\"color: var\(--text-muted\); text-align: center; padding: 40px;\">Carregando estatísticas\.\.\.</div>\s*</div>"
new_irradiacao_content = """<div id="subtab-miniapps-irradiacao" class="subtab-content miniapps-subtab active" style="display: block;">
                        <div id="containerEstatMiniAppIrradiacao" style="color: var(--text-muted); text-align: center; padding: 40px;">Carregando estatísticas...</div>
                    </div>
                    
                    <div id="subtab-miniapps-atendimento" class="subtab-content miniapps-subtab" style="display: none;">
                        <div id="containerEstatMiniAppAtendimento" style="color: var(--text-muted); text-align: center; padding: 40px;">Carregando estatísticas do Atendimento...</div>
                    </div>"""

html = re.sub(old_irradiacao_content, new_irradiacao_content, html)

with open('admin.html', 'w') as f:
    f.write(html)
