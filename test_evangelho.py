import asyncio
from supabase import create_client
import json

with open('supabase_schema.json', 'r') as f:
    config = json.load(f)

url = config.get('url')
key = config.get('key')

if not url or not key:
    # try reading config.js
    import re
    with open('config.js', 'r') as f:
        content = f.read()
    url_match = re.search(r"const SUPABASE_URL = '(.*?)'", content)
    key_match = re.search(r"const SUPABASE_ANON_KEY = '(.*?)'", content)
    url = url_match.group(1) if url_match else None
    key = key_match.group(1) if key_match else None

supabase = create_client(url, key)

res1 = supabase.table('app_evangelho_lar').select('*, pessoas!app_evangelho_lar_pessoa_id_fkey(id)').execute()
print("Query 1 (with !):", res1)

res2 = supabase.table('app_evangelho_lar').select('*, pessoas(id)').execute()
print("Query 1 (without !):", res2)

res3 = supabase.table('app_atendimento_sessoes').select('id, data, app_atendimento_fraterno!inner(paciente_id, pessoas!inner(id))').eq('evangelho_lar', True).execute()
print("Query 3:", res3)
