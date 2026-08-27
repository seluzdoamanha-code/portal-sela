import urllib.request
import json
import ssl

SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def check_col(table, col):
    req = urllib.request.Request(f"{SUPABASE_URL}/{table}?select={col}&limit=1", headers={
        'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'
    })
    try:
        urllib.request.urlopen(req, context=ctx).read()
        return True
    except:
        return False

tables_to_check = {
    'vinculos_estrutura': ['pessoa_id'],
    'pessoas_relacionamentos': ['pessoa_id', 'pessoa_relacionada_id'],
    'app_pacientes': ['pessoa_id'],
    'app_atendimento_fraterno': ['pessoa_id', 'paciente_id'],
    'app_atendimento_tratamentos': ['pessoa_id', 'paciente_id'],
    'app_irradiacao_solicitacoes': ['pessoa_id', 'solicitante_id', 'paciente_id'],
    'ass_familias': ['responsavel_id', 'pessoa_id'],
    'ass_membros_familia': ['pessoa_id'],
    'ass_entregas': ['pessoa_id', 'recebedor_id'],
    'ass_ocorrencias': ['pessoa_id', 'relator_id']
}

for table, cols in tables_to_check.items():
    valid = []
    for c in cols:
        if check_col(table, c):
            valid.append(c)
    print(f"{table}: {valid}")

