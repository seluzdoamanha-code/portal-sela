const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentCategoria = 'DISPONÍVEL';
let currentLivroId = null;
let currentLivroTitulo = null;
let currentLivroCategoria = null;

let searchTerm = '';
let searchTimeout = null;

let allLoadedBooks = {};
let currentPage = 0;
const PAGE_SIZE = 24;

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            tabBtns.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentCategoria = button.getAttribute('data-categoria');
            fetchLivros(true);
        });
    });

    // Load More button
    document.getElementById('btnCarregarMais').addEventListener('click', () => {
        fetchLivros(false);
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchLivros(true);
        }, 500); // 500ms debounce
    });

    // Modal Confirmation
    document.getElementById('btnConfirmarReserva').addEventListener('click', enviarReserva);

    fetchLivros(true);
    carregarContadores();
});

async function carregarContadores() {
    try {
        const fetchCount = async (catName) => {
            const { count, error } = await db
                .from('livros_catalogo')
                .select('*', { count: 'exact', head: true })
                .eq('categoria', catName);
            return count || 0;
        };

        const cDisp = await fetchCount('DISPONÍVEL');
        const cPermuta = await fetchCount('PERMUTA');
        const cDesid = await fetchCount('DESIDERATUM');

        const sDisp = document.getElementById('countDisp');
        const sPerm = document.getElementById('countPerm');
        const sDesi = document.getElementById('countDesi');
        
        if (sDisp) sDisp.textContent = `(${cDisp})`;
        if (sPerm) sPerm.textContent = `(${cPermuta})`;
        if (sDesi) sDesi.textContent = `(${cDesid})`;
    } catch(e) { console.error("Erro ao carregar contadores:", e); }
}

async function fetchLivros(reset = false) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');
    const btnCarregarMais = document.getElementById('btnCarregarMais');

    if (reset) {
        currentPage = 0;
        grid.innerHTML = '';
        allLoadedBooks = {};
        grid.style.display = 'none';
        emptyState.style.display = 'none';
        btnCarregarMais.style.display = 'none';
        loading.style.display = 'block';
    } else {
        btnCarregarMais.innerText = "Carregando...";
        btnCarregarMais.disabled = true;
    }

    try {
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = db
            .from('livros_catalogo')
            .select('*', { count: 'exact' })
            .eq('categoria', currentCategoria);
            
        if (searchTerm) {
            query = query.or(`titulo.ilike.%${searchTerm}%,autor.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`);
        }
            
        const { data, error, count } = await query
            .order('titulo')
            .range(from, to);

        if (error) throw error;

        loading.style.display = 'none';

        if (reset && (!data || data.length === 0)) {
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        
        data.forEach(livro => {
            allLoadedBooks[livro.id] = livro;
            
            const card = document.createElement('div');
            card.className = 'book-card';
            card.onclick = () => abrirModal(livro.id);
            
            const noCacheUrl = `${livro.capa_url}?t=${new Date().getTime()}`;
            const codigoHtml = livro.codigo ? `<div class="book-codigo">${livro.codigo}</div>` : '';

            card.innerHTML = `
                <img src="${noCacheUrl}" class="book-cover" alt="Capa" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23333\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'Arial\\' font-size=\\'14\\' fill=\\'%23777\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Sem Capa</text></svg>'">
                <div class="book-info">
                    <div class="book-title">${livro.titulo}</div>
                    <div class="book-author">${livro.autor || 'Autor desconhecido'}</div>
                    ${codigoHtml}
                </div>
            `;
            grid.appendChild(card);
        });

        if (count > (currentPage + 1) * PAGE_SIZE) {
            btnCarregarMais.style.display = 'block';
            btnCarregarMais.innerText = "Carregar Mais";
            btnCarregarMais.disabled = false;
        } else {
            btnCarregarMais.style.display = 'none';
        }

        currentPage++;

    } catch (err) {
        console.error("Erro ao buscar livros:", err);
        if (reset) {
            loading.style.display = 'none';
            emptyState.innerHTML = "Ocorreu um erro ao carregar o acervo. Verifique sua conexão e tente novamente.";
            emptyState.style.display = 'block';
        } else {
            btnCarregarMais.innerText = "Erro. Tentar novamente";
            btnCarregarMais.disabled = false;
        }
    }
}

