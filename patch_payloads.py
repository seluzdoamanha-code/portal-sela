import re
with open('assistencia.js', 'r') as f:
    js = f.read()

js = re.sub(r"familia_id:\s*document\.getElementById\('assEntFamilia'\)\.value,", "pessoa_id: document.getElementById('assEntFamilia').value,", js)
js = re.sub(r"familia_id:\s*famId,", "pessoa_id: famId,", js)

with open('assistencia.js', 'w') as f:
    f.write(js)
