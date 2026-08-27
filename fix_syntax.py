import re
with open('assistencia.js', 'r') as f:
    js = f.read()

# I want to change:
# <button onclick="excluirEntregaAss('${e.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir (O estoque NÃO voltará automaticamente)">🗑️</button>
#                                         </td>
#                                     </tr>
#                                 `).join('')}

# to:
#                                     </tr>
#                                     `; }).join('')}

old = r"title=\"Excluir \(O estoque NÃO voltará automaticamente\)\">🗑️</button>\s*</td>\s*</tr>\s*`\)\.join\(''\)\}"
new = """title="Excluir (O estoque NÃO voltará automaticamente)">🗑️</button>
                                        </td>
                                    </tr>
                                    `; }).join('')}"""

js = re.sub(old, new, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
