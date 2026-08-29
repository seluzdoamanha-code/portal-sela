import re

file_js = 'm_atendimento_gestao.js'
with open(file_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Fix Risco de Abandono inner cards
js_content = js_content.replace(
    'background: rgba(0,0,0,0.2); border: 1px solid rgba(239,68,68,0.1);',
    'background: var(--bg-panel); border: 1px solid rgba(239,68,68,0.2); box-shadow: 0 1px 3px rgba(0,0,0,0.05);'
)

# Fix Painel Semanal stats cards
js_content = js_content.replace(
    'background: rgba(255,255,255,0.02);',
    'background: var(--bg-panel);'
)

with open(file_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Patched!")
