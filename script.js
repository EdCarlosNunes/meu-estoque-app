// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCZ6cK8glSTyIcIHR2ZXeGlEUAk-FLvN2g",
    authDomain: "meu-estoque-1bb9a.firebaseapp.com",
    projectId: "meu-estoque-1bb9a",
    storageBucket: "meu-estoque-1bb9a.firebasestorage.app",
    messagingSenderId: "331738983375",
    appId: "1:331738983375:web:63b69c7abdd274959500ba"
};

// Start Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const btnAcaoAuth = document.getElementById('btnAcaoAuth');
const authError = document.getElementById('authError');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const btnLogout = document.getElementById('btnLogout');

// Auth Tabs (from Inputs)
const tabLoginInput = document.getElementById('tabLoginInput');
const tabRegisterInput = document.getElementById('tabRegisterInput');

const formCadastro = document.getElementById('cadastroForm');
const btnSalvarEstoque = document.getElementById('btnSalvarEstoque');
const estoqueBody = document.getElementById('estoqueBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.querySelector('.table-container');

// Analytics DOM
const analyticsPanel = document.getElementById('analyticsPanel');

// State
let isLoginMode = true;
let currentUser = null;
let chartValidadeInstance = null;
let chartReposicaoInstance = null;

// Configurar datas de hoje nos inputs
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('dataEntrada').value = hoje;
document.getElementById('dataValidade').value = hoje;

// ==========================================
// 1. AUTHENTICATION (Login / Cadastro explícito)
// ==========================================

tabLoginInput.addEventListener('change', () => {
    isLoginMode = true;
    btnAcaoAuth.textContent = 'Entrar no Sistema';
    authError.textContent = '';
});

tabRegisterInput.addEventListener('change', () => {
    isLoginMode = false;
    btnAcaoAuth.textContent = 'Criar Conta Nova';
    authError.textContent = '';
});

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
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            authError.textContent = 'E-mail ou senha incorretos.';
        } else if (error.code === 'auth/email-already-in-use') {
            authError.textContent = 'Este e-mail já possui uma conta.';
        } else if (error.code === 'auth/weak-password') {
            authError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
            authError.textContent = 'Erro ao conectar. Tente novamente.';
        }
    } finally {
        btnAcaoAuth.disabled = false;
        btnAcaoAuth.textContent = isLoginMode ? 'Entrar no Sistema' : 'Criar Conta Nova';
    }
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        carregarEstoque();
    } else {
        currentUser = null;
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
});

// ==========================================
// 2. FIRESTORE DATABASE E TABELA
// ==========================================

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
    const diffDays = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { texto: 'Vencido', classe: 'status-danger', dias: diffDays };
    if (diffDays <= 30) return { texto: 'Atenção', classe: 'status-warning', dias: diffDays };
    return { texto: 'OK', classe: 'status-ok', dias: diffDays };
}

async function carregarEstoque() {
    if (!currentUser) return;
    
    loadingState.style.display = 'block';
    tableContainer.style.display = 'none';
    emptyState.style.display = 'none';
    analyticsPanel.style.display = 'none';
    estoqueBody.innerHTML = '';

    try {
        const estoqueRef = collection(db, "estoque");
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
            analyticsPanel.style.display = 'block'; // Mostrar gráficos
            
            itens.forEach(item => {
                const tr = document.createElement('tr');
                const status = classificarStatus(item.validade);

                tr.innerHTML = `
                    <td><strong>${item.nome}</strong></td>
                    <td>${item.peso}</td>
                    <td>${formataDataBR(item.validade)}</td>
                    <td>R$ ${Number(item.precoUnitario).toFixed(2).replace('.', ',')}</td>
                    <td><span class="badge ${status.classe}">${status.texto}</span></td>
                    <td><button class="btn-delete" data-id="${item.id}">Apagar</button></td>
                `;
                estoqueBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => removerItem(e.target.getAttribute('data-id')));
            });

            // Rodar as análises assim que carregar!
            atualizarAnalytics(itens);
        }
    } catch (error) {
        console.error("Erro na busca", error);
        loadingState.innerHTML = `<p style="color:red">Ocorreu um problema ao baixar. Tentando novamente...</p>`;
    }
}

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    btnSalvarEstoque.disabled = true;
    document.getElementById('btnSalvarTexto').textContent = 'Salvando na Nuvem...';

    const nome = document.getElementById('nome').value.trim();
    const quantidade = parseInt(document.getElementById('quantidade').value, 10);
    const peso = parseFloat(document.getElementById('peso').value);
    const entrada = document.getElementById('dataEntrada').value;
    const validade = document.getElementById('dataValidade').value;
    const precoTotal = parseFloat(document.getElementById('preco').value);
    const precoUnitario = precoTotal / quantidade;
    
    try {
        const estoqueRef = collection(db, "estoque");
        const promessas = [];
        
        // LOOP DE CADASTRO!
        for (let i = 0; i < quantidade; i++) {
            promessas.push(addDoc(estoqueRef, {
                userId: currentUser.uid,
                nome: nome,
                peso: peso,
                entrada: entrada,
                validade: validade,
                precoUnitario: precoUnitario,
                timestamp: Date.now()
            }));
        }

        await Promise.all(promessas);
        
        document.getElementById('nome').value = '';
        document.getElementById('quantidade').value = '1';
        document.getElementById('preco').value = '';
        document.getElementById('nome').focus();
        
        carregarEstoque();
    } catch (error) {
        alert("Erro ao salvar.");
    } finally {
        btnSalvarEstoque.disabled = false;
        document.getElementById('btnSalvarTexto').textContent = 'Salvar Produto';
    }
});

