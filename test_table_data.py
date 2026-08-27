import urllib.request
import json

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

req = urllib.request.Request(f"{SUPABASE_URL}/usuarios_autorizados?select=nivel_acesso", headers={
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        levels = set(row['nivel_acesso'] for row in data)
        print("Levels:", levels)
except Exception as e:
    print("Error:", e)
