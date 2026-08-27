def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    brackets = {'{': '}', '[': ']', '(': ')'}
    stack = []
    
    in_string = False
    string_char = ''
    in_template = False
    
    i = 0
    while i < len(content):
        c = content[i]
        
        if c == '\\':
            i += 2
            continue
            
        if not in_string and not in_template:
            if c in ['"', "'"]:
                in_string = True
                string_char = c
            elif c == '`':
                in_template = True
            elif c in brackets.keys():
                stack.append((c, i))
            elif c in brackets.values():
                if not stack:
                    return f"Unmatched {c} at index {i}"
                top, _ = stack.pop()
                if brackets[top] != c:
                    return f"Mismatched {top} and {c} at index {i}"
        elif in_string:
            if c == string_char:
                in_string = False
        elif in_template:
            if c == '`':
                in_template = False
            elif c == '$' and i+1 < len(content) and content[i+1] == '{':
                # this is actually a bit complex since template strings can have nested JS
                pass
        i += 1
        
    if stack:
        return f"Unclosed {stack[-1][0]} at index {stack[-1][1]}"
    return "Balanced!"

print(check_file('familias.js'))
