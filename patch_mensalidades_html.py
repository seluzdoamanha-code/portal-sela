import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

old_mensalidades = """                <div id="tab-mensalidades" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Controle de Mensalidades</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""

new_mensalidades = """                <div id="tab-mensalidades" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">💳 Gestão de Mensalidades (Associados Efetivos)</h3>
                    
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; color: var(--text-main);">Configurar Mensalidade</h4>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;">
                            <div style="flex: 2; min-width: 250px;">
                                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Selecione um associado</label>
                                <select id="mensalidadeAssociado" class="form-control" style="width: 100%;">
                                    <option value="">Carregando associados...</option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Valor R$:</label>
                                <input type="number" step="0.01" id="mensalidadeValor" class="form-control" placeholder="0.00" style="width: 100%;">
                            </div>
                            <div style="flex: 1; min-width: 100px;">
                                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Dia Venc.:</label>
                                <input type="number" id="mensalidadeDia" class="form-control" placeholder="Ex: 10" min="1" max="31" style="width: 100%;">
                            </div>
                            <div style="flex: 1; min-width: 120px;">
                                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Início (MM/AAAA):</label>
                                <input type="text" id="mensalidadeInicio" class="form-control" placeholder="01/2026" style="width: 100%;">
                            </div>
                            <div>
                                <button onclick="salvarConfigMensalidade()" class="btn btn-primary" style="height: 38px; padding: 0 24px;">Salvar Configuração</button>
                            </div>
                        </div>
                    </div>

                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
                                    <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Associado</th>
                                    <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Valor</th>
                                    <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Dia Venc.</th>
                                    <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Início</th>
                                    <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaMensalidadesConfig">
                                <tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Carregando configurações...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>"""

content = content.replace(old_mensalidades, new_mensalidades)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html mensalidades tab updated")
