import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

# Add formatters if they don't exist
formatters = """
function formatCpf(cpf) {
    if (!cpf) return '-';
    let val = cpf.replace(/\D/g, '');
    if (val.length === 11) return val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (val.length === 14) return val.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return cpf;
}
function formatCel(cel) {
    if (!cel) return '-';
    let val = cel.replace(/\D/g, '');
    if (val.length === 11) return val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (val.length === 10) return val.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return cel;
}
"""

if "function formatCpf(cpf)" not in content:
    content = formatters + content

# Patch table render
old_table_tds = """<td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${p.cpf_cnpj || '-'}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.celular || '-'}</td>"""
new_table_tds = """<td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>"""
content = content.replace(old_table_tds, new_table_tds)

# Patch print render
old_print_tds = """<td>${p.cpf_cnpj || ''}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${p.celular || ''}</td>"""
new_print_tds = """<td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${formatCel(p.celular)}</td>"""
content = content.replace(old_print_tds, new_print_tds)

with open(filepath, 'w') as f:
    f.write(content)
print("Formatters applied successfully.")
