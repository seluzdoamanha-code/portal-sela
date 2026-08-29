import re

file_html = 'm_atendimento_gestao.html'
with open(file_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = html_content.replace(
    'background: rgba(255,255,255,0.05); color: var(--text-muted);',
    'background: rgba(0,0,0,0.05); color: var(--text-muted);'
)
html_content = html_content.replace(
    'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);',
    'background: var(--bg-panel); border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05);'
)
html_content = html_content.replace(
    'background: rgba(255,255,255,0.01);',
    'background: rgba(0,0,0,0.01);'
)

with open(file_html, 'w', encoding='utf-8') as f:
    f.write(html_content)


file_js = 'm_atendimento_gestao.js'
with open(file_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

js_content = js_content.replace(
    'background: rgba(255,255,255,0.1);',
    'background: rgba(0,0,0,0.1);'
)
# Update alphabetical letters divider in m_atendimento_gestao.js Fichário
# background: rgba(255,255,255,0.05) is used for the "S" letter bubble! Let's check where that is.
# In the screenshot, the "S" bubble has a light purple/blue background. It looks fine in the screenshot, maybe it uses the primary color tint.

with open(file_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Patched!")
