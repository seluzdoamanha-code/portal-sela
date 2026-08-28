import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# 1. Get Wagner Costa ID
wagner = supabase.table('pessoas').select('id, nome_completo').ilike('nome_completo', '%Wagner Costa%').execute()
print("Wagner:", wagner.data)

if wagner.data:
    wagner_id = wagner.data[0]['id']
    
    # 2. Get Sabrina's Fraterno record
    sabrina = supabase.table('app_atendimento_fraterno').select('id, paciente_id, status').ilike('nome_completo', '%Sabrina%').execute()
    print("Sabrina Fraterno:", sabrina.data)
    
    if sabrina.data:
        fraterno_id = sabrina.data[0]['id']
        
        # 3. Update Fraterno
        res_fraterno = supabase.table('app_atendimento_fraterno').update({'atendente_id': wagner_id}).eq('id', fraterno_id).execute()
        print("Updated Fraterno:", res_fraterno.data)
        
        # 4. Update Sessoes
        res_sessoes = supabase.table('app_atendimento_sessoes').update({'atendente_id': wagner_id}).eq('atendimento_id', fraterno_id).execute()
        print("Updated Sessoes:", res_sessoes.data)
