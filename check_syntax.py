import subprocess
try:
    with open('check.js', 'w') as f:
        f.write("try { require('./sidebar.js'); console.log('OK'); } catch (e) { console.error(e); }")
    # I don't have node. Let's use python's json to at least check if there's any blatant syntax error... no, json can't.
    # What about python's re?
    print("Cannot run node.")
except Exception as e:
    print(e)
