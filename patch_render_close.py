import re
with open('assistencia.js', 'r') as f:
    js = f.read()

# Replace the closing of map
old_close = r"<td style=\"padding: 8px 4px; text-align: right;\">\s*<button onclick=\"excluirEntregaAss\('\$\{e\.id\}'\)\" style=\"background:none; border:none; color: #ef4444; cursor:pointer;\" title=\"Excluir Entrega\">🗑️</button>\s*</td>\s*</tr>\s*`\)\.join\(''\)\}"
new_close = """<td style="padding: 8px 4px; text-align: right;">
                                            <button onclick="excluirEntregaAss('${e.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir Entrega">🗑️</button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}"""

js = re.sub(old_close, new_close, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
