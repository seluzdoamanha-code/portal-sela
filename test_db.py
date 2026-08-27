import urllib.request
import json

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

def req(path):
    r = urllib.request.Request(f"{SUPABASE_URL}/{path}", headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    })
    return json.loads(urllib.request.urlopen(r).read().decode())

try:
    trat = req('app_atendimento_tratamentos?select=tipo,status')
    sessoes = req('app_atendimento_sessoes?select=tipo,status')
    
    print("Tratamentos Tipos:", set([t.get('tipo') for t in trat]))
    print("Tratamentos Status:", set([t.get('status') for t in trat]))
    print("Sessoes Tipos:", set([s.get('tipo') for s in sessoes]))
except Exception as e:
    print(e)
