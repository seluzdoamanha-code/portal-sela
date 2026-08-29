import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const patchScript = fs.readFileSync('/Users/wagnercosta/Documents/antigravity/portal-sela/patch_sabrina.py', 'utf8')
const urlMatch = patchScript.match(/url = '([^']+)'/);
const keyMatch = patchScript.match(/key = '([^']+)'/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    const { data: b1102 } = await supabase.from('app_bib_acervo').select('id, codigo, titulo, capa_url, isbn, imagem_url').eq('codigo', 'SELA-1102');
    console.log('SELA-1102:', b1102);
    
    const { data: b0646 } = await supabase.from('app_bib_acervo').select('id, codigo, titulo, capa_url, isbn, imagem_url').eq('codigo', 'SELA-0646');
    console.log('SELA-0646:', b0646);
}
run();
