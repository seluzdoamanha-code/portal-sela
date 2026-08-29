import urllib.request
import json

url = 'https://aymdooyafimliiggxeqs.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

def query(codigo):
    req = urllib.request.Request(f"{url}/rest/v1/app_bib_acervo?codigo=eq.{codigo}&select=*", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}"
    })
    try:
        with urllib.request.urlopen(req) as response:
            print(f"app_bib_acervo {codigo}:", response.read().decode())
    except Exception as e:
        print(f"Error {codigo}:", e)

query('SELA-1102')
query('SELA-0646')

