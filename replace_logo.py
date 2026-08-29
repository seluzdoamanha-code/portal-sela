import os
import glob

files = glob.glob('*.html') + glob.glob('*.js')
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'logo_sela.png' in content:
        content = content.replace('logo_sela.png', 'logo_sela_color.png')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated {file}")

print(f"\nTotal files updated: {count}")
