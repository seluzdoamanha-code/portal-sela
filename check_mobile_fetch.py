with open('m_ass_familias.js', 'r') as f:
    content = f.read()

import re
fetch_block = re.search(r'async function carregarFamilias\(\) \{.*?(?=// --- EVENTOS)', content, re.DOTALL)
if fetch_block:
    print(fetch_block.group(0)[:1500])
else:
    print("Could not find carregarFamilias")
