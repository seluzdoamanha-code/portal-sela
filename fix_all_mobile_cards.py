import glob

# Files to check
files = glob.glob('*.html') + glob.glob('*.js')
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Common fixes for the cards that were styled for dark mode
    content = content.replace(
        'background: rgba(255,255,255,0.03);',
        'background: var(--bg-panel); box-shadow: 0 2px 4px rgba(0,0,0,0.05);'
    )
    content = content.replace(
        'background: rgba(255,255,255,0.03)',
        'background: var(--bg-panel)'
    )
    # Fix white borders that became invisible
    content = content.replace(
        'border: 1px solid rgba(255,255,255,0.1)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(255, 255, 255, 0.1)',
        'border: 1px solid var(--border)'
    )
    # Fix the active states of cards that used white
    content = content.replace(
        'background: rgba(255,255,255,0.08);',
        'background: rgba(0,0,0,0.02);'
    )
    # Fix bottom sheet background
    content = content.replace(
        'background: #1e293b;', # Often used in bottom sheets
        'background: var(--bg-panel);'
    )
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Fixed invisible elements in {file}")

print(f"\nTotal files updated: {count}")
