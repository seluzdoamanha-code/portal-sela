import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove from pessoas tab
old_pessoas_btn = """                        <button onclick="switchSubTab('pessoas', 'dados')" class="btn btn-pessoas-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                        <button onclick="switchSubTab('pessoas', 'lista')" class="btn btn-pessoas-lista" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Lista</button>
                    </div>"""
new_pessoas_btn = """                        <button onclick="switchSubTab('pessoas', 'dados')" class="btn btn-pessoas-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                    </div>"""
content = content.replace(old_pessoas_btn, new_pessoas_btn)

old_pessoas_list = """                    <!-- Conteúdo: Lista -->
                    <div id="pessoas-lista" class="subtab-content" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista de Pessoas</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaPessoas" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaAssociados()">
                                    <option value="todos">Todos</option>
                                    <option value="associados" selected>Associados Efetivos</option>
                                </select>
                                <button onclick="imprimirListaPessoas()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaPessoas">
                                    <tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>"""
content = content.replace(old_pessoas_list, "")


# 2. Add to associados tab
old_assoc_btn = """                        <button onclick="switchSubTab('associados', 'dados')" class="btn btn-associados-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                    </div>"""
new_assoc_btn = """                        <button onclick="switchSubTab('associados', 'dados')" class="btn btn-associados-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                        <button onclick="switchSubTab('associados', 'lista')" class="btn btn-associados-lista" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Lista</button>
                    </div>"""
content = content.replace(old_assoc_btn, new_assoc_btn)

old_assoc_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-associados-dados" class="subtab-content associados-subtab" style="display: none;">
                        <div id="dash-associados-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando dados...</div>
                        </div>
                    </div>"""
new_assoc_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-associados-dados" class="subtab-content associados-subtab" style="display: none;">
                        <div id="dash-associados-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando dados...</div>
                        </div>
                    </div>
                    
                    <!-- Conteúdo: Lista -->
                    <div id="subtab-associados-lista" class="subtab-content associados-subtab" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista de Pessoas</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaPessoas" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaAssociados()">
                                    <option value="todos">Todos</option>
                                    <option value="associados" selected>Associados Efetivos</option>
                                </select>
                                <button onclick="imprimirListaPessoas()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaPessoas">
                                    <tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>"""
content = content.replace(old_assoc_dados, new_assoc_dados)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html patched")
