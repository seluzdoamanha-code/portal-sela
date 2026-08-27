import re

with open('admin.html', 'r') as f:
    html = f.read()

# Replace <div id="tab-bd" class="tab-content"> block
old_tab_bd = r"<div id=\"tab-bd\" class=\"tab-content\">\s*<div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;\">\s*<h3 style=\"color: var\(--text-main\); margin: 0;\">🗄️ Tabelas do Sistema \(Registros\)</h3>\s*<button onclick=\"carregarEstatisticasBD\(\)\" class=\"btn btn-secondary\" style=\"height: 32px; font-size: 13px;\">🔄 Atualizar Dados</button>\s*</div>\s*<div id=\"gridBancoDados\" style=\"display: grid; grid-template-columns: repeat\(auto-fill, minmax\(220px, 1fr\)\); gap: 16px;\">\s*<div style=\"color: var\(--text-muted\); grid-column: 1 / -1; text-align: center; padding: 40px;\">Carregando tabelas\.\.\.</div>\s*</div>\s*</div>"

new_tab_bd = """<div id="tab-bd" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🗄️ Banco de Dados e Acessos</h3>
                    
                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('bd', 'tabelas')" class="btn btn-bd-tabelas active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Tabelas & Registros</button>
                        <button onclick="switchSubTab('bd', 'usuarios')" class="btn btn-bd-usuarios" style="flex: 1; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Usuários Autorizados</button>
                    </div>

                    <div id="subtab-bd-tabelas" class="subtab-content bd-subtab active" style="display: block;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="color: var(--text-main); margin: 0;">Tabelas do Sistema (Registros)</h3>
                            <button onclick="carregarEstatisticasBD()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🔄 Atualizar Dados</button>
                        </div>
                        
                        <div id="gridBancoDados" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                            <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando tabelas...</div>
                        </div>
                    </div>

                    <div id="subtab-bd-usuarios" class="subtab-content bd-subtab" style="display: none;">
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                            <h4 style="margin: 0 0 16px 0; color: var(--text-main);">Cadastrar Usuário Autorizado</h4>
                            <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;">
                                <div style="flex: 2; min-width: 250px;">
                                    <label style="display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Nome</label>
                                    <input type="text" id="bdUserNome" class="form-control" placeholder="Nome completo" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 10px; border-radius: 8px;">
                                </div>
                                <div style="flex: 2; min-width: 200px;">
                                    <label style="display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">E-mail</label>
                                    <input type="email" id="bdUserEmail" class="form-control" placeholder="usuario@exemplo.com" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 10px; border-radius: 8px;">
                                </div>
                                <div style="flex: 1; min-width: 150px;">
                                    <label style="display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Nível de Acesso</label>
                                    <select id="bdUserNivel" class="form-control" style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 10px; border-radius: 8px;">
                                        <option value="comum">Comum</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div style="flex: 0;">
                                    <button onclick="salvarUsuarioAutorizado()" class="btn btn-primary" style="height: 41px; padding: 0 24px; white-space: nowrap;">Adicionar</button>
                                </div>
                            </div>
                        </div>

                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);">
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Nome</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">E-mail</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Nível</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Criado em</th>
                                        <th style="padding: 12px 16px; color: var(--text-muted); font-weight: 500;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabelaUsuariosAutorizados">
                                    <tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Carregando usuários...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>"""

html = re.sub(old_tab_bd, new_tab_bd, html)

with open('admin.html', 'w') as f:
    f.write(html)
