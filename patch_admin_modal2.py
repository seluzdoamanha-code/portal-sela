import re

with open('admin.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

target = r'style="background: rgba\(139, 92, 246, 0.1\); color: #8b5cf6; padding: 6px 12px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;"'
replacement = r'style="cursor: pointer; border: none; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 6px 12px; border-radius: 12px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;"'

js_content = re.sub(target, replacement, js_content)

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Button style patched")
