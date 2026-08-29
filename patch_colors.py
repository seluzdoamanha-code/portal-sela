import re

file_js = 'm_atendimento_gestao.js'
with open(file_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace hardcoded dark theme overlays
js_content = js_content.replace('rgba(255,255,255,0.03)', 'var(--bg-panel)')
js_content = js_content.replace('rgba(255,255,255,0.01)', 'rgba(0,0,0,0.02)')
js_content = js_content.replace('rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)')
js_content = js_content.replace('rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)')

with open(file_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Colors Patched globally in JS!")
