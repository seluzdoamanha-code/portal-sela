import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update switchSubTab to handle 'lista'
old_switch = """window.switchSubTab = function(target, tabName) {
    if (target === 'pessoas') {
        document.getElementById('pessoas-perfil').style.display = 'none';
        document.getElementById('pessoas-dados').style.display = 'none';
        
        document.querySelector('.btn-pessoas-perfil').classList.remove('active');
        document.querySelector('.btn-pessoas-dados').classList.remove('active');
        
        document.querySelector('.btn-pessoas-perfil').style.background = 'rgba(255,255,255,0.05)';
        document.querySelector('.btn-pessoas-dados').style.background = 'rgba(255,255,255,0.05)';
        
        document.getElementById(`pessoas-${tabName}`).style.display = 'grid';
        document.querySelector(`.btn-pessoas-${tabName}`).classList.add('active');
        document.querySelector(`.btn-pessoas-${tabName}`).style.background = 'var(--primary)';
    }
};"""

new_switch = """window.switchSubTab = function(target, tabName) {
    if (target === 'pessoas') {
        const tabs = ['perfil', 'dados', 'lista'];
        tabs.forEach(t => {
            const el = document.getElementById(`pessoas-${t}`);
            if (el) el.style.display = 'none';
            const btn = document.querySelector(`.btn-pessoas-${t}`);
            if (btn) {
                btn.classList.remove('active');
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.color = 'var(--text-muted)';
            }
        });
        
        const targetEl = document.getElementById(`pessoas-${tabName}`);
        if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : 'grid';
        
        const targetBtn = document.querySelector(`.btn-pessoas-${tabName}`);
        if (targetBtn) {
            targetBtn.classList.add('active');
            targetBtn.style.background = 'var(--primary)';
            targetBtn.style.color = 'white';
        }
        
        if (tabName === 'lista') {
            carregarTabelaListaPessoas();
        }
    }
};

window.carregarTabelaListaPessoas = async function() {
    const tbody = document.getElementById('tbodyListaPessoas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const filtro = document.getElementById('filtroListaPessoas').value;
    
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
    
    window.pessoasListaCacheParaImpressao = filtrados; // Salva para o print
    
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
        <title>Relatório de Pessoas - SELA</title>
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
        <h2>Lista de Pessoas - SELA (${data.length} registros)</h2>
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

content = content.replace(old_switch, new_switch)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js patched")
