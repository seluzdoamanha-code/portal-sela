import re
import os

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/auth_guard.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add isAdminGlobal
is_admin_global_func = """
window.isAdminGlobal = function() {
    try {
        const profStr = localStorage.getItem('sela_user_profile');
        if (!profStr) return false;
        const prof = JSON.parse(profStr);
        return prof.nivel_acesso === 'admin_global';
    } catch(e) {
        return false;
    }
};
"""

content = content + "\n" + is_admin_global_func

# 2. Modify isAdmin to include admin_global
old_admin = "return prof.nivel_acesso === 'admin';"
new_admin = "return prof.nivel_acesso === 'admin' || prof.nivel_acesso === 'admin_global';"
content = content.replace(old_admin, new_admin)

# 3. Add guard logic for admin.html
guard_logic = """
    // Bloquear acesso a páginas de configurações para não-admins
    if (filename === 'config.html' && userProfile.nivel_acesso !== 'admin' && userProfile.nivel_acesso !== 'admin_global') {
        alert("Acesso restrito: Apenas administradores podem acessar as configurações.");
        window.location.replace('index.html');
        return;
    }
    if (filename === 'admin.html' && userProfile.nivel_acesso !== 'admin_global') {
        alert("Acesso restrito: Apenas administradores globais podem acessar a Administração Global.");
        window.location.replace('index.html');
        return;
    }
"""

# Replace existing config.html check
import re
content = re.sub(r"// Bloquear acesso a páginas de configurações para não-admins.*?return;\s*\}", guard_logic, content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)
print("auth_guard.js updated")
