import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath, 'r') as f:
    content = f.read()

# Departamentos
old_dept = """                <div id="tab-departamentos" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Estrutura de Departamentos</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""

new_dept = """                <div id="tab-departamentos" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">🏢 Departamentos</h3>
                    <div id="gridDepartamentos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Departamentos...</div>
                    </div>
                </div>"""

content = content.replace(old_dept, new_dept)

# Atividades
old_ativ = """                <div id="tab-atividades" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Gestão de Atividades Regulares</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""

new_ativ = """                <div id="tab-atividades" class="tab-content">
                    <h3 style="color: var(--text-main); margin-bottom: 16px;">📅 Atividades Regulares</h3>
                    <div id="gridAtividades" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando Atividades...</div>
                    </div>
                </div>"""

content = content.replace(old_ativ, new_ativ)

# Modal Genérico de Gestão de Equipe Plana
modal_equipe = """
    <!-- Modal Gestão Plana de Equipes -->
    <div class="modal-overlay" id="modalEquipePlana">
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <h2 id="modalEquipePlanaTitle" style="margin: 0; font-size: 18px;">Gestão de Equipe</h2>
                    <div id="modalEquipePlanaSub" style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Carregando...</div>
                </div>
                <button onclick="fecharModalEquipePlana()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 20px;">×</button>
            </div>
            
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-main);">Adicionar Membro</h4>
                <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 2; min-width: 200px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Buscar Pessoa</label>
                        <input type="text" id="eqBuscaPessoa" class="form-control" placeholder="Digite o nome..." autocomplete="off">
                        <input type="hidden" id="eqPessoaId">
                        <div id="eqSugestoes" style="display:none; position: absolute; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 250px;"></div>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Papel / Função</label>
                        <input type="text" id="eqPapel" class="form-control" placeholder="Ex: Colaborador" list="listaPapeisComuns">
                        <datalist id="listaPapeisComuns">
                            <option value="Diretor(a)">
                            <option value="Vice-Diretor(a)">
                            <option value="Coordenador(a)">
                            <option value="Colaborador(a)">
                            <option value="Voluntário(a)">
                            <option value="Apoio">
                        </datalist>
                    </div>
                    <div>
                        <button onclick="adicionarMembroEquipePlana()" class="btn btn-primary" style="height: 38px;">Adicionar</button>
                    </div>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; min-height: 200px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                            <th style="padding: 8px;">Nome</th>
                            <th style="padding: 8px;">Papel na Equipe</th>
                            <th style="padding: 8px; text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="eqListaMembros">
                        <tr><td colspan="3" style="text-align: center; padding: 16px; color: var(--text-muted);">Carregando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
"""

# Insert modal before closing body
content = content.replace("</body>", modal_equipe + "\n</body>")

with open(filepath, 'w') as f:
    f.write(content)
print("admin.html patched for Departamentos and Atividades")
