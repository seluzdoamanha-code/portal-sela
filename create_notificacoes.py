import urllib.request
import ssl
import json
import uuid

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://aymdooyafimliiggxeqs.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU'

sql = """
CREATE TABLE IF NOT EXISTS app_notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID REFERENCES pessoas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    link TEXT,
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE app_notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON app_notificacoes;
CREATE POLICY "Usuários podem ver suas próprias notificações" ON app_notificacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Qualquer um pode inserir notificações" ON app_notificacoes;
CREATE POLICY "Qualquer um pode inserir notificações" ON app_notificacoes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Qualquer um pode atualizar notificações" ON app_notificacoes;
CREATE POLICY "Qualquer um pode atualizar notificações" ON app_notificacoes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Qualquer um pode deletar notificações" ON app_notificacoes;
CREATE POLICY "Qualquer um pode deletar notificações" ON app_notificacoes FOR DELETE USING (true);
"""

req = urllib.request.Request(f"{url}/rest/v1/rpc/exec_sql", headers={
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}, data=json.dumps({"sql_string": sql}).encode())

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print("Success:", response.read().decode())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
