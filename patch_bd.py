import re

# PATCH HTML
filepath_html = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html'
with open(filepath_html, 'r') as f:
    html = f.read()

old_bd = """                <div id="tab-bd" class="tab-content">
                    <div class="placeholder-card">
                        <h3 style="color: var(--text-main); margin-bottom: 8px;">Manutenção do Banco de Dados</h3>
                        <p>Aguardando detalhamento de conteúdo e formatação.</p>
                    </div>
                </div>"""

new_bd = """                <div id="tab-bd" class="tab-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h3 style="color: var(--text-main); margin: 0;">🗄️ Tabelas do Sistema (Registros)</h3>
                        <button onclick="carregarEstatisticasBD()" class="btn btn-secondary" style="height: 32px; font-size: 13px;">🔄 Atualizar Dados</button>
                    </div>
                    
                    <div id="gridBancoDados" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                        <div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Carregando tabelas...</div>
                    </div>
                </div>"""

if old_bd in html:
    html = html.replace(old_bd, new_bd)
    with open(filepath_html, 'w') as f:
        f.write(html)
    print("HTML patched.")
else:
    print("Failed to find old BD html.")


# PATCH JS
filepath_js = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath_js, 'r') as f:
    js = f.read()

old_switch = """    // Adiciona active no conteúdo alvo
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (targetContent) targetContent.classList.add('active');
};"""

new_switch = """    // Adiciona active no conteúdo alvo
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (targetContent) targetContent.classList.add('active');
    
    if (tabId === 'bd') {
        if (typeof window.carregarEstatisticasBD === 'function') {
            window.carregarEstatisticasBD();
        }
    }
};"""

if old_switch in js:
    js = js.replace(old_switch, new_switch)
    print("JS switchTab patched.")
else:
    print("Failed to find JS switchTab.")

append_func = """
window.carregarEstatisticasBD = async function() {
    const grid = document.getElementById('gridBancoDados');
    if (!grid) return;
    
    grid.innerHTML = '<div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Contando registros...</div>';
    
    const tables = [
        "agenda", "app_admin_celular_creditos", "app_atendimento_fraterno", "app_atendimento_presencas",
        "app_atendimento_sessoes", "app_atendimento_tratamentos", "app_irradiacao_solicitacoes", 
        "app_mensagem_luz", "app_pacientes", "app_pagina_luz", "app_tesouraria_envios",
        "ass_cesta_composicao", "ass_cestas_modelos", "ass_entregas", "ass_familias", 
        "ass_itens_cesta", "ass_membros_familia", "ass_metas", "ass_ocorrencias", 
        "ass_planejamento_mes", "atividades_regulares", "configuracoes", "documentos", 
        "documentos_visibilidade", "emprestimos_portal", "estruturas", "fin_config_mensalidades", 
        "livros_catalogo", "pessoas", "posts", "projetos_processos", "reservas_site", 
        "usuario_atalhos", "vinculos_estrutura"
    ];
    
    // Para deixar mais leve e não engasgar a interface, faremos as queries em paralelo
    const promises = tables.map(async (table) => {
        try {
            const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
            if (error) return { table, count: 'Erro', error };
            return { table, count };
        } catch(e) {
            return { table, count: 'Erro' };
        }
    });
    
    const results = await Promise.all(promises);
    
    // Sort descending by count, then alphabetically
    results.sort((a, b) => {
        if (typeof a.count === 'number' && typeof b.count === 'number') {
            if (a.count !== b.count) return b.count - a.count;
        }
        return a.table.localeCompare(b.table);
    });
    
    grid.innerHTML = '';
    results.forEach(res => {
        const card = document.createElement('div');
        const color = typeof res.count === 'number' && res.count > 0 ? '#10b981' : '#6b7280';
        card.style.cssText = `background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 20px; border-left: 4px solid ${color}; display: flex; flex-direction: column; gap: 8px;`;
        
        card.innerHTML = `
            <div style="font-size: 13px; font-weight: 600; color: var(--text-main); word-break: break-all;">${res.table}</div>
            <div style="font-size: 28px; font-weight: 700; color: ${color}; margin-top: auto;">${res.count}</div>
        `;
        grid.appendChild(card);
    });
};
"""

if "window.carregarEstatisticasBD =" not in js:
    js += append_func
    print("Appended JS function.")

with open(filepath_js, 'w') as f:
    f.write(js)

