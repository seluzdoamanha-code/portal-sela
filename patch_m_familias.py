import re
with open('m_ass_familias.js', 'r') as f:
    js = f.read()

old_link = r"window\.location\.href = `m_ass_entregas\.html\?f_id=\$\{f\.id\}&f_nome=\$\{encodeURIComponent\(f\.codigo \+ ' - ' \+ \(f\.nome_familia \|\| ''\)\)\}`;?"
new_link = "window.location.href = `m_ass_entregas.html?f_id=${f.id}&f_nome=${encodeURIComponent(f.codigo + ' - ' + (f.nome_familia || ''))}&is_global=${f.is_nova_plataforma ? '1' : '0'}`;"

if re.search(old_link, js):
    js = re.sub(old_link, new_link, js)
    print("Patched m_ass_familias.js")
else:
    print("Not found m_ass_familias.js")

with open('m_ass_familias.js', 'w') as f:
    f.write(js)
