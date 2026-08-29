import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://aymdooyafimliiggxeqs.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

req = urllib.request.Request(f"{url}/rest/v1/livros_catalogo?select=codigo,capa_url&limit=10", headers={
    "apikey": key,
    "Authorization": f"Bearer {key}"
})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print("livros_catalogo sample:", response.read().decode())
except Exception as e:
    print("Error:", e)
