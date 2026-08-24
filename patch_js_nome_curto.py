import re

for filepath in ['/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js', '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.js']:
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Update SELECTs
    old_select = """const { data } = await db.from('pessoas').select('id, nome_completo, perfis');"""
    new_select = """const { data } = await db.from('pessoas').select('id, nome_completo, nome_curto, perfis');"""
    content = content.replace(old_select, new_select)
    
    old_select2 = """.select('id, perfil, parent_vinculo_id, pessoas(nome_completo)')"""
    new_select2 = """.select('id, perfil, parent_vinculo_id, pessoas(nome_completo, nome_curto)')"""
    content = content.replace(old_select2, new_select2)

    # 2. Update filter in Buscas
    if 'admin.js' in filepath:
        old_filter = """const filter = pessoasBuscaCache.filter(p => p.nome_completo && p.nome_completo.toLowerCase().includes(val)).slice(0, 8);"""
        new_filter = """const filter = pessoasBuscaCache.filter(p => {
            if (!p.nome_completo || !p.nome_completo.toLowerCase().includes(val)) return false;
            let arr = [];
            if (Array.isArray(p.perfis)) arr = p.perfis;
            else if (typeof p.perfis === 'string') arr = p.perfis.split(',').map(s=>s.trim());
            if (arr.includes('Outros')) return false;
            return true;
        }).slice(0, 8);"""
        content = content.replace(old_filter, new_filter)
        
        # Display nome_curto in dropdown
        old_div = """div.textContent = p.nome_completo;"""
        new_div = """div.textContent = p.nome_curto || p.nome_completo;"""
        content = content.replace(old_div, new_div)
        
        old_input = """input.value = p.nome_completo;"""
        new_input = """input.value = p.nome_curto || p.nome_completo;"""
        content = content.replace(old_input, new_input)
        
        # Table display
        old_td = """<td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? v.pessoas.nome_completo : 'Desconhecido'}</td>"""
        new_td = """<td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido'}</td>"""
        content = content.replace(old_td, new_td)
        
        # Parent display
        old_pName = """const parentName = parent && parent.pessoas ? parent.pessoas.nome_completo : '-';"""
        new_pName = """const parentName = parent && parent.pessoas ? (parent.pessoas.nome_curto || parent.pessoas.nome_completo) : '-';"""
        content = content.replace(old_pName, new_pName)
        
        # Responde A opt textContent
        old_opt = """opt.textContent = v.pessoas ? v.pessoas.nome_completo : 'Desconhecido';"""
        new_opt = """opt.textContent = v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido';"""
        content = content.replace(old_opt, new_opt)

    elif 'hub.js' in filepath:
        old_filter = """const filter = hubPessoasBuscaCache.filter(p => p.nome_completo && p.nome_completo.toLowerCase().includes(val)).slice(0, 8);"""
        new_filter = """const filter = hubPessoasBuscaCache.filter(p => {
            if (!p.nome_completo || !p.nome_completo.toLowerCase().includes(val)) return false;
            let arr = [];
            if (Array.isArray(p.perfis)) arr = p.perfis;
            else if (typeof p.perfis === 'string') arr = p.perfis.split(',').map(s=>s.trim());
            if (arr.includes('Outros')) return false;
            return true;
        }).slice(0, 8);"""
        content = content.replace(old_filter, new_filter)
        
        old_div = """div.textContent = p.nome_completo;"""
        new_div = """div.textContent = p.nome_curto || p.nome_completo;"""
        content = content.replace(old_div, new_div)
        
        old_input = """input.value = p.nome_completo;"""
        new_input = """input.value = p.nome_curto || p.nome_completo;"""
        content = content.replace(old_input, new_input)
        
        old_td = """<td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? v.pessoas.nome_completo : 'Desconhecido'}</td>"""
        new_td = """<td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido'}</td>"""
        content = content.replace(old_td, new_td)
        
        old_pName = """const parentName = parent && parent.pessoas ? parent.pessoas.nome_completo : '-';"""
        new_pName = """const parentName = parent && parent.pessoas ? (parent.pessoas.nome_curto || parent.pessoas.nome_completo) : '-';"""
        content = content.replace(old_pName, new_pName)
        
        old_opt = """opt.textContent = v.pessoas ? v.pessoas.nome_completo : 'Desconhecido';"""
        new_opt = """opt.textContent = v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido';"""
        content = content.replace(old_opt, new_opt)

    with open(filepath, 'w') as f:
        f.write(content)
print("js scripts patched for nome_curto and Outros filter")
