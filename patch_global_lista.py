import re

filepath_html = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
filepath_js = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'

with open(filepath_html, 'r') as f:
    html = f.read()

# 1. Add btn-pessoas-lista
old_pessoas_btns = """                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('pessoas', 'perfil')" class="btn btn-pessoas-perfil active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Cards Perfil</button>
                        <button onclick="switchSubTab('pessoas', 'dados')" class="btn btn-pessoas-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                    </div>"""
new_pessoas_btns = """                    <div class="admin-subtabs" style="display: flex; gap: 8px; margin-bottom: 24px;">
                        <button onclick="switchSubTab('pessoas', 'perfil')" class="btn btn-pessoas-perfil active" style="flex: 1; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px;">Cards Perfil</button>
                        <button onclick="switchSubTab('pessoas', 'dados')" class="btn btn-pessoas-dados" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Cards Dados</button>
                        <button onclick="switchSubTab('pessoas', 'lista')" class="btn btn-pessoas-lista" style="flex: 1; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px;">Lista</button>
                    </div>"""
html = html.replace(old_pessoas_btns, new_pessoas_btns)

# 2. Add subtab-pessoas-lista HTML
old_pessoas_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-pessoas-dados" class="subtab-content pessoas-subtab" style="display: none;">
                        <div id="dash-pessoas-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando dados...</div>
                        </div>
                    </div>"""
new_pessoas_dados = """                    <!-- Cards Dados -->
                    <div id="subtab-pessoas-dados" class="subtab-content pessoas-subtab" style="display: none;">
                        <div id="dash-pessoas-dados-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                            <div style="grid-column: 1 / -1; color: var(--text-muted); text-align: center;">Carregando dados...</div>
                        </div>
                    </div>
                    
                    <!-- Conteúdo: Lista Global -->
                    <div id="subtab-pessoas-lista" class="subtab-content pessoas-subtab" style="display: none; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: var(--text-main);">Lista Geral de Pessoas</h4>
                            <div style="display: flex; gap: 8px;">
                                <select id="filtroListaGlobalPessoas" class="form-control" style="width: auto; padding: 4px 8px; font-size: 13px;" onchange="carregarTabelaListaGlobalPessoas()">
                                    <option value="todos">Todos</option>
                                    <option value="Associado Efetivo">Associado Efetivo</option>
                                    <option value="Assistida + Assistido">Assistida + Assistido</option>
                                    <option value="Colaborador + Colaboradora">Colaborador + Colaboradora</option>
                                    <option value="Diretor + Diretora">Diretor + Diretora</option>
                                    <option value="Empresa Parceira">Empresa Parceira</option>
                                    <option value="Voluntária + Voluntário">Voluntária + Voluntário</option>
                                </select>
                                <button onclick="imprimirListaGlobalPessoas()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🖨️ Imprimir</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-align: left;">
                                        <th style="padding: 12px 8px;">CPF/CNPJ</th>
                                        <th style="padding: 12px 8px;">Nome (Completo / Curto)</th>
                                        <th style="padding: 12px 8px;">Celular</th>
                                        <th style="padding: 12px 8px;">E-mail</th>
                                        <th style="padding: 12px 8px;">Nascimento</th>
                                        <th style="padding: 12px 8px;">Sexo</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyListaGlobalPessoas">
                                    <tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>"""
html = html.replace(old_pessoas_dados, new_pessoas_dados)

with open(filepath_html, 'w') as f:
    f.write(html)
print("HTML patched.")

# Now patch JS
with open(filepath_js, 'r') as f:
    js = f.read()

# 1. Update switchSubTab
old_if_lista = """    if (tabName === 'lista' && target === 'associados') {
        if(typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else {
            console.error('carregarTabelaListaAssociados function not found');
        }
    }"""
new_if_lista = """    if (tabName === 'lista') {
        if (target === 'associados' && typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else if (target === 'pessoas' && typeof window.carregarTabelaListaGlobalPessoas === 'function') {
            window.carregarTabelaListaGlobalPessoas();
        }
    }"""
js = js.replace(old_if_lista, new_if_lista)

# 2. Append new functions
append_js = """
window.carregarTabelaListaGlobalPessoas = async function() {
    const tbody = document.getElementById('tbodyListaGlobalPessoas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    // Check if select options are populated, if only hardcoded ones exist, fetch from DB
    const select = document.getElementById('filtroListaGlobalPessoas');
    if (select && select.options.length <= 8) {
        // Fetch perfis from configuracoes
        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'opcoes_perfis').single();
            if (data && data.valor) {
                const perfis = JSON.parse(data.valor);
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todos</option>';
                perfis.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    select.appendChild(opt);
                });
                select.value = currentVal; // Restore selection if any
            }
        } catch(e) {}
    }
    
    const filtro = select ? select.value : 'todos';
    
    let query = db.from('pessoas').select('cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo, perfis').order('nome_completo');
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data;
    if (filtro !== 'todos') {
        filtrados = data.filter(p => {
            if (!p.perfis) return false;
            const perfStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
            return perfStr.includes(filtro);
        });
    }
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.pessoasGlobalListaCacheParaImpressao = filtrados;
    window.pessoasGlobalListaFiltroAtual = filtro;
    
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
            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.imprimirListaGlobalPessoas = function() {
    const data = window.pessoasGlobalListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    const filtroStr = (window.pessoasGlobalListaFiltroAtual === 'todos') ? 'Todas as Pessoas' : window.pessoasGlobalListaFiltroAtual;
    
    let html = `
    <html>
    <head>
        <title>Relatório de Pessoas - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            h4 { text-align: center; margin-bottom: 20px; color: #666; font-weight: normal; }
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
        <h2>Lista de Pessoas - SELA</h2>
        <h4>Filtro: ${filtroStr} (${data.length} registros)</h4>
        <table>
            <thead>
                <tr>
                    <th>CPF/CNPJ</th>
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
                <td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${formatCel(p.celular)}</td>
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
if "window.carregarTabelaListaGlobalPessoas =" not in js:
    js += append_js

with open(filepath_js, 'w') as f:
    f.write(js)
print("JS patched.")

