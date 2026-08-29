import glob
import re

files = glob.glob('m_*.html')
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '--bg-dark: #0f172a;' in content:
        content = content.replace('--bg-dark: #0f172a;', '--bg-dark: #F1F5F9;')
        content = content.replace('--bg-card: #1e293b;', '--bg-card: #FFFFFF;')
        content = content.replace('--bg-panel: #1e293b;', '--bg-panel: #FFFFFF;')
        content = content.replace('--text-main: #f8fafc;', '--text-main: #1E293B;')
        content = content.replace('--text-muted: #94a3b8;', '--text-muted: #64748B;')
        content = content.replace('--border: #334155;', '--border: #CBD5E1;')
        
        # also fix rgba(255, 255, 255, 0.05) if it exists for filter pills
        content = content.replace('rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.05)')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated {file}")
    elif '--bg-body: #0f172a;' in content: # specific case
        content = content.replace('--bg-body: #0f172a;', '--bg-body: #F1F5F9;')
        content = content.replace('--text-main: #f8fafc;', '--text-main: #1E293B;')
        content = content.replace('--text-muted: #94a3b8;', '--text-muted: #64748B;')
        content = content.replace('--bg-panel: #1e293b;', '--bg-panel: #FFFFFF;')
        content = content.replace('--border: #334155;', '--border: #CBD5E1;')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated {file}")

print(f"\nTotal files updated: {count}")
