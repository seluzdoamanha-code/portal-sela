import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/sidebar.js'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the block that still has admin.html for normal admins
old_block = """                    ${window.isAdmin && window.isAdmin() ? `
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>
                    <a href="admin.html" class="nav-item ${currentPage === 'admin.html' ? 'active' : ''}" title="Administração">🛠️ <span class="nav-text">Administração</span></a>
                    <a href="config.html" class="nav-item ${currentPage === 'config.html' ? 'active' : ''}" title="Configurações">⚙️ <span class="nav-text">Configurações</span></a>
                    ` : ''}"""

new_block = """                    ${window.isAdmin && window.isAdmin() ? `
                    <a href="config.html" class="nav-item ${currentPage === 'config.html' ? 'active' : ''}" title="Configurações">⚙️ <span class="nav-text">Configurações</span></a>
                    ` : ''}"""

content = content.replace(old_block, new_block)

# Also fix the bottom nav for mobile in sidebar.js
old_mobile = """                ${window.isAdmin && window.isAdmin() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin</span>
                </a>
                <a href="config.html" class="bottom-nav-item ${currentPage === 'config.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">⚙️</span>
                    <span class="bottom-nav-text">Ajustes</span>
                </a>
                ` : ''}"""

new_mobile = """                ${window.isAdminGlobal && window.isAdminGlobal() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin Global</span>
                </a>
                ` : ''}
                ${window.isAdmin && window.isAdmin() ? `
                <a href="config.html" class="bottom-nav-item ${currentPage === 'config.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">⚙️</span>
                    <span class="bottom-nav-text">Ajustes</span>
                </a>
                ` : ''}"""

content = content.replace(old_mobile, new_mobile)

with open(filepath, 'w') as f:
    f.write(content)
print("Sidebar fixed")
