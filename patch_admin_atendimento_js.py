import re

with open('admin.js', 'r') as f:
    js = f.read()

# Add to switchTab
old_switchTab = r"\} else if \(tabId === 'miniapps'\) \{\s*if \(typeof window\.carregarEstatisticasMiniAppIrradiacao === 'function'\) \{\s*window\.carregarEstatisticasMiniAppIrradiacao\(\);\s*\}"
new_switchTab = """} else if (tabId === 'miniapps') {
        if (typeof window.carregarEstatisticasMiniAppIrradiacao === 'function') {
            window.carregarEstatisticasMiniAppIrradiacao();
        }
        if (typeof window.carregarEstatisticasMiniAppAtendimento === 'function') {
            window.carregarEstatisticasMiniAppAtendimento();
        }"""
js = re.sub(old_switchTab, new_switchTab, js)

# Add new function at the end
new_func = """
// ==========================================
// ESTATÍSTICAS DO MINI-APP ATENDIMENTO ESPIRITUAL
// ==========================================
window.carregarEstatisticasMiniAppAtendimento = async function () {
    const container = document.getElementById('containerEstatMiniAppAtendimento');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px;">Processando dados do Atendimento Espiritual, aguarde...</div>';

    try {
        // Run queries in parallel
        const [resFraterno, resSessoes, resTratamentos, resPresencas] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*', { count: 'exact' }),
            db.from('app_atendimento_sessoes').select('*', { count: 'exact' }),
            db.from('app_atendimento_tratamentos').select('*', { count: 'exact' }),
            db.from('app_atendimento_presencas').select('*', { count: 'exact' })
        ]);

        if (resFraterno.error) console.error(resFraterno.error);
        if (resSessoes.error) console.error(resSessoes.error);
        if (resTratamentos.error) console.error(resTratamentos.error);
        if (resPresencas.error) console.error(resPresencas.error);

        const totalFraterno = resFraterno.data ? resFraterno.data.length : 0;
        const totalSessoes = resSessoes.data ? resSessoes.data.length : 0;
        const totalTratamentos = resTratamentos.data ? resTratamentos.data.length : 0;
        const totalPresencas = resPresencas.data ? resPresencas.data.length : 0;

        // Count Atendimentos by type
        let qtdeOrientacao = 0;
        let qtdeTratamento = 0;
        let qtdeOutros = 0;

        (resFraterno.data || []).forEach(f => {
            const t = (f.encaminhamento || '').toLowerCase();
            if (t.includes('orientaç') || t.includes('orientac')) qtdeOrientacao++;
            else if (t.includes('tratamento')) qtdeTratamento++;
            else qtdeOutros++;
        });

        // Current Month
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        let fraternoMes = 0;
        (resFraterno.data || []).forEach(f => {
            if (f.data_atendimento >= firstDayMonth) fraternoMes++;
        });

        let sessoesMes = 0;
        (resSessoes.data || []).forEach(s => {
            if (s.data_sessao >= firstDayMonth) sessoesMes++;
        });

        // Building HTML UI
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🤝</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Atendimento Fraterno</div>
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 8px 0; line-height: 1;">${totalFraterno}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Total histórico registrado</div>
                    <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: 500;">+${fraternoMes} este mês</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📅</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Sessões Realizadas</div>
                    <div style="font-size: 32px; font-weight: 800; color: #3b82f6; margin: 8px 0; line-height: 1;">${totalSessoes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Sessões abertas e concluídas</div>
                    <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: 500;">+${sessoesMes} este mês</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📋</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes em Tratamento</div>
                    <div style="font-size: 32px; font-weight: 800; color: #8b5cf6; margin: 8px 0; line-height: 1;">${totalTratamentos}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Vínculos criados nas sessões</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">✔️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Presenças Confirmadas</div>
                    <div style="font-size: 32px; font-weight: 800; color: #10b981; margin: 8px 0; line-height: 1;">${totalPresencas}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pacientes presentes no salão</div>
                </div>

            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: var(--text-main); margin: 0 0 16px 0;">Distribuição dos Encaminhamentos</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Apenas Orientação</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeOrientacao}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #3b82f6; width: ${(totalFraterno>0)?(qtdeOrientacao/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Tratamento Espiritual</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeTratamento}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #8b5cf6; width: ${(totalFraterno>0)?(qtdeTratamento/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Outros / Não especificado</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeOutros}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #64748b; width: ${(totalFraterno>0)?(qtdeOutros/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: var(--text-main); margin: 0 0 16px 0;">Sessões Recentes (Este Mês)</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${(resSessoes.data || [])
                            .filter(s => s.data_sessao >= firstDayMonth)
                            .sort((a,b) => new Date(b.data_sessao) - new Date(a.data_sessao))
                            .slice(0, 5)
                            .map(s => {
                                const statusColor = s.status === 'Concluída' ? '#10b981' : '#f59e0b';
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        <div style="color: var(--text-main); font-weight: 500; font-size: 14px;">${s.data_sessao.split('-').reverse().join('/')}</div>
                                    </div>
                                    <span style="font-size: 11px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;">
                                        ${s.status || 'Aberta'}
                                    </span>
                                </div>
                                `;
                            }).join('') || '<div style="color: var(--text-muted); font-size: 13px;">Nenhuma sessão registrada este mês.</div>'
                        }
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
    } catch (err) {
        console.error("Erro no dashboard do Atendimento", err);
        container.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">Erro ao carregar estatísticas do Atendimento.</div>`;
    }
};
"""

js += "\n" + new_func

with open('admin.js', 'w') as f:
    f.write(js)
