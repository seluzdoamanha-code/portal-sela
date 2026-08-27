import urllib.request
import json
import ssl

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(f"{SUPABASE_URL}/pessoas?select=data_nascimento&not.data_nascimento.is.null", headers={
    'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'
})
res = urllib.request.urlopen(req, context=ctx).read()
data = json.loads(res.decode('utf-8'))
aug = [d for d in data if d['data_nascimento'] and d['data_nascimento'].split('-')[1] == '08']
print(f"Total August Birthdays: {len(aug)}")
