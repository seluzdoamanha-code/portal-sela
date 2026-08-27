import re

with open('admin.js', 'r') as f:
    js = f.read()

# We want to replace the beginning of the html in carregarEstatisticasMiniAppAtendimento
# Current:
#        let html = `
#            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">

old_html_start = r"let html = `\s*<div style=\"display: grid; grid-template-columns: repeat\(auto-fit, minmax\(200px, 1fr\)\); gap: 16px; margin-bottom: 24px;\">"

new_html_start = """let html = `
            <div style="display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; display: flex; align-items: flex-start; gap: 16px;">
                    <div style="font-size: 40px; background: rgba(16, 185, 129, 0.1); width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">🕊️</div>
                    <div>
                        <h2 style="margin: 0 0 8px 0; color: #10b981; font-size: 24px;">Atendimentos</h2>
                        <div style="font-size: 14px; color: var(--text-main); margin-bottom: 4px;"><strong>Atividade:</strong> Atendimentos Fraterno e Tratamentos</div>
                        <div style="font-size: 14px; color: var(--text-main);"><strong>Departamento:</strong> Espiritual</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">"""

js = re.sub(old_html_start, new_html_start, js)

with open('admin.js', 'w') as f:
    f.write(js)
