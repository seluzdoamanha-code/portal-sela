import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the OLD generic function
old_switch = """window.switchSubTab = function(target, tabName) {
    // target = 'pessoas' ou 'associados'
    // tabName = 'perfil' ou 'dados'
    
    // Atualiza botoes
    document.querySelector(`.btn-${target}-perfil`).style.background = tabName === 'perfil' ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    document.querySelector(`.btn-${target}-perfil`).style.color = tabName === 'perfil' ? 'white' : 'var(--text-muted)';
    document.querySelector(`.btn-${target}-perfil`).style.border = tabName === 'perfil' ? 'none' : '1px solid var(--border)';
    
    document.querySelector(`.btn-${target}-dados`).style.background = tabName === 'dados' ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    document.querySelector(`.btn-${target}-dados`).style.color = tabName === 'dados' ? 'white' : 'var(--text-muted)';
    document.querySelector(`.btn-${target}-dados`).style.border = tabName === 'dados' ? 'none' : '1px solid var(--border)';
    
    // Atualiza conteudos
    document.querySelectorAll(`.${target}-subtab`).forEach(el => el.style.display = 'none');
    document.getElementById(`subtab-${target}-${tabName}`).style.display = 'block';
};"""

new_switch = """window.switchSubTab = function(target, tabName) {
    const tabs = ['perfil', 'dados', 'lista'];
    tabs.forEach(t => {
        const el = document.getElementById(`subtab-${target}-${t}`) || document.getElementById(`${target}-${t}`);
        if (el) el.style.display = 'none';
        
        const btn = document.querySelector(`.btn-${target}-${t}`);
        if (btn) {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid var(--border)';
        }
    });
    
    const targetEl = document.getElementById(`subtab-${target}-${tabName}`) || document.getElementById(`${target}-${tabName}`);
    if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : (tabName === 'dados' ? 'grid' : 'block');
    
    const targetBtn = document.querySelector(`.btn-${target}-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.style.background = 'var(--primary)';
        targetBtn.style.color = 'white';
        targetBtn.style.border = 'none';
    }
    
    if (tabName === 'lista' && target === 'associados') {
        if(typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else {
            console.error('carregarTabelaListaAssociados function not found');
        }
    }
};"""

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    print("Successfully replaced switchSubTab")
else:
    print("ERROR: old_switch not found!")

# Now check if carregarTabelaListaAssociados exists, if not, append it!
if "window.carregarTabelaListaAssociados =" not in content:
    append_func = """
window.carregarTabelaListaAssociados = async function() {
    const tbody = document.getElementById('tbodyListaPessoas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const filtroEl = document.getElementById('filtroListaPessoas');
    const filtro = filtroEl ? filtroEl.value : 'associados';
    
    let query = db.from('pessoas').select('cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo, perfis').order('nome_completo');
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data;
    if (filtro === 'associados') {
        filtrados = data.filter(p => {
            if (!p.perfis) return false;
            const perfStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
            return perfStr.includes('Associado Efetivo');
        });
    }
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.pessoasListaCacheParaImpressao = filtrados;
    
    tbody.innerHTML = '';
    filtrados.forEach(p => {
        let idade = '-';
        if (p.data_nascimento) {
            const birth = new Date(p.data_nascimento);
            const diff = Date.now() - birth.getTime();
            const ageDate = new Date(diff); 
            idade = Math.abs(ageDate.getUTCFullYear() - 1970) + ' anos';
        }
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${p.cpf_cnpj || '-'}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.celular || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.imprimirListaPessoas = function() {
    const data = window.pessoasListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    
    let html = `
    <html>
    <head>
        <title>Relatório de Associados - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            @media print {
                @page { margin: 1cm; size: landscape; }
                body { margin: 0; }
            }
        </style>
    </head>
    <body>
        <h2>Lista de Associados - SELA (${data.length} registros)</h2>
        <table>
            <thead>
                <tr>
                    <th>CPF</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Celular</th>
                    <th>E-mail</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                    <th>Sexo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(p => {
        let idade = '-';
        let dt = '-';
        if (p.data_nascimento) {
            const birth = new Date(p.data_nascimento);
            const diff = Date.now() - birth.getTime();
            const ageDate = new Date(diff); 
            idade = Math.abs(ageDate.getUTCFullYear() - 1970);
            dt = birth.toLocaleDateString('pt-BR');
        }
        
        html += `
            <tr>
                <td>${p.cpf_cnpj || ''}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${p.celular || ''}</td>
                <td>${p.email || ''}</td>
                <td>${dt}</td>
                <td>${idade}</td>
                <td>${p.sexo || ''}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
};
"""
    content += append_func
    print("Appended carregarTabelaListaAssociados")
else:
    print("carregarTabelaListaAssociados already exists")

with open(filepath, 'w') as f:
    f.write(content)

