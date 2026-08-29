import re
import glob

# For admin.js
with open('admin.js', 'r', encoding='utf-8') as f:
    admin_content = f.read()
if 'window.miniAppChartSemanal = new Chart' in admin_content:
    admin_content = admin_content.replace('window.miniAppChartSemanal = new Chart', 'if(window.miniAppChartSemanal) window.miniAppChartSemanal.destroy();\n            window.miniAppChartSemanal = new Chart')
    admin_content = admin_content.replace('window.miniAppChartMensal = new Chart', 'if(window.miniAppChartMensal) window.miniAppChartMensal.destroy();\n            window.miniAppChartMensal = new Chart')
    with open('admin.js', 'w', encoding='utf-8') as f:
        f.write(admin_content)

# For m_irradiacao_gestao.js
with open('m_irradiacao_gestao.js', 'r', encoding='utf-8') as f:
    mirr_content = f.read()
if 'window.irrSemanalChartMobile = new Chart' in mirr_content:
    mirr_content = mirr_content.replace('window.irrSemanalChartMobile = new Chart', 'if(window.irrSemanalChartMobile) window.irrSemanalChartMobile.destroy();\n            window.irrSemanalChartMobile = new Chart')
    mirr_content = mirr_content.replace('window.irrTotalChartMobile = new Chart', 'if(window.irrTotalChartMobile) window.irrTotalChartMobile.destroy();\n            window.irrTotalChartMobile = new Chart')
    with open('m_irradiacao_gestao.js', 'w', encoding='utf-8') as f:
        f.write(mirr_content)

# For assistencia.js
with open('assistencia.js', 'r', encoding='utf-8') as f:
    ass_content = f.read()
if 'window.chartAssEntregasWebInstance' not in ass_content:
    ass_content = ass_content.replace("new Chart(ctx, {", "if(window.chartAssEntregasWebInstance) window.chartAssEntregasWebInstance.destroy();\n    window.chartAssEntregasWebInstance = new Chart(ctx, {", 1)
    ass_content = ass_content.replace("new Chart(ctx, {", "if(window.chartAssDemografiaWebInstance) window.chartAssDemografiaWebInstance.destroy();\n    window.chartAssDemografiaWebInstance = new Chart(ctx, {", 1)
    with open('assistencia.js', 'w', encoding='utf-8') as f:
        f.write(ass_content)

# For m_ass_estatisticas.js
with open('m_ass_estatisticas.js', 'r', encoding='utf-8') as f:
    mass_content = f.read()
if 'window.chartEntregasMobileInstance' not in mass_content:
    mass_content = mass_content.replace("new Chart(ctx, {", "if(window.chartEntregasMobileInstance) window.chartEntregasMobileInstance.destroy();\n        window.chartEntregasMobileInstance = new Chart(ctx, {", 1)
    mass_content = mass_content.replace("new Chart(ctx, {", "if(window.chartDemografiaMobileInstance) window.chartDemografiaMobileInstance.destroy();\n        window.chartDemografiaMobileInstance = new Chart(ctx, {", 1)
    with open('m_ass_estatisticas.js', 'w', encoding='utf-8') as f:
        f.write(mass_content)

# estatisticas_leituras.html
with open('estatisticas_leituras.html', 'r', encoding='utf-8') as f:
    leit_content = f.read()
if 'window.leiturasChartInstance = new Chart' not in leit_content:
    leit_content = leit_content.replace('const leiturasChart = new Chart', 'if(window.leiturasChartInstance) window.leiturasChartInstance.destroy();\n        window.leiturasChartInstance = new Chart')
    with open('estatisticas_leituras.html', 'w', encoding='utf-8') as f:
        f.write(leit_content)

print("Patch applied")
