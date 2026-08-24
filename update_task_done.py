filepath = '/Users/wagnercosta/.gemini/antigravity-ide/brain/a9e367ab-a0c8-48fd-baf3-dd2bb6a72d41/task.md'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('- [ ] ', '- [x] ')
with open(filepath, 'w') as f:
    f.write(content)
