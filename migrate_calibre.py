import urllib.request
import json
import sqlite3
import os

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1/pessoas'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def formatar_nome(nome):
    if not nome: return nome
    excecoes = ['de', 'da', 'do', 'das', 'dos', 'e']
    palavras = nome.lower().split()
    resultado = []
    for p in palavras:
        if p in excecoes: resultado.append(p)
        else: resultado.append(p.capitalize())
    return " ".join(resultado)

def formatar_data(data_str):
    if not data_str or data_str.strip() == '': return None
    partes = data_str.split('/')
    if len(partes) == 3:
        return f"{partes[2]}-{partes[1]}-{partes[0]}"
    return None

# 1. Fetch current Names
req_get = urllib.request.Request(SUPABASE_URL + "?select=nome_completo", headers=headers)
try:
    with urllib.request.urlopen(req_get) as response:
        existentes = json.loads(response.read().decode('utf-8'))
        existentes_nomes = {p.get('nome_completo').strip().lower() for p in existentes if p.get('nome_completo')}
except Exception as e:
    exit(1)

# 2. Ler banco real do Calibre
db_path = os.path.expanduser('~/Calibre/AdminLuz_Dados/admin_data.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

injetados = 0

cursor.execute('''
    SELECT cpf, nome_completo, nome_curto, data_nascimento, relacao_principal, 
           celular, email, cep, endereco, bairro, cidade, estado 
    FROM pessoas
''')
pessoas_bd = cursor.fetchall()

for p in pessoas_bd:
    nome_comp = formatar_nome(p[1])
    if not nome_comp: continue
    
    if nome_comp.strip().lower() in existentes_nomes:
        continue
        
    perfis = [p[4]] if p[4] else []
    
    dados = {
        "tipo_pessoa": "Física",
        "cpf_cnpj": None,
        "nome_completo": nome_comp,
        "nome_curto": formatar_nome(p[2]),
        "data_nascimento": formatar_data(p[3]),
        "perfis": perfis,
        "celular": p[5],
        "email": p[6],
        "cep": p[7],
        "endereco": formatar_nome(p[8]) if p[8] else None,
        "bairro": formatar_nome(p[9]) if p[9] else None,
        "cidade": formatar_nome(p[10]) if p[10] else None,
        "estado": p[11]
    }
    
    req = urllib.request.Request(SUPABASE_URL, data=json.dumps(dados).encode('utf-8'), headers=headers, method='POST')
    try:
        urllib.request.urlopen(req)
        injetados += 1
        existentes_nomes.add(nome_comp.strip().lower())
    except Exception as e:
        msg = e.read().decode('utf-8')
        if 'invalid input syntax for type date' in msg or 'date/time field value out of range' in msg:
            dados['data_nascimento'] = None
            req2 = urllib.request.Request(SUPABASE_URL, data=json.dumps(dados).encode('utf-8'), headers=headers, method='POST')
            try:
                urllib.request.urlopen(req2)
                injetados += 1
                existentes_nomes.add(nome_comp.strip().lower())
            except Exception as e2:
                print(f"Erro fatal {nome_comp}: {e2.read().decode('utf-8')}")
        else:
            print(f"Erro ao inserir PF {nome_comp}: {msg}")

# Familias
try:
    cursor.execute("SELECT cpf, nome_completo FROM familias")
    fam_bd = cursor.fetchall()
    for f in fam_bd:
        nome_comp = formatar_nome(f[1])
        if not nome_comp or nome_comp.strip().lower() in existentes_nomes:
            continue
            
        dados = {
            "tipo_pessoa": "Física",
            "cpf_cnpj": None,
            "nome_completo": nome_comp,
            "perfis": ["Família Assistida"]
        }
        req = urllib.request.Request(SUPABASE_URL, data=json.dumps(dados).encode('utf-8'), headers=headers, method='POST')
        try:
            urllib.request.urlopen(req)
            injetados += 1
            existentes_nomes.add(nome_comp.strip().lower())
        except Exception: pass
except Exception:
    pass

req_final = urllib.request.Request(SUPABASE_URL + "?select=id", headers=headers)
with urllib.request.urlopen(req_final) as response:
    total_final = len(json.loads(response.read().decode('utf-8')))

print(f"Forçados para dentro com sucesso: {injetados}")
print(f"Total de registros na base final Supabase: {total_final}")