window.removerItem = async function(docId) { // Expose for easy binding
    if (!currentUser) return;
    
    // Mostra feedback no botão que o usuário clicou
    const btn = document.querySelector(`button[data-id="${docId}"]`);
    if(btn) {
        btn.textContent = "Apagando...";
        btn.disabled = true;
    }

    try {
        await deleteDoc(doc(db, "estoque", docId));
        // Recarregar os dados para atualizar a tabela e os GRÁFICOS
        carregarEstoque();
    } catch (error) {
        alert("Erro ao deletar.");
        if(btn){
            btn.textContent = "🗑️ Excluir";
            btn.disabled = false;
        }
    }
}

// ==========================================
// 3. ANÁLISE GRÁFICA E KPIs (CHART.JS)
// ==========================================

function atualizarAnalytics(itens) {
    // 1. Calcular Métricas de Resumo
    let valorTotal = 0;
    let tensEmRisco = 0;

    const dataAnalise = itens.map(item => {
        valorTotal += Number(item.precoUnitario);
        const st = classificarStatus(item.validade);
        if (st.classe !== 'status-ok') tensEmRisco++;
        
        return {
            nome: item.nome,
            diasParaVencer: st.dias,
            custo: Number(item.precoUnitario)
        };
    });

    // Atualizar no HTML
    document.getElementById('metricValorInvestido').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('metricTotalUnidades').textContent = itens.length;
    document.getElementById('metricItensAtencao').textContent = tensEmRisco;

    // 2. Gráfico 1: Vencimento (Os 5 produtos mais urgentes)
    const urgentes = [...dataAnalise].sort((a,b) => a.diasParaVencer - b.diasParaVencer).slice(0, 5);
    
    const labelsVencimento = urgentes.map(u => u.nome);
    const dataVencimento = urgentes.map(u => u.diasParaVencer);
    const coresVencimento = dataVencimento.map(d => d < 0 ? '#ff3b30' : (d <= 30 ? '#ffcc00' : '#34c759'));

    if (chartValidadeInstance) chartValidadeInstance.destroy();
    
    const ctxVal = document.getElementById('validadeChart').getContext('2d');
    chartValidadeInstance = new Chart(ctxVal, {
        type: 'bar',
        data: {
            labels: labelsVencimento,
            datasets: [{
                label: 'Dias para Vencer',
                data: dataVencimento,
                backgroundColor: coresVencimento,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontais
            responsive: true,
            plugins: {
                title: { display: true, text: 'Prazo de Validade (Itens Urgentes)' }
            }
        }
    });

    // 3. Gráfico 2: Reposição (Contagem de itens por nome)
    const contagemMapeada = {};
    dataAnalise.forEach(item => {
        if (!contagemMapeada[item.nome]) contagemMapeada[item.nome] = 0;
        contagemMapeada[item.nome] += 1;
    });

    const labelsReposicao = Object.keys(contagemMapeada);
    const dataReposicao = Object.values(contagemMapeada);

    if (chartReposicaoInstance) chartReposicaoInstance.destroy();

    const ctxRep = document.getElementById('reposicaoChart').getContext('2d');
    chartReposicaoInstance = new Chart(ctxRep, {
        type: 'doughnut',
        data: {
            labels: labelsReposicao,
            datasets: [{
                data: dataReposicao,
                backgroundColor: ['#0A84FF', '#34C759', '#FF9500', '#5E5CE6', '#FF2D55', '#AF52DE'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            plugins: {
                title: { display: true, text: 'Distribuição Mapeada (Volume)' },
                legend: { position: 'bottom' }
            },
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
