import re

filepath = '/Users/wagnercosta/.gemini/antigravity-ide/brain/a9e367ab-a0c8-48fd-baf3-dd2bb6a72d41/task.md'
with open(filepath, 'w') as f:
    f.write("""# Gestão de Equipes (Flat) e Organograma

- [ ] 1. Renomear "Papel / Função" para "Perfil" na UI
- [ ] 2. Puxar lista de Perfis da tabela `configuracoes` (`chave = 'opcoes_perfis'`) para popular o datalist
- [ ] 3. Adicionar campo "Responde a" (dropdown dinâmico) no modal de `admin.html` e `hub.html`
- [ ] 4. Lógica JS: popular dropdown "Responde a" com os membros já carregados na equipe
- [ ] 5. Lógica JS: salvar `parent_vinculo_id` ao adicionar um novo membro
""")
print("task.md updated")
