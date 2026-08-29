import re

with open('sidebar.js', 'r') as f:
    content = f.read()

# Remove toggleSidebarBtn
content = re.sub(r'<button id="toggleSidebarBtn".*?</button>', '', content, flags=re.DOTALL)

# Fix active logic in sidebarHTML
content = re.sub(r'\$\{currentPage === \'atividades\.html\' \|\| currentPage === \'hub\.html\' \? \'active\' : \'\'\}', r'${currentPage === \'atividades.html\' ? \'active\' : \'\'}', content)

# Remove sidebar-footer completely
content = re.sub(r'<div class="sidebar-footer".*?</div>\s*</aside>', r'</aside>', content, flags=re.DOTALL)

# Update sidebar HTML to match slim profile (icons only)
# Wait, replacing the nav items is better done by targeted regex
nav_item_pattern = r'<a href="(.*?)".*?title="(.*?)">.*?<span class="nav-text">.*?</span></a>'
def replacer(match):
    href = match.group(1)
    title = match.group(2)
    # determine icon based on href
    icon = '🏠'
    if 'atividades' in href: icon = '📅'
    elif 'pessoas' in href: icon = '👥'
    elif 'admin' in href: icon = '🛠️'
    elif 'config' in href: icon = '⚙️'
    
    active_cond = ""
    if href == 'index.html': active_cond = "${currentPage === 'index.html' ? 'active' : ''}"
    elif href == 'atividades.html': active_cond = "${currentPage === 'atividades.html' ? 'active' : ''}"
    elif href == 'pessoas.html': active_cond = "${currentPage === 'pessoas.html' || currentPage === 'perfil.html' ? 'active' : ''}"
    elif href == 'admin.html': active_cond = "${currentPage === 'admin.html' ? 'active' : ''}"
    elif href == 'config.html': active_cond = "${currentPage === 'config.html' ? 'active' : ''}"
    
    return f'<a href="{href}" class="nav-item {active_cond}" title="{title}">{icon}</a>'

content = re.sub(nav_item_pattern, replacer, content)

# Fix logo
content = re.sub(r'<div style="display: flex; align-items: center; gap: 12px;">\s*<img src="logo_sela\.png"[^>]+>\s*<h2[^>]+>Portal SELA</h2>\s*</div>', r'<div style="display: flex; justify-content: center; width: 100%;"><img src="logo_sela.png" alt="Logo SELA" style="height: 40px; width: 40px; border-radius: 50%; object-fit: cover;"></div>', content)

with open('sidebar.js', 'w') as f:
    f.write(content)

print("sidebar.js patched part 1")
