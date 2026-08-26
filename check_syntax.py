import sys
try:
    with open('familias.js', 'r') as f:
        code = f.read()
    print("Read JS successfully.")
except Exception as e:
    print(e)
