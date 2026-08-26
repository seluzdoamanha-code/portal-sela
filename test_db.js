const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Testing .contains...");
    const { data: d1, error: e1 } = await db.from('pessoas')
        .select('id, nome_completo, perfis')
        .contains('perfis', ['Titular da Família']);
    console.log("contains count:", d1 ? d1.length : 0);
    if (e1) console.error(e1);

    console.log("Testing .ilike...");
    const { data: d2, error: e2 } = await db.from('pessoas')
        .select('id, nome_completo, perfis')
        .ilike('perfis', '%Titular da Família%');
    console.log("ilike count:", d2 ? d2.length : 0);
    if (e2) console.error(e2);
}
run();
