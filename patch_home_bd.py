import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    js = f.read()

old_metrics = """        let html = '';
        html += celularHtml;
        html += renderMetricCard('🤝', 'Associados Efetivos', assoc, '#8b5cf6');
        html += renderMetricCard('👤', 'Pessoas Físicas', pf, '#3b82f6');
        html += renderMetricCard('🏢', 'Pessoas Jurídicas', pj, '#f59e0b');
        html += renderMetricCard('👥', 'Total na Base', total, '#10b981');
        
        container.innerHTML = html;"""

new_metrics = """        let html = '';
        html += celularHtml;
        html += renderMetricCard('🤝', 'Associados Efetivos', assoc, '#8b5cf6');
        html += renderMetricCard('👤', 'Pessoas Físicas', pf, '#3b82f6');
        html += renderMetricCard('🏢', 'Pessoas Jurídicas', pj, '#f59e0b');
        html += renderMetricCard('👥', 'Total na Base', total, '#10b981');
        
        // Custom card for Banco de Dados
        html += `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid #ec4899; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('bd')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">🗄️</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Tabelas (Supabase)</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    34
                </div>
            </div>
        `;
        
        container.innerHTML = html;"""

js = js.replace(old_metrics, new_metrics)
with open(filepath, 'w') as f:
    f.write(js)
