import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/auth_guard.js'
with open(filepath, 'r') as f:
    content = f.read()

# Fix podeEditarPessoas
old_pessoas = "return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'secretaria');"
new_pessoas = "return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global' || prof.nivel_acesso === 'secretaria');"
content = content.replace(old_pessoas, new_pessoas)

# Fix podeEditarAssistidas
old_assist = "return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'secretaria' || prof.nivel_acesso === 'assistencia');"
new_assist = "return (prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global' || prof.nivel_acesso === 'secretaria' || prof.nivel_acesso === 'assistencia');"
content = content.replace(old_assist, new_assist)

# Fix m_config.html check
old_m_config = "if (filename === 'm_config.html' && userProfile.nivel_acesso !== 'admin')"
new_m_config = "if (filename === 'm_config.html' && userProfile.nivel_acesso !== 'admin' && userProfile.nivel_acesso !== 'admin_global')"
content = content.replace(old_m_config, new_m_config)

with open(filepath, 'w') as f:
    f.write(content)
print("auth_guard permissions patched")
