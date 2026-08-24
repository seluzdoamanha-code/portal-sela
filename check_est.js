const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://aymdooyafimliiggxeqs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU');

async function run() {
    const { data, error } = await sb.from('estruturas').select('*').limit(1);
    console.log(error || data);
}
run();
