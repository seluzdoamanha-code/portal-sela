import re

file_path = 'm_atendimento_gestao.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patient name
content = content.replace(
    '<strong style="font-size: 15px; color: white;">',
    '<strong style="font-size: 15px; color: var(--text-main);">'
)

# 2. History entry titles
content = content.replace(
    'color:white; font-size:13px; margin-bottom:4px;',
    'color:var(--text-main); font-size:13px; margin-bottom:4px;'
)

# 3. Inputs, textareas, selects
# They use: background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white;
# We should change them to: background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main);
content = content.replace(
    'background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white;',
    'background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main);'
)
# And the variant without width
content = content.replace(
    'background: rgba(0,0,0,0.2); color: white; border: 1px solid var(--border);',
    'background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border);'
)

# 4. Toggle button (Evolução inline)
content = content.replace(
    'background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border);',
    'background: rgba(0,0,0,0.05); color: var(--text-main); border: 1px solid var(--border);'
)

# 5. Histórico button
content = content.replace(
    'background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1);',
    'background: rgba(0,0,0,0.05); color: var(--text-main); border: 1px solid var(--border);'
)

# 6. Patient name in search results (line 1152)
content = content.replace(
    '<div style="font-size: 13px; font-weight: bold; color: white;">',
    '<div style="font-size: 13px; font-weight: bold; color: var(--text-main);">'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates completed in m_atendimento_gestao.js")
