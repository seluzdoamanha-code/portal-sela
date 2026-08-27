import re

with open('m_ass_familias.js', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == 'familiasLegado = [];' and i < 20:
        lines[i] = '    let familiasLegado = [];\n'
    if line.strip() == 'familiasPerfil = [];' and i < 20:
        lines[i] = '    let familiasPerfil = [];\n'

with open('m_ass_familias.js', 'w') as f:
    f.writelines(lines)
