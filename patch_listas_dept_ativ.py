import re

filepath_html = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath_html, 'r') as f:
    html = f.read()

# Headers HTML Departamentos
old_dept_th = """                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Departamento (Vínculo)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                    </tr>"""
new_dept_th = """                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                        <th style="padding: 12px 8px;">Perfil</th>
                                    </tr>"""
html = html.replace(old_dept_th, new_dept_th).replace("colspan=\"5\"", "colspan=\"7\"")

old_ativ_th = """                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Atividade (Vínculo)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                    </tr>"""
html = html.replace(old_ativ_th, new_dept_th)

with open(filepath_html, 'w') as f:
    f.write(html)
print("HTML patched.")


filepath_js = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath_js, 'r') as f:
    js = f.read()

# Replace query in carregarTabelaListaDepartamentos and carregarTabelaListaAtividades
old_query = """    let query = db.from('vinculos_estrutura').select(`
        estrutura_id, 
        estruturas(id, nome, tipo),
        pessoas(cpf_cnpj, nome_completo, nome_curto, celular, data_nascimento)
    `);"""
new_query = """    let query = db.from('vinculos_estrutura').select(`
        perfil,
        estrutura_id, 
        estruturas(id, nome, tipo),
        pessoas(cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo)
    `);"""
js = js.replace(old_query, new_query)

# Replace table render
old_render = """            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-main);">${v.estruturas.nome}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>"""
new_render = """            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 600;">${v.perfil || '-'}</td>"""
js = js.replace(old_render, new_render)

# Replace print HTML
old_print_thead_dept = """                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Departamento</th>
                    <th>Celular</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                </tr>"""
new_print_thead_dept = """                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Celular</th>
                    <th>E-mail</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                    <th>Sexo</th>
                    <th>Perfil</th>
                </tr>"""
js = js.replace(old_print_thead_dept, new_print_thead_dept)

old_print_thead_ativ = """                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Atividade</th>
                    <th>Celular</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                </tr>"""
js = js.replace(old_print_thead_ativ, new_print_thead_dept)

old_print_tbody = """            <tr>
                <td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${v.estruturas.nome}</td>
                <td>${formatCel(p.celular)}</td>
                <td>${dt}</td>
                <td>${idade}</td>
            </tr>"""
new_print_tbody = """            <tr>
                <td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${formatCel(p.celular)}</td>
                <td>${p.email || ''}</td>
                <td>${dt}</td>
                <td>${idade}</td>
                <td>${p.sexo || ''}</td>
                <td>${v.perfil || ''}</td>
            </tr>"""
js = js.replace(old_print_tbody, new_print_tbody)

with open(filepath_js, 'w') as f:
    f.write(js)
print("JS patched.")

