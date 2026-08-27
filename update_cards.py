import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. We replace the calculations block
calc_old = r"const totalFraterno = resFraterno\.data \? resFraterno\.data\.length : 0;.*?let sessoesMes = 0;\s*\(resSessoes\.data \|\| \[\]\)\.forEach\(s => \{\s*if \(s\.data_sessao >= firstDayMonth\) sessoesMes\+\+;\s*\}\);"

calc_new = """// --- CALCULATIONS FOR CARDS ---
        // 0) Fichário & Triagem
        const ficharioSet = new Set();
        (resFraterno.data || []).forEach(f => { if (f.nome_completo) ficharioSet.add(f.nome_completo.trim().toUpperCase()); });
        (resTratamentos.data || []).forEach(t => {
            if (t.paciente?.nome_completo) ficharioSet.add(t.paciente.nome_completo.trim().toUpperCase());
            else if (t.nome_completo) ficharioSet.add(t.nome_completo.trim().toUpperCase());
        });
        const totalPacientes = ficharioSet.size;
        
        let triagemAguardando = 0;
        (resFraterno.data || []).forEach(f => {
            const st = (f.status || '').toLowerCase();
            if (st === 'pendente' || st === 'em tratamento') triagemAguardando++;
        });

        // 1) & 2) Atendimento Fraterno (Realizados e Planejados) & (Pendentes)
        let fraternoRealizados = 0;
        let fraternoPendentes = 0;
        (resFraterno.data || []).forEach(f => {
            const st = (f.status || '').toLowerCase();
            if (['ativo', 'concluido', 'concluído', 'planejado'].includes(st)) fraternoRealizados++;
            if (st === 'pendente') fraternoPendentes++;
        });

        // 3), 4), 5), 8) Tratamentos
        const totalTratamentos = resTratamentos.data ? resTratamentos.data.length : 0;
        let tratFluidico = 0;
        let tratEspiritual = 0;
        let pacientesEmTratamento = 0;
        
        (resTratamentos.data || []).forEach(t => {
            const tipo = (t.tipo || '').toLowerCase();
            const st = (t.status || '').toLowerCase();
            if (tipo.includes('fluid') || tipo.includes('fluíd')) tratFluidico++;
            if (tipo.includes('espiritual')) tratEspiritual++;
            if (st !== 'concluido' && st !== 'concluído') pacientesEmTratamento++;
        });

        // 6), 7) Procedimentos (Sessões)
        let procFluidico = 0;
        let procEspiritual = 0;
        (resSessoes.data || []).forEach(s => {
            const tipo = (s.tipo || '').toLowerCase();
            if (tipo.includes('fluid') || tipo.includes('fluíd')) procFluidico++;
            if (tipo.includes('espiritual')) procEspiritual++;
        });"""

js = re.sub(calc_old, calc_new, js, flags=re.DOTALL)


# 2. We replace the HTML UI block
html_old = r"<div style=\"display: grid; grid-template-columns: repeat\(auto-fit, minmax\(200px, 1fr\)\); gap: 16px; margin-bottom: 24px;\">.*?</div>\s*</div>\s*<div style=\"background: var\(--bg-panel\);"

html_new = """<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                
                <!-- 0) Triagem -->
                <div style="background: var(--bg-panel); border: 1px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">⏳</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Aguardando na Triagem</div>
                    <div style="font-size: 32px; font-weight: 800; color: #f59e0b; margin: 8px 0; line-height: 1;">${triagemAguardando}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pacientes na fila</div>
                </div>

                <!-- 0) Fichário -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🗂️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes Cadastrados</div>
                    <div style="font-size: 32px; font-weight: 800; color: #64748b; margin: 8px 0; line-height: 1;">${totalPacientes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Total no Fichário</div>
                </div>

                <!-- 1) Fraterno Realizados -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🤝</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Atendimento Fraterno</div>
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 8px 0; line-height: 1;">${fraternoRealizados}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Realizados e Planejados</div>
                </div>

                <!-- 2) Fraterno Pendentes -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🤝</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Atendimento Fraterno</div>
                    <div style="font-size: 32px; font-weight: 800; color: #ef4444; margin: 8px 0; line-height: 1;">${fraternoPendentes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pendentes</div>
                </div>

                <!-- 3) Tratamentos Totais -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📋</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Tratamentos</div>
                    <div style="font-size: 32px; font-weight: 800; color: #8b5cf6; margin: 8px 0; line-height: 1;">${totalTratamentos}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Totais</div>
                </div>

                <!-- 4) Tratamento Fluídico -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">💧</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Tratamento Fluídico</div>
                    <div style="font-size: 32px; font-weight: 800; color: #3b82f6; margin: 8px 0; line-height: 1;">${tratFluidico}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Totais</div>
                </div>

                <!-- 5) Tratamento Espiritual -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">✨</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Tratamento Espiritual</div>
                    <div style="font-size: 32px; font-weight: 800; color: #a855f7; margin: 8px 0; line-height: 1;">${tratEspiritual}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Totais</div>
                </div>

                <!-- 6) Procedimento Fluídico -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📅</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Procedimento Fluídico</div>
                    <div style="font-size: 32px; font-weight: 800; color: #0ea5e9; margin: 8px 0; line-height: 1;">${procFluidico}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Totais</div>
                </div>

                <!-- 7) Procedimento Espiritual -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📅</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Procedimento Espiritual</div>
                    <div style="font-size: 32px; font-weight: 800; color: #d946ef; margin: 8px 0; line-height: 1;">${procEspiritual}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Totais</div>
                </div>
                
                <!-- 8) Pacientes em Tratamento -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">❤️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes em Tratamento</div>
                    <div style="font-size: 32px; font-weight: 800; color: #10b981; margin: 8px 0; line-height: 1;">${pacientesEmTratamento}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Ativos</div>
                </div>

            </div>
            
            <div style="background: var(--bg-panel);"""

js = re.sub(html_old, html_new, js, flags=re.DOTALL)

with open('admin.js', 'w') as f:
    f.write(js)
