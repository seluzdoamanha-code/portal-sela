import re

for filepath in ['/Users/wagnercosta/Documents/antigravity/portal-sela/admin.html', '/Users/wagnercosta/Documents/antigravity/portal-sela/hub.html']:
    with open(filepath, 'r') as f:
        content = f.read()

    old_div = """<div class="modal-content" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">"""
    new_div = """<div class="modal-content" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; padding: 24px;">"""
    
    content = content.replace(old_div, new_div)

    with open(filepath, 'w') as f:
        f.write(content)
print("Modals patched with padding")
