import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

# DEPARTAMENTOS
old_dept = """                <div id="tab-departamentos" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🏢 Departamentos</h3>
                    <div id="gridDepartamentos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Departamentos...</div>
                    </div>
                </div>"""

new_dept = """                <div id="tab-departamentos" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🏢 Departamentos</h3>
                    
                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('departamentos', 'cards')" class="btn btn-departamentos-cards active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Cards</button>
                        <button onclick="switchSubTab('departamentos', 'lista')" class="btn btn-departamentos-lista" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Lista</button>
                    </div>

                    <div id="subtab-departamentos-cards" class="subtab-content departamentos-subtab active" style="display: block;">
                        <div id="gridDepartamentos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                            <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Departamentos...</div>
                        </div>
                    </div>
                    
                    <div id="subtab-departamentos-lista" class="subtab-content departamentos-subtab" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista de Pessoas por Departamento</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaDepartamentos" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaDepartamentos()">
                                    <option value="todos">Todos os Departamentos</option>
                                </select>
                                <button onclick="imprimirListaDepartamentos()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Departamento (Vínculo)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaDepartamentos">
                                    <tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>"""

# ATIVIDADES
old_ativ = """                <div id="tab-atividades" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">📅 Atividades Regulares</h3>
                    <div id="gridAtividades" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Atividades...</div>
                    </div>
                </div>"""

new_ativ = """                <div id="tab-atividades" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">📅 Atividades Regulares</h3>
                    
                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('atividades', 'cards')" class="btn btn-atividades-cards active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Cards</button>
                        <button onclick="switchSubTab('atividades', 'lista')" class="btn btn-atividades-lista" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Lista</button>
                    </div>

                    <div id="subtab-atividades-cards" class="subtab-content atividades-subtab active" style="display: block;">
                        <div id="gridAtividades" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                            <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Atividades...</div>
                        </div>
                    </div>
                    
                    <div id="subtab-atividades-lista" class="subtab-content atividades-subtab" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista de Pessoas por Atividade</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaAtividades" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaAtividades()">
                                    <option value="todos">Todas as Atividades</option>
                                </select>
                                <button onclick="imprimirListaAtividades()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Atividade (Vínculo)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaAtividades">
                                    <tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>"""

if old_dept in content and old_ativ in content:
    content = content.replace(old_dept, new_dept).replace(old_ativ, new_ativ)
    with open(filepath, 'w') as f:
        f.write(content)
    print("HTML patched.")
else:
    print("Failed to find old HTML.")
