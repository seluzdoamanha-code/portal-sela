from supabase import create_client, Client
import json
import os

with open('/Users/wagnercosta/Documents/antigravity/portal-sela/patch_sabrina.py', 'r') as f:
    for line in f:
        if "url = " in line:
            url = line.split("'")[1]
        if "key = " in line:
            key = line.split("'")[1]

supabase: Client = create_client(url, key)

# Check book SELA-1102
book_1102 = supabase.table('app_bib_acervo').select('id, codigo, titulo, capa_url, isbn').eq('codigo', 'SELA-1102').execute()
print("SELA-1102:", json.dumps(book_1102.data, indent=2))

# Check book SELA-0646
book_0646 = supabase.table('app_bib_acervo').select('id, codigo, titulo, capa_url, isbn').eq('codigo', 'SELA-0646').execute()
print("SELA-0646:", json.dumps(book_0646.data, indent=2))

