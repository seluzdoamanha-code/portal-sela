import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. Update the Promise.all
old_promise = r"const \[resFraterno, resSessoes, resTratamentos, resPresencas\] = await Promise\.all\(\[\s*db\.from\('app_atendimento_fraterno'\)\.select\('\*', \{ count: 'exact' \}\),\s*db\.from\('app_atendimento_sessoes'\)\.select\('\*', \{ count: 'exact' \}\),\s*db\.from\('app_atendimento_tratamentos'\)\.select\('\*', \{ count: 'exact' \}\),\s*db\.from\('app_atendimento_presencas'\)\.select\('\*', \{ count: 'exact' \}\)\s*\]\);"

new_promise = """const [resFraterno, resSessoes, resTratamentos, resPresencas, resPacientes] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*', { count: 'exact' }),
            db.from('app_atendimento_sessoes').select('*', { count: 'exact' }),
            db.from('app_atendimento_tratamentos').select('*', { count: 'exact' }),
            db.from('app_atendimento_presencas').select('*', { count: 'exact' }),
            db.from('app_pacientes').select('id', { count: 'exact' })
        ]);"""

js = re.sub(old_promise, new_promise, js)

# 2. Extract variables
old_vars = r"const totalPresencas = resPresencas\.data \? resPresencas\.data\.length : 0;"
new_vars = """const totalPresencas = resPresencas.data ? resPresencas.data.length : 0;
        const totalPacientes = resPacientes.count !== null ? resPacientes.count : (resPacientes.data ? resPacientes.data.length : 0);
        
        let triagemAguardando = 0;
        (resFraterno.data || []).forEach(f => {
            // Planejado ou qualquer status que indique fila
            if (f.status === 'Planejado' || f.status === 'Aguardando' || f.status === 'Fila') {
                triagemAguardando++;
            }
        });"""

js = re.sub(old_vars, new_vars, js)

# 3. Add the HTML cards
old_html_grid = r"<div style=\"display: grid; grid-template-columns: repeat\(auto-fit, minmax\(200px, 1fr\)\); gap: 16px; margin-bottom: 24px;\">\s*<div style=\"background: var\(--bg-panel\);"

new_html_grid = """<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                
                <!-- NEW CARD: Triagem -->
                <div style="background: var(--bg-panel); border: 1px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">⏳</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Aguardando na Triagem</div>
                    <div style="font-size: 32px; font-weight: 800; color: #f59e0b; margin: 8px 0; line-height: 1;">${triagemAguardando}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pacientes na fila</div>
                </div>

                <!-- NEW CARD: Fichário -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🗂️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes Cadastrados</div>
                    <div style="font-size: 32px; font-weight: 800; color: #64748b; margin: 8px 0; line-height: 1;">${totalPacientes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Total no Fichário</div>
                </div>

                <div style="background: var(--bg-panel);"""

js = re.sub(old_html_grid, new_html_grid, js)

with open('admin.js', 'w') as f:
    f.write(js)
