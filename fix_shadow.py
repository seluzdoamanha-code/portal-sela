import re

with open('m_ass_familias.js', 'r') as f:
    content = f.read()

content = content.replace('let familiasPerfil = [];', 'familiasPerfil = [];')
content = content.replace('let familiasLegado = [];', 'familiasLegado = [];')

with open('m_ass_familias.js', 'w') as f:
    f.write(content)
