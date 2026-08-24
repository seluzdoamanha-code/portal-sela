import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.html'
with open(filepath, 'r') as f:
    content = f.read()

# Add button
old_btn = """                        <h3 style="color: var(--text-muted); margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Membros da Equipe</h3>"""
new_btn = """                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="color: var(--text-muted); margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Membros da Equipe</h3>
                            <button id="btnHubGerenciarEquipe" onclick="abrirHubModalEquipe()" class="btn btn-secondary" style="display: none; height: 32px; font-size: 12px;">⚙️ Gerenciar Equipe (Modo Lista)</button>
                        </div>"""
content = content.replace(old_btn, new_btn)

# Add Modal at bottom
modal_equipe = """
    <!-- Modal Gestão Plana de Equipes (HUB) -->
    <div class="modal-overlay" id="hubModalEquipePlana">
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px;">Gerenciar Membros da Equipe</h2>
                    <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Adicione ou remova pessoas do seu departamento</div>
                </div>
                <button onclick="fecharHubModalEquipe()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 20px;">×</button>
            </div>
            
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-main);">Adicionar Membro</h4>
                <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 2; min-width: 200px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Buscar Pessoa</label>
                        <input type="text" id="hubEqBuscaPessoa" class="form-control" placeholder="Digite o nome..." autocomplete="off">
                        <input type="hidden" id="hubEqPessoaId">
                        <div id="hubEqSugestoes" style="display:none; position: absolute; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 250px;"></div>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Papel / Função</label>
                        <input type="text" id="hubEqPapel" class="form-control" placeholder="Ex: Colaborador" list="listaPapeisComunsHub">
                        <datalist id="listaPapeisComunsHub">
                            <option value="Diretor(a)">
                            <option value="Vice-Diretor(a)">
                            <option value="Coordenador(a)">
                            <option value="Colaborador(a)">
                            <option value="Voluntário(a)">
                            <option value="Apoio">
                        </datalist>
                    </div>
                    <div>
                        <button onclick="hubAdicionarMembroEquipe()" class="btn btn-primary" style="height: 38px;">Adicionar</button>
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
                    <tbody id="hubEqListaMembros">
                        <tr><td colspan="3" style="text-align: center; padding: 16px; color: var(--text-muted);">Carregando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
"""

content = content.replace("</body>", modal_equipe + "\n</body>")

with open(filepath, 'w') as f:
    f.write(content)
print("hub.html patched")
