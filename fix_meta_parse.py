import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    new_meta_logic = "const meta = p.ass_familias_meta ? (Array.isArray(p.ass_familias_meta) ? (p.ass_familias_meta[0] || {}) : p.ass_familias_meta) : {};"
    content = re.sub(r'const meta = \(p\.ass_familias_meta && p\.ass_familias_meta\.length > 0\) \? p\.ass_familias_meta\[0\] : \{\};', new_meta_logic, content)
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('familias.js')
fix_file('m_ass_familias.js')
