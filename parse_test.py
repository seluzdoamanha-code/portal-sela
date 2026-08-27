import urllib.request

try:
    with open('familias.js', 'r') as f:
        code = f.read()
    print("Code read ok. Checking syntax using a third-party JS parser API or just simple python checks...")
except Exception as e:
    print(e)
