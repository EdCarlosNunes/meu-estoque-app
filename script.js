// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration (Provided by User)
const firebaseConfig = {
    apiKey: "AIzaSyCZ6cK8glSTyIcIHR2ZXeGlEUAk-FLvN2g",
    authDomain: "meu-estoque-1bb9a.firebaseapp.com",
    projectId: "meu-estoque-1bb9a",
    storageBucket: "meu-estoque-1bb9a.firebasestorage.app",
    messagingSenderId: "331738983375",
    appId: "1:331738983375:web:63b69c7abdd274959500ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const btnAcaoAuth = document.getElementById('btnAcaoAuth');
const textoToggle = document.getElementById('textoToggle');
const btnToggleAuth = document.getElementById('btnToggleAuth');
const authError = document.getElementById('authError');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const btnLogout = document.getElementById('btnLogout');

const formCadastro = document.getElementById('cadastroForm');
const btnSalvarEstoque = document.getElementById('btnSalvarEstoque');
const btnSalvarTexto = document.getElementById('btnSalvarTexto');
const estoqueBody = document.getElementById('estoqueBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.querySelector('.table-container');

// State
let isLoginMode = true;
let currentUser = null;

// Inicializar inputs de data com a data atual
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('dataEntrada').value = hoje;
document.getElementById('dataValidade').value = hoje;

// ==========================================
// 1. AUTHENTICATION LOGIC
// ==========================================

// Toggle between Login and Register
btnToggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authError.textContent = '';
    
    if (isLoginMode) {
        btnAcaoAuth.textContent = 'Entrar';
        textoToggle.textContent = 'Não tem uma conta?';
        btnToggleAuth.textContent = 'Cadastrar-se';
    } else {
        btnAcaoAuth.textContent = 'Criar Conta';
        textoToggle.textContent = 'Já tem uma conta?';
        btnToggleAuth.textContent = 'Fazer Login';
    }
});

// Handle Login/Register Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    authError.textContent = '';
    btnAcaoAuth.disabled = true;
    btnAcaoAuth.textContent = 'Aguarde...';

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        console.error("Auth error:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            authError.textContent = 'E-mail ou senha incorretos.';
        } else if (error.code === 'auth/email-already-in-use') {
            authError.textContent = 'Este e-mail já está cadastrado.';
        } else if (error.code === 'auth/weak-password') {
            authError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
            authError.textContent = 'Erro de autenticação. Tente novamente.';
        }
    } finally {
        btnAcaoAuth.disabled = false;
        btnAcaoAuth.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
    }
});

// Logout
btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Auth State Observer - The core router
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Wipe clean the form just in case
        document.getElementById('password').value = '';
        
        // Load their specific data
        carregarEstoque();
    } else {
        // No user is signed in.
        currentUser = null;
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        estoqueBody.innerHTML = ''; // Clear table
    }
});

// ==========================================
// 2. FIRESTORE DATABASE LOGIC
// ==========================================

// Utilitários de Data
function formataDataBR(dataISO) {
    const partes = dataISO.split('-');
    if(partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function classificarStatus(dataValidadeISO) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    const[y, m, d] = dataValidadeISO.split('-');
    const validade = new Date(y, m-1, d);
    validade.setHours(0,0,0,0);

    const diffTime = validade - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { texto: 'Vencido', classe: 'status-danger' };
    } else if (diffDays <= 30) {
        return { texto: 'Atenção', classe: 'status-warning' };
    } else {
        return { texto: 'OK', classe: 'status-ok' };
    }
}

