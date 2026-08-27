import re
import os

files_to_patch = [
    'assistencia.js',
    'm_ass_entregas.js',
    'm_ass_entrega_coletiva.js',
    'm_dash_entregas.js'
]

old_date = r"new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]"
new_date = "new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0]"

for filename in files_to_patch:
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            js = f.read()
        
        js = re.sub(old_date, new_date, js)
        
        with open(filename, 'w') as f:
            f.write(js)
        print(f"Patched {filename}")

