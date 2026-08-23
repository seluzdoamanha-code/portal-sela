import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

# Add Celular tab to nav
old_tabs = """<div class="admin-tab" onclick="switchTab('associados')">🤝 Associados</div>"""
new_tabs = """<div class="admin-tab" onclick="switchTab('associados')">🤝 Associados</div>
                        <div class="admin-tab" onclick="switchTab('celular')">📱 Celular</div>"""
content = content.replace(old_tabs, new_tabs)

# Add Celular content div
celular_div = """
                <div id="tab-celular" class="tab-content">
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        
                        <!-- Card do Celular -->
                        <div style="background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 24px; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <h3 style="color: #22c55e; margin: 0 0 4px 0; font-size: 20px;">📱 (47) 99211-3498</h3>
                                <span style="color: var(--text-muted); font-size: 14px;">Plano Vivo - Créditos e Validade</span>
                            </div>
                            <div id="celularStatusAlert" style="display: none; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                🚨 Vencimento Próximo!
                            </div>
                        </div>

                        <!-- Form para Novo Registro -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                            <h4 style="margin: 0 0 16px 0; color: var(--text-main);">➕ Registrar Nova Recarga</h4>
                            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Data da Recarga</label>
                                    <input type="date" id="celularData" class="form-control" style="width: 100%;">
                                </div>
                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Prazo (Dias)</label>
                                    <input type="number" id="celularPrazo" class="form-control" value="180" style="width: 100%;">
                                </div>
                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Valor (R$)</label>
                                    <input type="number" step="0.01" id="celularValor" class="form-control" placeholder="0.00" style="width: 100%;">
                                </div>
                                <div style="display: flex; align-items: flex-end;">
                                    <button onclick="salvarRecargaCelular()" class="btn btn-primary" style="height: 38px; padding: 0 24px;">Salvar</button>
                                </div>
                            </div>
                        </div>

                        <!-- Tabela de Histórico -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <thead>
                                    <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Data Adicionado</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Prazo</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Valor (R$)</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Vencimento Previsto</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabelaCelularHistorico">
                                    <!-- Injetado via JS -->
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
"""

content = content.replace('<!-- Conteúdos das Abas -->', '<!-- Conteúdos das Abas -->\n' + celular_div)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html updated")
