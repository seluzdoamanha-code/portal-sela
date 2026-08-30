import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Append modal before </body>
modal_html = """
    <!-- Modal Side-Sheet Resumo Pessoa -->
    <div class="side-sheet-overlay" id="sideSheetResumoAniv" onclick="fecharSideSheetResumoAniv()"></div>
    <div class="side-sheet" id="panelResumoAniv">
        <div class="side-sheet-header">
            <h3>Detalhes do Aniversariante</h3>
            <button onclick="fecharSideSheetResumoAniv()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</button>
        </div>
        <div class="side-sheet-content" id="conteudoResumoAniv" style="padding: 24px;">
            Carregando...
        </div>
    </div>
"""

if 'id="sideSheetResumoAniv"' not in content:
    content = content.replace('</body>', f'{modal_html}\n</body>')
    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(content)

with open('admin.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Add open and close functions
js_funcs = """
window.abrirSideSheetResumoAniv = async function(id) {
    document.getElementById('sideSheetResumoAniv').classList.add('show');
    document.getElementById('panelResumoAniv').classList.add('show');
    const container = document.getElementById('conteudoResumoAniv');
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Carregando dados...</div>';
    
    try {
        const { data: p, error } = await db.from('pessoas').select('*').eq('id', id).single();
        if (error) throw error;
        
        const imgUrl = p.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome_completo)}&background=random`;
        
        let perfisTags = '';
        if (p.perfis && p.perfis.length > 0) {
            perfisTags = p.perfis.map(pf => `<span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${pf}</span>`).join(' ');
        }
        
        const partesNasc = p.data_nascimento ? p.data_nascimento.split('-') : null;
        let idadeStr = '';
        if (partesNasc) {
            const anoNasc = parseInt(partesNasc[0]);
            const diaAniv = parseInt(partesNasc[2]);
            const mesAniv = parseInt(partesNasc[1]);
            const anoAtual = new Date().getFullYear();
            idadeStr = `🎂 ${String(diaAniv).padStart(2, '0')}/${String(mesAniv).padStart(2, '0')} (Fará ${anoAtual - anoNasc} anos)`;
        }
        
        const telefoneUrl = p.celular ? `https://wa.me/55${p.celular.replace(/\D/g, '')}` : null;
        
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="${imgUrl}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 4px solid var(--border);">
                <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0;">${p.nome_completo}</h2>
                <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">${idadeStr}</div>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px;">
                    ${perfisTags}
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                    ${telefoneUrl ? `
                        <a href="${telefoneUrl}" target="_blank" style="width: 100%; max-width: 250px; background: #25D366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            Enviar WhatsApp
                        </a>
                    ` : ''}
                    <a href="pessoas.html?edit=${p.id}" target="_blank" style="width: 100%; max-width: 250px; background: rgba(255, 255, 255, 0.1); border: 1px solid var(--border); color: var(--text-main); padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        Abrir Cadastro Completo
                    </a>
                </div>
            </div>
            ${p.endereco || p.bairro ? `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Contato & Endereço</div>
                ${p.celular ? `<div style="font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color:var(--text-muted)">Celular:</span> <span>${p.celular}</span></div>` : ''}
                ${p.email ? `<div style="font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color:var(--text-muted)">E-mail:</span> <span>${p.email}</span></div>` : ''}
                ${p.endereco || p.bairro ? `<div style="font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color:var(--text-muted)">Endereço:</span> <span style="text-align: right;">${p.endereco || ''} ${p.bairro ? '- ' + p.bairro : ''}</span></div>` : ''}
                ${p.cidade || p.estado ? `<div style="font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color:var(--text-muted)">Local:</span> <span>${p.cidade || ''}/${p.estado || ''}</span></div>` : ''}
            </div>
            ` : ''}
        `;
        
    } catch (e) {
        container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 40px;">Erro ao carregar os dados.</div>`;
    }
};

window.fecharSideSheetResumoAniv = function() {
    document.getElementById('sideSheetResumoAniv').classList.remove('show');
    document.getElementById('panelResumoAniv').classList.remove('show');
};
"""

if 'window.abrirSideSheetResumoAniv' not in js_content:
    js_content += '\n' + js_funcs

# Replace the "Ver Detalhes" button in admin.js
target_btn = r'<a href="pessoas.html\?edit=\$\{p.id\}"([^>]*)>([^<]*)<svg([^>]*)>(.*?)</svg>([^<]*)Ver Detalhes([^<]*)</a>'
replacement_btn = r'<button onclick="abrirSideSheetResumoAniv(\'${p.id}\')" \1>\2<svg\3>\4</svg>\5Ver Detalhes\6</button>'

js_content = re.sub(target_btn, replacement_btn, js_content)

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Modal patched")
