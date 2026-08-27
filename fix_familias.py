with open('familias.js', 'r') as f:
    lines = f.readlines()

# lines is 0-indexed. line 416 is lines[415]
# We want to delete from line 416 to line 443 inclusive.
del lines[415:443]

with open('familias.js', 'w') as f:
    f.writelines(lines)
