import urllib.request
import json

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

payload = {
    "data_ocorrencia": "2026-08-27",
    "codigo": "RO9999",
    "pessoa_id": "00000000-0000-0000-0000-000000000000",
    "tipo": "Normal",
    "observacao": "Teste"
}

req = urllib.request.Request(f"{SUPABASE_URL}/ass_ocorrencias", data=json.dumps(payload).encode('utf-8'), headers={
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    if hasattr(e, 'read'):
        print("Error:", e.read().decode())
    else:
        print("Error:", e)
