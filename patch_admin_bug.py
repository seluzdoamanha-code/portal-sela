import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

old_query = """const { data: estruturas, error: errEst } = await db.from('estruturas').select('id, nome, tipo, icone, cor').order('nome');"""
new_query = """const { data: estruturas, error: errEst } = await db.from('estruturas').select('id, nome, tipo').order('nome');"""

content = content.replace(old_query, new_query)

old_vars = """const icon = est.icone || '📁';
        const color = est.cor || '#3b82f6';"""
new_vars = """const icon = est.tipo === 'Departamento' ? '🏢' : '📅';
        const color = est.tipo === 'Departamento' ? '#3b82f6' : '#8b5cf6';"""

content = content.replace(old_vars, new_vars)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js bug patched")