// Fetch Data from Firestore
async function carregarEstoque() {
    if (!currentUser) return;
    
    loadingState.style.display = 'block';
    tableContainer.style.display = 'none';
    emptyState.style.display = 'none';
    estoqueBody.innerHTML = '';

    try {
        const estoqueRef = collection(db, "estoque");
        // Query to get ONLY the current user's items, sorted by validade
        const q = query(estoqueRef, where("userId", "==", currentUser.uid), orderBy("validade", "asc"));
        
        const querySnapshot = await getDocs(q);
        const itens = [];
        
        querySnapshot.forEach((doc) => {
            itens.push({ id: doc.id, ...doc.data() });
        });

        if (itens.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            loadingState.style.display = 'none';
            tableContainer.style.display = 'block';
            
            itens.forEach(item => {
                const tr = document.createElement('tr');
                const status = classificarStatus(item.validade);

                tr.innerHTML = `
                    <td>${item.nome}</td>
                    <td>${item.peso}</td>
                    <td>${formataDataBR(item.entrada)}</td>
                    <td><strong>${formataDataBR(item.validade)}</strong></td>
                    <td>R$ ${Number(item.precoUnitario).toFixed(2)}</td>
                    <td><span class="status-badge ${status.classe}">${status.texto}</span></td>
                    <td><button class="btn-baixa" data-id="${item.id}">Baixa ✓</button></td>
                `;
                estoqueBody.appendChild(tr);
            });

            // Bind delete events
            document.querySelectorAll('.btn-baixa').forEach(btn => {
                btn.addEventListener('click', (e) => removerItem(e.target.getAttribute('data-id'), e.target));
            });
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        loadingState.innerHTML = `<p style="color:red">Erro ao carregar dados. Se é a primeira vez, o Firebase pode exigir a criação de um Índice.</p>`;
    }
}

// Submissão do Formulário (Salvar no Firestore com Loop)
formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    btnSalvarEstoque.disabled = true;
    btnSalvarTexto.textContent = 'Salvando na Nuvem...';

    const nome = document.getElementById('nome').value.trim();
    const quantidade = parseInt(document.getElementById('quantidade').value, 10);
    const peso = parseFloat(document.getElementById('peso').value);
    const entrada = document.getElementById('dataEntrada').value;
    const validade = document.getElementById('dataValidade').value;
    const precoTotal = parseFloat(document.getElementById('preco').value);

    const precoUnitario = precoTotal / quantidade;
    
    try {
        const estoqueRef = collection(db, "estoque");
        
        // ⚠️ Regra de Negócio Crítica: Loop para Cadastro Individual Assíncrono
        const promessas = [];
        
        for (let i = 0; i < quantidade; i++) {
            const novoItem = {
                userId: currentUser.uid, // Tie item to user
                nome: nome,
                peso: peso,
                entrada: entrada,
                validade: validade,
                precoUnitario: precoUnitario,
                timestamp: Date.now() // For strict ordering if needed later
            };
            promessas.push(addDoc(estoqueRef, novoItem));
        }

        // Wait for all units to be saved
        await Promise.all(promessas);
        
        // Reset form keeping dates
        document.getElementById('nome').value = '';
        document.getElementById('quantidade').value = '1';
        document.getElementById('preco').value = '';
        document.getElementById('nome').focus();
        
        // Refresh Table
        carregarEstoque();
        
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Ocorreu um erro ao salvar no banco de dados.");
    } finally {
        btnSalvarEstoque.disabled = false;
        btnSalvarTexto.textContent = 'Cadastrar no Banco';
    }
});

// Ação: Remover Item por Document ID do Firestore
async function removerItem(docId, btnElement) {
    if (!currentUser) return;
    
    // Visual feedback
    btnElement.textContent = 'Apagando...';
    btnElement.disabled = true;
    
    try {
        await deleteDoc(doc(db, "estoque", docId));
        // Remove row perfectly from DOM without full refresh
        const row = btnElement.closest('tr');
        row.remove();
        
        // Check if table is empty now
        if (estoqueBody.children.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error("Erro ao remover:", error);
        alert("Erro ao remover o item da nuvem.");
        btnElement.textContent = 'Baixa ✓';
        btnElement.disabled = false;
    }
}
