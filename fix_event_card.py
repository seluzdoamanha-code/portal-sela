import glob
import re

files = glob.glob('*.js')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # We want to change the red card to a standard light theme card.
    # The red card is defined with:
    # background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center;
    
    content = re.sub(
        r"background:\s*rgba\(239,\s*68,\s*68,\s*0\.1\);\s*border:\s*1px solid #ef4444;\s*border-radius:\s*8px;\s*padding:\s*12px;\s*display:\s*flex;\s*gap:\s*12px;\s*align-items:\s*center;",
        "background: var(--bg-panel); border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center;",
        content
    )
    
    # Also fix the text color of the title
    # <div style="font-weight: 600; color: white; font-size: 14px;">${ev.titulo}</div>
    content = content.replace(
        'font-weight: 600; color: white; font-size: 14px;',
        'font-weight: 600; color: var(--text-main); font-size: 14px;'
    )
    # app.js already had color: var(--text-main) but let's make sure date block in app.js is white!
    # app.js: <div style="background: #ef4444; color: var(--text-main); border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
    content = content.replace(
        'background: #ef4444; color: var(--text-main); border-radius: 6px;',
        'background: #ef4444; color: white; border-radius: 6px;'
    )
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")

