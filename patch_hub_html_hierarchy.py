import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.html'
with open(filepath, 'r') as f:
    content = f.read()

# Replace Papel/Função with Perfil and add Responde A
old_modal = """                    <div style="flex: 1; min-width: 120px;">
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
                    </div>"""

new_modal = """                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Perfil</label>
                        <input type="text" id="hubEqPapel" class="form-control" placeholder="Selecione ou digite..." list="listaPapeisComunsHub">
                        <datalist id="listaPapeisComunsHub">
                            <!-- Carregado dinamicamente -->
                        </datalist>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="font-size: 11px; color: var(--text-muted);">Responde a (Chefe Direto)</label>
                        <select id="hubEqRespondeA" class="form-control" style="width: 100%;">
                            <option value="">Ninguém (Nó Principal)</option>
                        </select>
                    </div>
                    <div>
                        <button onclick="hubAdicionarMembroEquipe()" class="btn btn-primary" style="height: 38px;">Adicionar</button>
                    </div>"""

content = content.replace(old_modal, new_modal)

# Also update the table headers
old_th = """                            <th style="padding: 8px;">Papel na Equipe</th>
                            <th style="padding: 8px; text-align: right;">Ações</th>"""
new_th = """                            <th style="padding: 8px;">Perfil</th>
                            <th style="padding: 8px;">Responde a</th>
                            <th style="padding: 8px; text-align: right;">Ações</th>"""

content = content.replace(old_th, new_th)

with open(filepath, 'w') as f:
    f.write(content)
print("hub.html patched")
