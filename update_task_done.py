filepath = '/Users/wagnercosta/.gemini/antigravity-ide/brain/a9e367ab-a0c8-48fd-baf3-dd2bb6a72d41/task.md'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('- [ ] 1. ', '- [x] 1. ')
content = content.replace('- [ ] 2. ', '- [x] 2. ')
content = content.replace('- [ ] 2.1 ', '- [x] 2.1 ')
content = content.replace('- [ ] 2.2 ', '- [x] 2.2 ')
content = content.replace('- [ ] 3. ', '- [x] 3. ')
content = content.replace('- [ ] 3.1 ', '- [x] 3.1 ')
content = content.replace('- [ ] 3.2 ', '- [x] 3.2 ')
content = content.replace('- [ ] 3.3 ', '- [x] 3.3 ')

with open(filepath, 'w') as f:
    f.write(content)
