import re

with open('admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add button "Ver todos do mês" in renderizarCalendarioAniversarios
target1 = r"(grid\.appendChild\(div\);\s*\}\);\s*\});\s*\}"
replacement1 = r"""grid.appendChild(div);
        });
    });
    
    // Adicionar botão para ver todos do mês no rodapé
    const footerDiv = document.createElement('div');
    footerDiv.style.gridColumn = "1 / -1";
    footerDiv.style.textAlign = "center";
    footerDiv.style.marginTop = "16px";
    footerDiv.innerHTML = `<button class="btn btn-secondary" onclick="renderizarListaAniversariantesSemana(1, ${diasNoMes}, ${mes}, ${ano})" style="width: 100%; max-width: 300px;">Ver todos aniversariantes do mês</button>`;
    grid.appendChild(footerDiv);
}"""

content = re.sub(target1, replacement1, content)

# Add "Ver Detalhes" button next to WhatsApp
target2 = r"(WhatsApp\s*</a>\s*` : ''})"
replacement2 = r"""\1
                <a href="index.html?edit=${p.id}" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 6px 12px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    Ver Detalhes
                </a>"""

content = re.sub(target2, replacement2, content)

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched admin.js")
