const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const { createClient } = require('@supabase/supabase-js');
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await db.from('app_atendimento_tratamentos').select('presente').limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
}
check();
