import subprocess
import os

for f in ['familias.js', 'm_dash_ocorrencias.js']:
    filepath = os.path.abspath(f)
    cmd = ['osascript', '-l', 'JavaScript', '-e', f'''
    try {{
        var text = $.NSString.stringWithContentsOfFileEncodingError("{filepath}", $.NSUTF8StringEncoding, null).js;
        var f = new Function(text);
        "OK";
    }} catch(e) {{
        e.toString();
    }}
    ''']
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(f, "STDOUT:", res.stdout.strip())
