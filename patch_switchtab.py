import re
with open('admin.js', 'r') as f:
    js = f.read()

old_array = r"const tabs = \['perfil', 'dados', 'lista', 'cards', 'miniapps', 'irradiacao', 'tabelas', 'usuarios'\];"
new_array = "const tabs = ['perfil', 'dados', 'lista', 'cards', 'miniapps', 'irradiacao', 'tabelas', 'usuarios', 'atendimento'];"

js = re.sub(old_array, new_array, js)

with open('admin.js', 'w') as f:
    f.write(js)
