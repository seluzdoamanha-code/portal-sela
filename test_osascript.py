import subprocess
import os

filepath = os.path.abspath('admin.js')
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
print("STDOUT:", res.stdout.strip())
