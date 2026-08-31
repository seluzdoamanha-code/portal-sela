import json
import urllib.request
import re

with open('config.js', 'r') as f:
    config = f.read()

url_match = re.search(r"SUPABASE_URL\s*=\s*['\"](.*?)['\"]", config)
key_match = re.search(r"SUPABASE_KEY\s*=\s*['\"](.*?)['\"]", config)

if url_match and key_match:
    SUPABASE_URL = url_match.group(1)
    SUPABASE_KEY = key_match.group(1)
    
    url = f"{SUPABASE_URL}/rest/v1/estruturas?select=id,nome,tipo"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Estruturas no Banco:")
        for d in data:
            print(f"- {d['nome']} ({d['tipo']})")
else:
    print("Could not parse supabase credentials")
