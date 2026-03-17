import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
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
const btnGoogleAuth = document.getElementById('btnGoogleAuth');

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
let chartFinanceiroInstance = null;
let chartRadarInstance = null;

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

// Validação de senha forte
function validarSenhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(senha);
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    authError.textContent = '';

    // Bloqueia a criação se a senha for fraca (apenas no modo de cadastro)
    if (!isLoginMode && !validarSenhaForte(password)) {
        authError.textContent = 'A senha deve ter mín. 8 caracteres, maiúscula, minúscula, número e símbolo (@$!%*?&).';
        return;
    }

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
        } else if (error.code === 'auth/operation-not-allowed') {
            authError.textContent = '⚠️ Erro: Autenticação por E-mail está desativada no Firebase!';
        } else {
            authError.textContent = `Erro Firebase: ${error.code} - ${error.message}`;
        }
    } finally {
        btnAcaoAuth.disabled = false;
        btnAcaoAuth.textContent = isLoginMode ? 'Entrar no Sistema' : 'Criar Conta Nova';
    }
});

btnGoogleAuth.addEventListener('click', async () => {
    btnGoogleAuth.disabled = true;
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            authError.textContent = 'O login com Google foi cancelado.';
        } else {
            authError.textContent = `Erro Google Auth: ${error.message}`;
        }
    } finally {
        btnGoogleAuth.disabled = false;
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
        // Apenas filtra por usuário na nuvem (evita erro de Composite Index do Firebase ao misturar where e orderBy)
        const q = query(estoqueRef, where("userId", "==", currentUser.uid));
        
        const querySnapshot = await getDocs(q);
        const itens = [];
        
        querySnapshot.forEach((doc) => {
            itens.push({ id: doc.id, ...doc.data() });
        });

        // Ordena pela data de validade no próprio navegador (Client-side sorting)
        itens.sort((a, b) => new Date(a.validade) - new Date(b.validade));

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
                    <td>${item.peso} ${item.unidade || 'Kg'}</td>
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
    const unidadeEle = document.querySelector('input[name="unidadeMedida"]:checked');
    const unidade = unidadeEle ? unidadeEle.value : 'Kg';
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
                unidade: unidade,
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
        
        // Timeout para garantir que o Firebase propague antes do novo fetch
        setTimeout(() => carregarEstoque(), 500);
    } catch (error) {
        alert("Erro ao salvar o item: " + error.message);
        console.error("Save Error:", error);
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
    let itensCriticos15Dias = 0;

    // Agrupamento de itens por nome para os gráficos
    const itensAgrupados = {};

    itens.forEach(item => {
        valorTotal += Number(item.precoUnitario);
        const st = classificarStatus(item.validade);
        // Itens críticos: Vencidos ou vencem em <= 15 dias
        if (st.dias <= 15) itensCriticos15Dias++;
        
        const nomeUpper = item.nome.toUpperCase(); // Normalizar maiúsculo/minúsculo
        
        if (!itensAgrupados[nomeUpper]) {
            itensAgrupados[nomeUpper] = {
                nome: item.nome, // Mantém a digitação original para o display
                quantidade: 0,
                menorDiasParaVencer: st.dias,
                custoTotal: 0
            };
        }
        
        itensAgrupados[nomeUpper].quantidade += 1;
        itensAgrupados[nomeUpper].custoTotal += Number(item.precoUnitario);
        
        // Mantém o vencimento mais crítico (menor dia) para o grupo
        if (st.dias < itensAgrupados[nomeUpper].menorDiasParaVencer) {
            itensAgrupados[nomeUpper].menorDiasParaVencer = st.dias;
        }
    });

    // Atualizar no HTML as métricas numéricas
    document.getElementById('metricValorInvestido').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('metricTotalUnidades').textContent = itens.length;
    // KPI "Itens em Atenção" -> Atualiza visual e label se quiser depois, mas o valor é crítico (<15 dias)
    document.getElementById('metricItensAtencao').textContent = itensCriticos15Dias;

    // --- GRÁFICOS ANTIGOS (Mantidos e Melhorados) ---
    // 2. Gráfico 1: Prazos de Validade (Visão Agrupada x Dias pra vencer)
    // Transforma o objeto agrupado num Array e ordena pelos que vão vencer primeiro
    const dadosGraficoVencimento = Object.values(itensAgrupados).sort((a,b) => a.menorDiasParaVencer - b.menorDiasParaVencer);
    
    // Rótulos no formato: Nome do Produto (Qtdx)
    const labelsVencimento = dadosGraficoVencimento.map(u => `${u.nome} (${u.quantidade}x)`);
    const dataVencimento = dadosGraficoVencimento.map(u => u.menorDiasParaVencer);
    const coresVencimento = dataVencimento.map(d => d < 0 ? '#ff3b30' : (d <= 30 ? '#ffcc00' : '#34c759'));

    if (chartValidadeInstance) chartValidadeInstance.destroy();
    
    const ctxVal = document.getElementById('validadeChart').getContext('2d');
    chartValidadeInstance = new Chart(ctxVal, {
        type: 'bar',
        data: {
            labels: labelsVencimento,
            datasets: [{
                label: 'Dias para Vencer (Lote mais próximo)',
                data: dataVencimento,
                backgroundColor: coresVencimento,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontais
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Prazo de Validade por Produto' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.raw;
                            return val < 0 ? `Vencido há ${Math.abs(val)} dias` : `Vence em ${val} dias`;
                        }
                    }
                }
            }
        }
    });

    // 3. Gráfico 2: Volume de Estoque (Gráfico de Colunas em vez de Pizza)
    // Ordenar pelo produto que tem mais volume
    const dadosGraficoVolume = Object.values(itensAgrupados).sort((a,b) => b.quantidade - a.quantidade);
    
    const labelsVolume = dadosGraficoVolume.map(u => u.nome);
    const dataVolume = dadosGraficoVolume.map(u => u.quantidade);

    if (chartReposicaoInstance) chartReposicaoInstance.destroy();

    const ctxRep = document.getElementById('reposicaoChart').getContext('2d');
    chartReposicaoInstance = new Chart(ctxRep, {
        type: 'bar', // Mudou de 'doughnut' para 'bar'
        data: {
            labels: labelsVolume,
            datasets: [{
                label: 'Unidades em Estoque',
                data: dataVolume,
                backgroundColor: '#0A84FF', // Azul padrão iOS
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Volume Físico do Estoque' },
                legend: { display: false } // Esconde a legenda desnecessária num gráfico de 1 cor
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { stepSize: 1 } // Força a escala a mostrar números inteiros (1, 2, 3 itens...)
                }
            }
        }
    });

    // --- NOVOS GRÁFICOS (Financeiro e Radar) ---
    function gerarDashboard() {
        // 4. Gráfico 3 (Financeiro): Valor Financeiro por Item/Categoria (Doughnut)
        // Ordena pelo item mais caro no total para o gráfico ficar bonito
        const dadosFinanceiros = Object.values(itensAgrupados).sort((a,b) => b.custoTotal - a.custoTotal);
        const labelsFinanceiro = dadosFinanceiros.map(u => u.nome);
        const dataFinanceiro = dadosFinanceiros.map(u => Number(u.custoTotal.toFixed(2)));

        if (chartFinanceiroInstance) chartFinanceiroInstance.destroy();

        const ctxFin = document.getElementById('financeiroChart').getContext('2d');
        chartFinanceiroInstance = new Chart(ctxFin, {
            type: 'doughnut',
            data: {
                labels: labelsFinanceiro,
                datasets: [{
                    data: dataFinanceiro,
                    backgroundColor: ['#0A84FF', '#34C759', '#FF9500', '#5E5CE6', '#FF2D55', '#AF52DE', '#FF3B30', '#8E8E93'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Valor Financeiro (R$) por Produto' },
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                },
                cutout: '65%',
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // 5. Gráfico 4 (Radar/Bar): Radar de Validade (Bar Chart - Agrupado em 3 buckets)
        let contagemVence15 = 0;   // < 15 dias (Alerta Vermelho)
        let contagemVence30 = 0;   // 15 a 30 dias (Alerta Amarelo)
        let contagemVenceBom = 0;  // > 30 dias (Verde)

        itens.forEach(item => {
            const diasParaVencer = classificarStatus(item.validade).dias;
            if (diasParaVencer < 15) {
                contagemVence15++;
            } else if (diasParaVencer >= 15 && diasParaVencer <= 30) {
                contagemVence30++;
            } else {
                contagemVenceBom++;
            }
        });

        if (chartRadarInstance) chartRadarInstance.destroy();

        const ctxRadar = document.getElementById('radarChart').getContext('2d');
        chartRadarInstance = new Chart(ctxRadar, {
            type: 'bar',
            data: {
                labels: ['< 15 dias', '15 a 30 dias', '> 30 dias'],
                datasets: [{
                    label: 'Itens em Estoque',
                    data: [contagemVence15, contagemVence30, contagemVenceBom],
                    backgroundColor: ['#FF3B30', '#FFCC00', '#34C759'], // Vermelho, Amarelo, Verde iOS
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Radar Geral de Validades (Unidades)' },
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // Chama a função que gera e injeta os novos gráficos gerenciais
    gerarDashboard();
}
