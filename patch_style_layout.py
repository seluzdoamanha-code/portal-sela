import re

with open('style.css', 'r') as f:
    content = f.read()

# Update .sidebar
sidebar_css = """/* Sidebar Modern (Slim + Deep Blue) */
.sidebar {
    width: 80px;
    background-color: #0B192C; /* Deep Blue from mockup */
    border-right: none;
    display: flex;
    flex-direction: column;
    z-index: 1000;
}

.sidebar .logo-area h2,
.sidebar .nav-item span.nav-text,
.sidebar .desktop-only,
.sidebar .hide-on-collapse {
    display: none !important;
}

.sidebar .show-on-collapse {
    display: flex !important;
    justify-content: center;
    align-items: center;
}

.sidebar .sidebar-footer { padding: 16px 0 !important; border-top: 1px solid rgba(255,255,255,0.1) !important; } 

.sidebar .logo-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px 0;
    gap: 12px;
}

.sidebar .nav-item {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 0;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    transition: all 0.2s;
    font-size: 20px;
    position: relative;
}

.sidebar .nav-item:hover {
    color: #FFFFFF;
    background: rgba(255,255,255,0.05);
}

.sidebar .nav-item.active {
    color: #FA9128; /* Orange Accent */
}

.sidebar .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 24px;
    width: 4px;
    background-color: #FA9128;
    border-radius: 0 4px 4px 0;
}
"""

content = re.sub(r'\.sidebar \{.*?(?=\.sidebar-backdrop \{)', sidebar_css, content, flags=re.DOTALL)

# Add topbar user profile styles
topbar_css = """
.topbar-profile-area {
    display: flex;
    align-items: center;
    gap: 16px;
}
.topbar-profile-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    padding: 4px 12px 4px 4px;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.2s;
}
.topbar-profile-btn:hover {
    background: rgba(0,0,0,0.02);
}
.topbar-profile-btn img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}
.topbar-profile-btn span {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-main);
}
"""

content = content.replace('.topbar {', topbar_css + '\n.topbar {')

with open('style.css', 'w') as f:
    f.write(content)

print("style.css updated successfully")
