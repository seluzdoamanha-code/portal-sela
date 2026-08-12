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
const PAGE_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabBtns = document.querySelectorAll('.m-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            tabBtns.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            currentCategoria = button.getAttribute('data-categoria');
            
            // Centralizar aba ao clicar apenas horizontalmente
            const container = document.querySelector('.m-tabs-scroll');
            const scrollLeft = button.offsetLeft - (container.offsetWidth / 2) + (button.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            
            fetchLivros(true);
        });
    });

    // Load More
    document.getElementById('btnCarregarMais').addEventListener('click', () => {
        fetchLivros(false);
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchLivros(true);
        }, 500);
    });

    // Modal Actions
    document.getElementById('btnConfirmarReserva').addEventListener('click', enviarReserva);

    // Radios Desiderata
    document.querySelectorAll('input[name="desiderataAcao"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            const codInput = document.getElementById('desiderataCodigo');
            if (val === 'Permutar') {
                codInput.style.display = 'block';
            } else {
                codInput.style.display = 'none';
            }
        });
    });

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
    } catch (e) {
        console.error('Erro ao carregar contadores', e);
    }
}

async function fetchLivros(reset = false) {
    if (reset) {
        currentPage = 0;
        allLoadedBooks = {};
        document.getElementById('booksGrid').innerHTML = '';
        document.getElementById('booksGrid').style.display = 'none';
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('btnCarregarMais').style.display = 'none';
    } else {
        currentPage++;
    }

    try {
        let query = db.from('livros_catalogo').select('*').eq('categoria', currentCategoria);

        if (searchTerm) {
            query = query.or(`titulo.ilike.%${searchTerm}%,autor.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`);
        }

        query = query.order('titulo', { ascending: true })
                     .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

        const { data, error } = await query;
        
        if (error) throw error;

        document.getElementById('loadingState').style.display = 'none';
        
        if (reset && (!data || data.length === 0)) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        document.getElementById('booksGrid').style.display = 'grid';

        if (data && data.length > 0) {
            data.forEach(book => {
                allLoadedBooks[book.id] = book;
            });
            renderBooks(data);
        }

        if (data && data.length === PAGE_SIZE) {
            document.getElementById('btnCarregarMais').style.display = 'block';
        } else {
            document.getElementById('btnCarregarMais').style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        document.getElementById('loadingState').textContent = 'Erro ao carregar livros.';
    }
}

function renderBooks(books) {
    const grid = document.getElementById('booksGrid');
    books.forEach(book => {
        const coverUrl = book.capa_url || 'https://via.placeholder.com/300x450/2a2a2a/cccccc?text=Sem+Capa';
        
        const card = document.createElement('div');
        card.className = 'm-book-card';
        card.onclick = () => abrirModalLivro(book.id);
        
        card.innerHTML = `
            <img src="${coverUrl}" class="m-book-cover" alt="Capa" loading="lazy">
            <div class="m-book-info">
                <div class="m-book-title">${book.titulo}</div>
                <div class="m-book-author">${book.autor || 'Autor Desconhecido'}</div>
                <div class="m-book-codigo">${book.codigo || 'S/N'}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function abrirModalLivro(id) {
    const book = allLoadedBooks[id];
    if (!book) return;

    currentLivroId = book.id;
    currentLivroTitulo = book.titulo;
    currentLivroCategoria = book.categoria;

    document.getElementById('modalImg').src = book.capa_url || 'https://via.placeholder.com/300x450/2a2a2a/cccccc?text=Sem+Capa';
    document.getElementById('modalTitle').textContent = book.titulo;
    document.getElementById('modalAuthor').textContent = book.autor || 'Autor Desconhecido';
    document.getElementById('modalCodigo').textContent = book.codigo || 'S/N';
    document.getElementById('modalSinopse').innerHTML = book.sinopse ? book.sinopse.replace(/\n/g, '<br>') : 'Sinopse não disponível.';

    // Configurar os formulários dependendo da Categoria
    const formTitle = document.getElementById('formTitle');
    const btnConfirm = document.getElementById('btnConfirmarReserva');
    const desidForm = document.getElementById('desiderataForm');

    document.getElementById('reservaNome').value = '';
    document.getElementById('reservaContato').value = '';

    if (currentLivroCategoria === 'DESIDERATUM') {
        formTitle.textContent = 'Deseja Doar ou Permutar?';
        btnConfirm.textContent = 'Enviar Oferta';
        desidForm.style.display = 'block';
    } else {
        formTitle.textContent = currentLivroCategoria === 'PERMUTA' ? 'Solicitar Permuta' : 'Solicitar Empréstimo';
        btnConfirm.textContent = 'Confirmar Solicitação';
        desidForm.style.display = 'none';
    }

    // Tentar autocompletar com dados do usuário local se tiver logado
    const pessoaStr = localStorage.getItem('sela_user_profile');
    if (pessoaStr) {
        try {
            const pessoa = JSON.parse(pessoaStr);
            document.getElementById('reservaNome').value = pessoa.nome || '';
            document.getElementById('reservaContato').value = pessoa.telefone || pessoa.email || '';
        } catch(e){}
    }

    const overlay = document.getElementById('modalOverlay');
    const sheet = document.getElementById('modalSheet');
    
    overlay.style.display = 'flex';
    // Timeout para permitir a transição CSS
    setTimeout(() => {
        overlay.classList.add('active');
        sheet.classList.add('active');
    }, 10);
}

function fecharModal(event) {
    if (event && event.target.id !== 'modalOverlay' && event.target.tagName !== 'BUTTON') {
        return; // Só fecha se clicar no fundo escuro ou no botão (se houver via JS)
    }
    
    const overlay = document.getElementById('modalOverlay');
    const sheet = document.getElementById('modalSheet');
    
    overlay.classList.remove('active');
    sheet.classList.remove('active');
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

async function enviarReserva() {
    if (!currentLivroId) return;

    const nome = document.getElementById('reservaNome').value.trim();
    const contato = document.getElementById('reservaContato').value.trim();

    if (!nome || !contato) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Vazios',
            text: 'Por favor, preencha seu Nome e Contato para prosseguirmos.',
            background: 'var(--bg-panel)',
            color: 'white',
            confirmButtonColor: 'var(--primary)'
        });
        return;
    }

    let contatoFinal = contato;
    let msgSuccess = 'Sua solicitação de empréstimo foi registrada! Procure o responsável da Biblioteca no próximo encontro.';

    if (currentLivroCategoria === 'PERMUTA') {
        msgSuccess = 'Sua solicitação de permuta foi registrada! Leve seu livro para troca.';
    } else if (currentLivroCategoria === 'DESIDERATUM') {
        const acaoDesid = document.querySelector('input[name="desiderataAcao"]:checked').value;
        msgSuccess = 'Agradecemos sua oferta! Nossa equipe entrará em contato.';
        
        if (acaoDesid === 'Permutar') {
            const cod = document.getElementById('desiderataCodigo').value.trim();
            if (!cod) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Código Faltando',
                    text: 'Por favor, informe o código do seu livro para permuta.',
                    background: 'var(--bg-panel)',
                    color: 'white',
                    confirmButtonColor: 'var(--primary)'
                });
                return;
            }
            contatoFinal = `[PERMUTA: ${cod}] ` + contato;
        } else {
            contatoFinal = `[DOAÇÃO] ` + contato;
        }
    }

    const btn = document.getElementById('btnConfirmarReserva');
    const btnTextOriginal = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
        const { error } = await db.from('reservas_site').insert([{
            livro_id: currentLivroId,
            livro_titulo: currentLivroTitulo,
            leitor_nome: nome,
            leitor_contato: contatoFinal,
            status: 'PENDENTE'
        }]);

        if (error) throw error;

        fecharModal({ target: { id: 'modalOverlay' }}); // forçar fechamento
        
        Swal.fire({
            icon: 'success',
            title: 'Tudo Certo!',
            text: msgSuccess,
            background: 'var(--bg-panel)',
            color: 'white',
            confirmButtonColor: '#10b981'
        });

    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Oops',
            text: 'Erro ao enviar sua solicitação.',
            background: 'var(--bg-panel)',
            color: 'white',
            confirmButtonColor: 'var(--primary)'
        });
    } finally {
        btn.textContent = btnTextOriginal;
        btn.disabled = false;
    }
}
