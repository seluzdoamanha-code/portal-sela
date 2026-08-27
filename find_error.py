import subprocess
import os

with open('assistencia.js', 'r') as f:
    lines = f.readlines()

for i in range(1, len(lines)):
    text = "".join(lines[:i])
    # Write to a temp file and test
    with open('temp.js', 'w') as f2:
        f2.write(text)
    
    cmd = ['osascript', '-l', 'JavaScript', '-e', f'''
    try {{
        var text = $.NSString.stringWithContentsOfFileEncodingError("{os.path.abspath('temp.js')}", $.NSUTF8StringEncoding, null).js;
        var f = new Function(text);
        "OK";
    }} catch(e) {{
        e.toString();
    }}
    ''']
    res = subprocess.run(cmd, capture_output=True, text=True)
    if "SyntaxError" in res.stdout:
        print(f"Error happens at line {i}: {lines[i-1].strip()}")
        break
