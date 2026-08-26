import urllib.request
import json
import urllib.parse

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

req = urllib.request.Request(f"{SUPABASE_URL}/pessoas?select=id,nome_completo,perfis", headers={
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Total pessoas: {len(data)}")
        
        found = False
        for p in data:
            perfis = p.get('perfis')
            if perfis and 'Titular' in str(perfis):
                print(f"Found match: {p['nome_completo']} -> {perfis}")
                found = True
                
        if not found:
            print("Nenhuma pessoa encontrada com 'Titular' nos perfis.")
except Exception as e:
    print("Error:", e)
