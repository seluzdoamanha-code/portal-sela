import re

with open('m_hub.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

target = r'(} else if \(nome\.includes\(\'atendimento\'\)\) \{)'
replacement = r"""} else if (nome.includes('evangelho')) {
            html += `
                <a href="m_evangelho_lar.html?id=${estruturaAtual.id}" class="m-app-card">
                    <div class="m-app-icon" style="background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">🏡</span>
                    </div>
                    <div class="m-app-name">Gestão do Evangelho</div>
                </a>
            `;
        \1"""

js_content = re.sub(target, replacement, js_content)

with open('m_hub.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("m_hub.js patched successfully")
