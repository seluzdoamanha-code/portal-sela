import re

# Read hub.js
with open('hub.js', 'r', encoding='utf-8') as f:
    hub_js = f.read()

# Extract the function
match = re.search(r'window\.abrirModalFicharioCompleto = async function\(safeId\) \{.*?\n\};', hub_js, re.DOTALL)
if not match:
    print("Could not find function in hub.js")
    exit(1)

func_content = match.group(0)

# Read m_atendimento_gestao.js
with open('m_atendimento_gestao.js', 'r', encoding='utf-8') as f:
    mobile_js = f.read()

# Replace the function
mobile_js_patched = re.sub(r'window\.abrirModalFicharioCompleto = async function\(safeId\) \{.*?\n\};', func_content, mobile_js, flags=re.DOTALL)

with open('m_atendimento_gestao.js', 'w', encoding='utf-8') as f:
    f.write(mobile_js_patched)

print("Patched mobile JS successfully!")
