import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

home_funcs = """

async function carregarDashboardsHome() {
    const container = document.getElementById('homeDashContainer');
    if (!container) return;
    
    try {
        // Fetch Celular
        const { data: celData } = await db.from('app_admin_celular_creditos').select('*').order('data_adicionado', { ascending: false }).limit(1);
        
        // Fetch Pessoas Counts
        // Em um cenário real, contagens grandes devem ser feitas via RPC. Como temos poucas, podemos baixar ou usar contagem agregada.
        // Vamos baixar os IDs e Perfis para ser rápido e poupar dados
        const { data: pessoasData } = await db.from('pessoas').select('tipo_pessoa, perfis');
        
        let celularHtml = '';
        if (celData && celData.length > 0) {
            const ultimo = celData[0];
            const dtAdic = new Date(ultimo.data_adicionado + 'T12:00:00Z');
            const dtVenc = new Date(dtAdic);
            dtVenc.setDate(dtVenc.getDate() + ultimo.prazo_dias);
            
            const hoje = new Date();
            const diffTime = dtVenc - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let corStatus = '#10b981'; // verde
            let iconStatus = '🟢';
            if (diffDays <= 15) { corStatus = '#f59e0b'; iconStatus = '🟡'; }
            if (diffDays <= 3) { corStatus = '#ef4444'; iconStatus = '🔴'; }
            if (diffDays < 0) { corStatus = '#991b1b'; iconStatus = '❌'; }
            
            celularHtml = `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid ${corStatus}; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('celular')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">📱 Celular (Vivo)</div>
                    <div style="font-size: 16px;" title="Status">${iconStatus}</div>
                </div>
                <div style="font-size: 28px; font-weight: 800; color: var(--text-main); line-height: 1.1;">
                    ${diffDays >= 0 ? diffDays : Math.abs(diffDays)} <span style="font-size: 14px; font-weight: 500; color: var(--text-muted);">${diffDays >= 0 ? 'dias restantes' : 'dias vencidos'}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
                    Vence em: <b>${dtVenc.toLocaleDateString('pt-BR')}</b>
                </div>
            </div>
            `;
        } else {
            celularHtml = `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer;" onclick="switchTab('celular')">
                <div style="font-size: 24px; margin-bottom: 8px;">📱</div>
                <div style="font-size: 14px; color: var(--text-muted);">Nenhum crédito registrado</div>
            </div>
            `;
        }
        
        let pf = 0, pj = 0, assoc = 0, total = 0;
        if (pessoasData) {
            total = pessoasData.length;
            pessoasData.forEach(p => {
                if (p.tipo_pessoa === 'Jurídica') pj++;
                else pf++;
                
                let perfis = '';
                if (Array.isArray(p.perfis)) perfis = p.perfis.join(',');
                else if (p.perfis) perfis = String(p.perfis);
                
                if (perfis.includes('Associado Efetivo')) assoc++;
            });
        }
        
        const renderMetricCard = (icon, title, val, color) => `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid ${color}; display: flex; flex-direction: column; gap: 8px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">${icon}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${title}</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    ${val}
                </div>
            </div>
        `;
        
        let html = '';
        html += celularHtml;
        html += renderMetricCard('🤝', 'Associados Efetivos', assoc, '#8b5cf6');
        html += renderMetricCard('👤', 'Pessoas Físicas', pf, '#3b82f6');
        html += renderMetricCard('🏢', 'Pessoas Jurídicas', pj, '#f59e0b');
        html += renderMetricCard('👥', 'Total na Base', total, '#10b981');
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error("Erro dashboard home", e);
        container.innerHTML = '<div style="color:red;">Erro ao carregar painel inicial.</div>';
    }
}
"""

content += home_funcs

old_admin = "carregarDashboardsPessoas();"
new_admin = """carregarDashboardsPessoas();
        carregarDashboardsHome();"""
content = content.replace(old_admin, new_admin)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js home dashboard added")
