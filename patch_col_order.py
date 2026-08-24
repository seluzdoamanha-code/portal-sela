import re

filepath_html = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath_html, 'r') as f:
    html = f.read()

old_th = """                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                        <th style="padding: 12px 8px;">Perfil</th>
                                    </tr>"""
new_th = """                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Perfil</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                    </tr>"""
html = html.replace(old_th, new_th)

with open(filepath_html, 'w') as f:
    f.write(html)


filepath_js = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath_js, 'r') as f:
    js = f.read()

old_render = """            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 600;">${v.perfil || '-'}</td>"""
new_render = """            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 600;">${v.perfil || '-'}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>"""
js = js.replace(old_render, new_render)

old_print_thead = """                <tr>
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
new_print_thead = """                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Perfil</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Celular</th>
                    <th>E-mail</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                    <th>Sexo</th>
                </tr>"""
js = js.replace(old_print_thead, new_print_thead)

old_print_tbody = """            <tr>
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
new_print_tbody = """            <tr>
                <td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${v.perfil || ''}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${formatCel(p.celular)}</td>
                <td>${p.email || ''}</td>
                <td>${dt}</td>
                <td>${idade}</td>
                <td>${p.sexo || ''}</td>
            </tr>"""
js = js.replace(old_print_tbody, new_print_tbody)

with open(filepath_js, 'w') as f:
    f.write(js)
print("Finished patching col order")

