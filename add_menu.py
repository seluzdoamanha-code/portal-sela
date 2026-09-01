import glob

# Files to update
files = glob.glob('/Users/wagnercosta/Documents/antigravity/portal-sela/*.html')
# don't touch mobile for now
files = [f for f in files if not f.split('/')[-1].startswith('m_')]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
        
    if 'Portal do Associado' in content:
        continue
        
    # We want to add it right above "Biblioteca"
    if '<a href="#" class="nav-item" data-target="biblioteca">📚 Biblioteca</a>' in content:
        content = content.replace(
            '<a href="#" class="nav-item" data-target="biblioteca">📚 Biblioteca</a>',
            '<a href="associados.html" class="nav-item" data-target="associados">🤝 Portal do Associado</a>\n                <a href="#" class="nav-item" data-target="biblioteca">📚 Biblioteca</a>'
        )
        
        with open(filepath, 'w') as f:
            f.write(content)
            print(f"Updated {filepath}")
