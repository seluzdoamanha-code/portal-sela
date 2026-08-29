from supabase import create_client, Client
import json
import os
import re

with open('/Users/wagnercosta/Documents/antigravity/portal-sela/patch_sabrina.py', 'r') as f:
    content = f.read()
    
url = re.search(r"url = '([^']+)'", content).group(1)
key = re.search(r"key = '([^']+)'", content).group(1)

supabase: Client = create_client(url, key)

b1102 = supabase.table('livros_catalogo').select('*').eq('codigo', 'SELA-1102').execute()
print("livros_catalogo SELA-1102:", json.dumps(b1102.data, indent=2))

b0646 = supabase.table('livros_catalogo').select('*').eq('codigo', 'SELA-0646').execute()
print("livros_catalogo SELA-0646:", json.dumps(b0646.data, indent=2))

