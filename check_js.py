import sys

def check(file):
    try:
        with open(file) as f:
            content = f.read()
        # Just simple parenthesis and bracket matching
        braces = 0
        for c in content:
            if c == '{': braces += 1
            elif c == '}': braces -= 1
        if braces != 0:
            print("Brace mismatch!")
            return False
        return True
    except Exception as e:
        print(e)
        return False
check('sidebar.js')
