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
    fraterno = req('app_atendimento_fraterno?select=status')
    print("Status in Fraterno:", set([f['status'] for f in fraterno if 'status' in f]))
    
    pacientes = req('app_pacientes?select=id')
    print("Total Pacientes:", len(pacientes))
except Exception as e:
    print(e)
