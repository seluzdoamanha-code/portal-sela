import re

with open('admin.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace the "Fazendo X anos" in the list
def replacer(match):
    prefix = match.group(1)
    return prefix + """
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataAniv = new Date(hoje.getFullYear(), mes, diaAniv);
        let verboList = "";
        if (dataAniv < hoje) {
            verboList = `Tem ${idadeQueFara}`;
        } else if (dataAniv > hoje) {
            verboList = `Fará ${idadeQueFara}`;
        } else {
            verboList = `Faz ${idadeQueFara} hoje!`;
        }
        
        return `"""

target = r'(const imgUrl = [^;]+;\s*return `)'
js_content = re.sub(target, replacer, js_content)

js_content = js_content.replace('Fazendo ${idadeQueFara} anos', '${verboList} anos')

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("List logic patched")
