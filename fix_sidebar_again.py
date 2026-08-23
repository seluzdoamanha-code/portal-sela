import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/sidebar.js'
with open(filepath, 'r') as f:
    content = f.read()

# Fix desktop sidebar
bad_desktop = """                    ${window.isAdminGlobal && window.isAdminGlobal() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin</span>
                </a>
                ` : ''}"""
good_desktop = """                    ${window.isAdminGlobal && window.isAdminGlobal() ? `
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 16px;" class="desktop-only"></div>
                    <a href="admin.html" class="nav-item ${currentPage === 'admin.html' ? 'active' : ''}" title="Administração Global">🛠️ <span class="nav-text">Admin Global</span></a>
                    ` : ''}"""
content = content.replace(bad_desktop, good_desktop)

# Fix bottom nav
bad_bottom = """                ${window.isAdminGlobal && window.isAdminGlobal() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin</span>
                </a>
                ` : ''}
                    ${window.isAdmin && window.isAdmin() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin</span>
                </a>
                <a href="config.html" class="bottom-nav-item ${currentPage === 'config.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">⚙️</span>
                    <span class="bottom-nav-text">Config.</span>
                </a>
                ` : ''}"""
                
good_bottom = """                ${window.isAdminGlobal && window.isAdminGlobal() ? `
                <a href="admin.html" class="bottom-nav-item ${currentPage === 'admin.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">🛠️</span>
                    <span class="bottom-nav-text">Admin Global</span>
                </a>
                ` : ''}
                ${window.isAdmin && window.isAdmin() ? `
                <a href="config.html" class="bottom-nav-item ${currentPage === 'config.html' ? 'active' : ''}">
                    <span class="bottom-nav-icon">⚙️</span>
                    <span class="bottom-nav-text">Config.</span>
                </a>
                ` : ''}"""
                
content = content.replace(bad_bottom, good_bottom)

with open(filepath, 'w') as f:
    f.write(content)
print("Sidebar links fixed!")
