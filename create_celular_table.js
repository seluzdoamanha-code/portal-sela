const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODcxMDU1MywiZXhwIjoyMDM0Mjg2NTUzfQ.DvwT6g-nZ9o8gXp7c1vLZZKjGZQK3gB6h_8pQ5yRz94'; // Service Role Key if available, but I'll need to check if I can just use rpc.
