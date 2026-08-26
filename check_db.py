import urllib.request
import json
import urllib.parse

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

req = urllib.request.Request(f"{SUPABASE_URL}/", headers={
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Accept-Profile': 'public'
})
# To check constraints, actually PostgREST doesn't expose constraints easily unless we query pg_class.
# Let's try to upsert manually with python to see if it throws an error.
payload = {"pessoa_id": "17da2b40-dbe1-4e32-a354-890af4279fdf", "codigo": "A20", "status": "Ativa", "tipo": "Fixa/Assistida"}
req2 = urllib.request.Request(f"{SUPABASE_URL}/ass_familias_meta?on_conflict=pessoa_id", headers={
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}, data=json.dumps(payload).encode('utf-8'))

try:
    with urllib.request.urlopen(req2) as response:
        print("Upsert successful:", response.read().decode())
except Exception as e:
    print("Upsert Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
