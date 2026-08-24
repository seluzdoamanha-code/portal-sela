import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

old_pessoas_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-pessoas-dados" class="subtab-content pessoas-subtab" style="display: none;">
                        <div id="dash-pessoas-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando métricas...</div>
                        </div>
                    </div>"""

new_pessoas_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-pessoas-dados" class="subtab-content pessoas-subtab" style="display: none;">
                        <div id="dash-pessoas-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando métricas...</div>
                        </div>
                    </div>
                    
                    <!-- Conteúdo: Lista Global -->
                    <div id="subtab-pessoas-lista" class="subtab-content pessoas-subtab" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista Geral de Pessoas</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaGlobalPessoas" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaGlobalPessoas()">
                                    <option value="todos">Todos</option>
                                    <option value="Associado Efetivo">Associado Efetivo</option>
                                    <option value="Assistida + Assistido">Assistida + Assistido</option>
                                    <option value="Colaborador + Colaboradora">Colaborador + Colaboradora</option>
                                    <option value="Diretor + Diretora">Diretor + Diretora</option>
                                    <option value="Empresa Parceira">Empresa Parceira</option>
                                    <option value="Voluntária + Voluntário">Voluntária + Voluntário</option>
                                </select>
                                <button onclick="imprimirListaGlobalPessoas()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaGlobalPessoas">
                                    <tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>"""

if old_pessoas_dados in content:
    content = content.replace(old_pessoas_dados, new_pessoas_dados)
    with open(filepath, 'w') as f:
        f.write(content)
    print("SUCCESS: HTML injected.")
else:
    print("ERROR: old string not found.")
