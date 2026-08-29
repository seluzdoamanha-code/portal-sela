import glob

# Files to check
files = glob.glob('m_*.html')
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = content.replace(
        'background: rgba(28, 25, 23, 0.95);',
        'background: rgba(255, 255, 255, 0.95);'
    )
    content = content.replace(
        'box-shadow: 0 -4px 24px rgba(0,0,0,0.5);',
        'box-shadow: 0 -4px 24px rgba(0,0,0,0.1);'
    )
    content = content.replace(
        'background: rgba(255,255,255,0.2);',
        'background: rgba(0,0,0,0.2);'
    )
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Fixed bottom sheet in {file}")

print(f"\nTotal files updated: {count}")