function abrirModal(id) {
    const livro = allLoadedBooks[id];
    if (!livro) return;

    currentLivroId = id;
    currentLivroTitulo = livro.titulo;
    currentLivroCategoria = livro.categoria;

    document.getElementById('modalImg').src = `${livro.capa_url}?t=${new Date().getTime()}`;
    document.getElementById('modalImg').onerror = function() {
        this.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23333'/><text x='50%' y='50%' font-family='Arial' font-size='14' fill='%23777' text-anchor='middle' dominant-baseline='middle'>Sem Capa</text></svg>";
    };
    
    document.getElementById('modalTitle').innerText = livro.titulo;
    document.getElementById('modalAuthor').innerText = livro.autor || 'Autor desconhecido';
    
    if (livro.codigo) {
        document.getElementById('modalCodigo').style.display = 'inline-block';
        document.getElementById('modalCodigo').innerText = livro.codigo;
    } else {
        document.getElementById('modalCodigo').style.display = 'none';
    }

    document.getElementById('modalSinopse').innerHTML = (livro.sinopse || 'Nenhuma sinopse disponível.').replace(/\\n/g, '<br>');

    if (livro.categoria === 'DESIDERATUM') {
        document.getElementById('formTitle').innerText = 'Declarar interesse em Permutar/Doar';
        document.getElementById('btnConfirmarReserva').innerText = 'Confirmar Interesse';
        document.getElementById('desiderataForm').style.display = 'block';
        document.getElementById('radioDoar').checked = true;
        document.getElementById('desiderataCodigo').style.display = 'none';
        document.getElementById('desiderataCodigo').value = '';
    } else {
        document.getElementById('formTitle').innerText = 'Reservar este livro';
        document.getElementById('btnConfirmarReserva').innerText = 'Confirmar Reserva';
        document.getElementById('desiderataForm').style.display = 'none';
    }
    
    document.getElementById('reservaNome').value = '';
    document.getElementById('reservaContato').value = '';
    
    document.getElementById('modalReserva').classList.add('show');
}

function fecharModal() {
    document.getElementById('modalReserva').classList.remove('show');
    currentLivroId = null;
    currentLivroTitulo = null;
    currentLivroCategoria = null;
}

async function enviarReserva() {
    const nome = document.getElementById('reservaNome').value.trim();
    let contato = document.getElementById('reservaContato').value.trim();

    if (!nome || !contato) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Vazios',
            text: 'Por favor, preencha seu nome e contato.',
            background: 'var(--card-bg)',
            color: 'white',
            confirmButtonColor: '#10b981'
        });
        return;
    }
    
    if (currentLivroCategoria === 'DESIDERATUM') {
        const isPermutar = document.getElementById('radioPermutar').checked;
        if (isPermutar) {
            const cod = document.getElementById('desiderataCodigo').value.trim();
            if (!cod) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Código Ausente',
                    text: 'Por favor, informe o código do seu livro para permuta.',
                    background: 'var(--card-bg)',
                    color: 'white',
                    confirmButtonColor: '#10b981'
                });
                return;
            }
            contato = `[PERMUTA: ${cod}] ` + contato;
        } else {
            contato = `[DOAÇÃO] ` + contato;
        }
    }

    const btn = document.getElementById('btnConfirmarReserva');
    const originalText = btn.innerText;
    btn.innerText = "Aguarde...";
    btn.disabled = true;

    try {
        const { error } = await db.from('reservas_site').insert([{
            livro_id: currentLivroId,
            livro_titulo: currentLivroTitulo,
            leitor_nome: nome,
            leitor_contato: contato,
            status: 'PENDENTE'
        }]);

        if (error) throw error;

        Swal.fire({
            icon: 'success',
            title: 'Tudo Certo!',
            text: `Sua solicitação para "${currentLivroTitulo}" foi enviada para a biblioteca.`,
            background: 'var(--card-bg)',
            color: 'white',
            confirmButtonColor: '#10b981'
        });
        fecharModal();
    } catch (err) {
        console.error("Erro ao reservar:", err);
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Ocorreu um erro ao enviar sua reserva. Tente novamente mais tarde.',
            background: 'var(--card-bg)',
            color: 'white',
            confirmButtonColor: '#10b981'
        });
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const radioDoar = document.getElementById('radioDoar');
    const radioPermutar = document.getElementById('radioPermutar');
    const inputCodigo = document.getElementById('desiderataCodigo');
    
    if(radioDoar && radioPermutar && inputCodigo) {
        radioDoar.addEventListener('change', () => {
            if(radioDoar.checked) inputCodigo.style.display = 'none';
        });
        radioPermutar.addEventListener('change', () => {
            if(radioPermutar.checked) inputCodigo.style.display = 'block';
        });
    }
    
    const inputContato = document.getElementById('reservaContato');
    if(inputContato) {
        inputContato.addEventListener('input', function(e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }
});
