import re

filepath = '/Users/wagnercosta/.gemini/antigravity-ide/brain/a9e367ab-a0c8-48fd-baf3-dd2bb6a72d41/task.md'
with open(filepath, 'w') as f:
    f.write("""# Gestão de Equipes (Flat) e Organograma

- [ ] 1. Alterar lógica de exclusão no `organograma.js` para não apagar filhos (re-atribuir `parent_vinculo_id` para null/avô)
- [ ] 2. Dashboard Global em `admin.html`
  - [ ] 2.1 Aba Departamentos: Cards com contagem e Modal de gestão plana
  - [ ] 2.2 Aba Atividades: Cards com contagem e Modal de gestão plana
- [ ] 3. Gestão Descentralizada no `hub.html` / `hub.js`
  - [ ] 3.1 Adicionar botão "Gerenciar Equipe (Modo Lista)" na aba de Equipe
  - [ ] 3.2 Restringir acesso apenas a Diretor(a)/Vice-Diretor(a) ou Admin Global
  - [ ] 3.3 Modal/Side-sheet de inserção plana de vínculo (tabela `vinculos_estrutura`)
""")
print("task.md updated")
