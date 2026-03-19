import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const btnExportarCSV = document.getElementById('btnExportarCSV');

// Analytics DOM
const analyticsPanel = document.getElementById('analyticsPanel');

// State
let isLoginMode = true;
let currentUser = null;
let chartValidadeInstance = null;
let chartReposicaoInstance = null;
let chartFinanceiroInstance = null;
let chartRadarInstance = null; // Declarar explicitamente
let chartPesoDistribuicaoInstance = null; // Novo gráfico de rosca
let editingId = null;
let currentItens = []; // Keep track of items for easy editing

// Configurar datas de hoje e validade padrão (+30 dias) nos inputs
const hoje = new Date().toISOString().split('T')[0];
const dataPadraoValidade = new Date();
dataPadraoValidade.setDate(dataPadraoValidade.getDate() + 30);
const hojeMais30 = dataPadraoValidade.toISOString().split('T')[0];

document.getElementById('dataEntrada').value = hoje;
document.getElementById('dataValidade').value = hojeMais30;

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
            
            currentItens = itens; // Guardar para edição

            itens.forEach(item => {
                const tr = document.createElement('tr');
                const status = classificarStatus(item.validade);

                tr.innerHTML = `
                    <td><strong>${item.nome}</strong></td>
                    <td>${item.peso} ${item.unidade || 'Kg'}</td>
                    <td>${formataDataBR(item.validade)}</td>
                    <td>R$ ${Number(item.precoUnitario).toFixed(2).replace('.', ',')}</td>
                    <td><span class="badge ${status.classe}">${status.texto}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-glass btn-glass-blue btn-edit" data-id="${item.id}">
                                ✏️ Ajustar
                            </button>
                            <button class="btn-glass btn-glass-green btn-consume" data-id="${item.id}">
                                🍽️ Consumir
                            </button>
                        </div>
                    </td>
                `;
                estoqueBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => ajustarItem(e.currentTarget.getAttribute('data-id')));
            });

            document.querySelectorAll('.btn-consume').forEach(btn => {
                btn.addEventListener('click', (e) => removerItem(e.currentTarget.getAttribute('data-id')));
            });

            // Rodar as análises assim que carregar!
            atualizarAnalytics(itens);
        }
    } catch (error) {
        console.error("Erro na busca", error);
        loadingState.innerHTML = `<p style="color:red">Ocorreu um problema ao baixar. Tentando novamente...</p>`;
    }
}

// ==========================================
// FUNÇÃO DE EXPORTAÇÃO CSV
// ==========================================
window.baixarCSV = function() {
    if (currentItens.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    // Cabeçalho do CSV
    let csv = "Alimento;Peso;Unidade;Data Entrada;Data Validade;Preco Unitario\n";

    // Conteúdo
    currentItens.forEach(item => {
        csv += `${item.nome};${item.peso};${item.unidade};${item.entrada};${item.validade};${item.precoUnitario.toFixed(2).replace('.', ',')}\n`;
    });

    // Criar o arquivo e link de download
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dataHoje = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `estoque_food_data_${dataHoje}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', baixarCSV);
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
    const precoUnitario = precoTotal; // Agora trata como unitário direto conforme o label
    
    try {
        const estoqueRef = collection(db, "estoque");
        
        if (editingId) {
            // MODO EDIÇÃO: Atualiza apenas um documento
            const itemRef = doc(db, "estoque", editingId);
            await updateDoc(itemRef, {
                nome: nome,
                peso: peso,
                unidade: unidade,
                entrada: entrada,
                validade: validade,
                precoUnitario: precoUnitario // Preço unitário direto
            });
            editingId = null;
        } else {
            // MODO CADASTRO: Cria vários se necessário
            const promessas = [];
            for (let i = 0; i < quantidade; i++) {
                promessas.push(addDoc(estoqueRef, {
                    userId: currentUser.uid,
                    nome: nome,
                    peso: peso,
                    unidade: unidade,
                    entrada: entrada,
                    validade: validade,
                    precoUnitario: precoUnitario, // Preço unitário direto
                    timestamp: Date.now()
                }));
            }
            await Promise.all(promessas);
        }
        
        formCadastro.reset();
        document.getElementById('dataEntrada').value = hoje;
        document.getElementById('dataValidade').value = hojeMais30;
        document.getElementById('nome').focus();
        
        setTimeout(() => carregarEstoque(), 500);
    } catch (error) {
        alert("Erro ao salvar o item: " + error.message);
        console.error("Save Error:", error);
    } finally {
        btnSalvarEstoque.disabled = false;
        document.getElementById('btnSalvarTexto').textContent = 'Salvar no Banco';
    }
});

window.ajustarItem = function(docId) {
    const item = currentItens.find(i => i.id === docId);
    if (!item) return;

    editingId = docId;
    
    // Preenche o formulário
    document.getElementById('nome').value = item.nome;
    document.getElementById('quantidade').value = 1;
    document.getElementById('peso').value = item.peso;
    document.getElementById('preco').value = item.precoUnitario.toFixed(2);
    document.getElementById('dataEntrada').value = item.entrada;
    document.getElementById('dataValidade').value = item.validade;
    
    // Seleciona a unidade correta
    const radioUnidade = document.querySelector(`input[name="unidadeMedida"][value="${item.unidade}"]`);
    if(radioUnidade) radioUnidade.checked = true;

    // Sobe a tela suavemente para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Muda o visual do botão
    document.getElementById('btnSalvarTexto').textContent = 'Atualizar Item';
    btnSalvarEstoque.style.backgroundColor = 'var(--sys-orange)';
}

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
    let pesoFisicoTotal = 0; // Novo: para Carga Física

    // Agrupamento de itens por nome para os gráficos
    const itensAgrupados = {};

    itens.forEach(item => {
        valorTotal += Number(item.precoUnitario);
        
        // Carga Física: normaliza para Kg (Ex: se for g, divide por 1000)
        let pesoKg = Number(item.peso);
        if (item.unidade === 'g' || item.unidade === 'ml') pesoKg = pesoKg / 1000;
        pesoFisicoTotal += pesoKg;

        const st = classificarStatus(item.validade);
        // Itens críticos: Vencidos ou vencem em <= 15 dias
        if (st.dias <= 15) itensCriticos15Dias++;
        
        const nomeUpper = item.nome.toUpperCase(); // Normalizar maiúsculo/minúsculo
        
        if (!itensAgrupados[nomeUpper]) {
            itensAgrupados[nomeUpper] = {
                nome: item.nome, // Mantém a digitação original para o display
                quantidade: 0,
                menorDiasParaVencer: st.dias,
                custoTotal: 0,
                pesoTotal: 0, // NOVO: Correção de bug no render de metas
                unidade: item.unidade || 'Kg'
            };
        }
        
        itensAgrupados[nomeUpper].quantidade += 1;
        itensAgrupados[nomeUpper].custoTotal += Number(item.precoUnitario);
        
        let iPeso = Number(item.peso) || 0;
        itensAgrupados[nomeUpper].pesoTotal += iPeso;
        
        // Mantém o vencimento mais crítico (menor dia) para o grupo
        if (st.dias < itensAgrupados[nomeUpper].menorDiasParaVencer) {
            itensAgrupados[nomeUpper].menorDiasParaVencer = st.dias;
        }
    });

    // Atualizar no HTML as métricas numéricas
    document.getElementById('metricValorInvestido').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('metricTotalUnidades').textContent = itens.length;
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

    // --- LÓGICA DOS WIDGETS INTELIGENTES ---


    // WIDGET 1: Calculadora de Autonomia
    // WIDGET 1: Calculadora de Autonomia
    const selectAlimento = document.getElementById('selectAlimentoAutonomia');
    const sliderPessoas = document.getElementById('sliderPessoas');
    const labelPessoas = document.getElementById('labelPessoas');
    const inputConsumoDiario = document.getElementById('inputConsumoDiario');
    const selectUnidadeConsumo = document.getElementById('selectUnidadeConsumo');
    const resultadoAutonomia = document.getElementById('resultadoAutonomia');

        // Popular o seletor com itens únicos
        const currentSelected = selectAlimento.value;
        selectAlimento.innerHTML = '<option value="todos">Toda a Despensa</option>';
        Object.values(itensAgrupados).forEach(grupo => {
            const opt = document.createElement('option');
            opt.value = grupo.nome;
            opt.textContent = grupo.nome;
            selectAlimento.appendChild(opt);
        });
        // Tenta manter a seleção anterior se ela ainda existir
        if (currentSelected && [...selectAlimento.options].some(o => o.value === currentSelected)) {
            selectAlimento.value = currentSelected;
        }

    function calcularDiasAutonomia() {
        const qtdPessoas = parseInt(sliderPessoas.value);
        let consumoPorPessoa = parseFloat(inputConsumoDiario.value) || 1.5;
        const unidadeConsumo = selectUnidadeConsumo ? selectUnidadeConsumo.value : 'Kg';
        const alimentoSelecionado = selectAlimento.value;
        
        labelPessoas.textContent = qtdPessoas === 1 ? '1 pessoa' : `${qtdPessoas} pessoas`;
        
        // Normalizar consumo para Kg/L (dividindo por 1000 se for g ou ml)
        if (unidadeConsumo === 'g' || unidadeConsumo === 'ml') {
            consumoPorPessoa /= 1000;
        }

        // Calcular peso baseado no filtro
        let pesoAlvo = 0;
        if (alimentoSelecionado === 'todos') {
            pesoAlvo = pesoFisicoTotal;
        } else {
            // Soma apenas do alimento selecionado
            itens.filter(i => i.nome === alimentoSelecionado).forEach(i => {
                let p = Number(i.peso);
                if (i.unidade === 'g' || i.unidade === 'ml') p /= 1000;
                pesoAlvo += p;
            });
        }

        if (pesoAlvo <= 0) {
            resultadoAutonomia.textContent = "-- dias";
            return;
        }

        const consumoTotalDia = qtdPessoas * consumoPorPessoa;
        const diasEstimados = Math.floor(pesoAlvo / consumoTotalDia);
        resultadoAutonomia.textContent = diasEstimados === 1 ? '1 dia' : `${diasEstimados} dias`;
        
        // Mudar cor baseado nos dias
        // ... (rest of color logic) ...
    }
    
    sliderPessoas.oninput = calcularDiasAutonomia;
    inputConsumoDiario.oninput = calcularDiasAutonomia;
    if (selectUnidadeConsumo) selectUnidadeConsumo.onchange = calcularDiasAutonomia;
    selectAlimento.onchange = calcularDiasAutonomia;
    
    calcularDiasAutonomia();

    // WIDGET 3: Assistente FIFO (O que comer primeiro)
    const listaFifo = document.getElementById('listaFifo');
    listaFifo.innerHTML = ''; // Limpa a lista
    
    // Pega todos os itens (não agrupados, precisamos do documento específico para dar baixa) e filtra
    // Ordenar itens do que vence primeiro para o último
    const itensOrdenados = [...itens].sort((a, b) => new Date(a.validade) - new Date(b.validade));
    // Pegar apenas os top 3 mais perigosos
    const top3Fifo = itensOrdenados.slice(0, 3);

    if (top3Fifo.length === 0) {
        listaFifo.innerHTML = `<p class="legenda-micro" style="text-align: center;">Seu estoque está vazio.</p>`;
    } else {
        top3Fifo.forEach(item => {
            const status = classificarStatus(item.validade);
            const div = document.createElement('div');
            div.className = 'fifo-item';
            div.innerHTML = `
                <div class="fifo-info">
                    <h4>${item.nome} (${item.peso}${item.unidade})</h4>
                    <p style="color: ${status.classe === 'status-danger' || status.classe === 'status-warning' ? 'var(--sys-red)' : 'var(--sys-orange)'}">
                        ${status.texto === 'Vencido' ? '⚠️ Vencido' : '⏳ Vence em ' + status.dias + ' dias'}
                    </p>
                </div>
                <button class="btn-consumir" data-consume-id="${item.id}">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    Consumir
                </button>
            `;
            listaFifo.appendChild(div);
        });

        // Event listener para consumo rápido
        document.querySelectorAll('.btn-consumir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicado = e.currentTarget;
                const idOriginal = btnClicado.getAttribute('data-consume-id');
                btnClicado.disabled = true;
                btnClicado.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>`;
                // Reutiliza a função removerItem global que já exclui do firebase e dá recarregarEstoque()
                removerItem(idOriginal);
            });
        });
    }

    // --- NOVOS GRÁFICOS (Financeiro e Radar) ---
    function gerarDashboard() {
        // 4. Gráfico 3 (Financeiro): Valor Financeiro por Item/Categoria (Linha)
        const dadosFinanceiros = Object.values(itensAgrupados).sort((a,b) => b.custoTotal - a.custoTotal);
        const labelsFinanceiro = dadosFinanceiros.map(u => u.nome);
        const dataFinanceiro = dadosFinanceiros.map(u => Number(u.custoTotal.toFixed(2)));

        if (chartFinanceiroInstance) chartFinanceiroInstance.destroy();

        const ctxFin = document.getElementById('financeiroChart');
        if (ctxFin) {
            chartFinanceiroInstance = new Chart(ctxFin.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labelsFinanceiro,
                    datasets: [{
                        label: 'Investimento (R$)',
                        data: dataFinanceiro,
                        borderColor: '#FF2D55',
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#FF2D55',
                        pointBorderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        fill: true,
                        backgroundColor: 'rgba(255, 45, 85, 0.1)',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Pico de Custo: Produtos Mais Caros (Total R$)' },
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v } }
                    }
                }
            });
        }

        // 5. Gráfico Radar de Validade
        let contagemVence15 = 0;
        let contagemVence30 = 0;
        let contagemVenceBom = 0;

        itens.forEach(item => {
            const dias = classificarStatus(item.validade).dias;
            if (dias < 15) contagemVence15++;
            else if (dias <= 30) contagemVence30++;
            else contagemVenceBom++;
        });

        if (chartRadarInstance) chartRadarInstance.destroy();
        const ctxRadar = document.getElementById('radarChart');
        if (ctxRadar) {
            chartRadarInstance = new Chart(ctxRadar.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['< 15 dias', '15 a 30 dias', '> 30 dias'],
                    datasets: [{
                        label: 'Itens em Estoque',
                        data: [contagemVence15, contagemVence30, contagemVenceBom],
                        backgroundColor: ['#FF3B30', '#FFCC00', '#34C759'],
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
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // 6. Gráfico de Rosca de Distribuição de Peso ⚖️
        const dadosPeso = Object.values(itensAgrupados)
            .map(u => {
                let p = Number(u.pesoTotal);
                if (u.unidade === 'g' || u.unidade === 'ml') p /= 1000;
                return { nome: u.nome, peso: p };
            })
            .filter(u => u.peso > 0)
            .sort((a,b) => b.peso - a.peso)
            .slice(0, 8);

        const labelsPeso = dadosPeso.map(u => u.nome);
        const dataPeso = dadosPeso.map(u => Number(u.peso.toFixed(2)));

        if (chartPesoDistribuicaoInstance) chartPesoDistribuicaoInstance.destroy();
        const ctxPeso = document.getElementById('chartPesoDistribuicao');
        if (ctxPeso && dataPeso.length > 0) {
            chartPesoDistribuicaoInstance = new Chart(ctxPeso.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labelsPeso,
                    datasets: [{
                        data: dataPeso,
                        backgroundColor: ['#FF9500', '#FF2D55', '#AF52DE', '#007AFF', '#5856D6', '#34C759', '#FFCC00', '#8E8E93'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                        title: { display: false }
                    }
                }
            });
        }
    }

    // --- LÓGICA: PAINEL DE METAS EXTREMO ---
    // --- LÓGICA: PAINEL DE METAS INLINE (TABELA) ---
    // Clona o tbody para remover listeners antigos e evitar duplicações no reload
    let oldSummaryBody = document.getElementById('metasSummaryBody');
    let metasSummaryBody = oldSummaryBody.cloneNode(false);
    oldSummaryBody.parentNode.replaceChild(metasSummaryBody, oldSummaryBody);
    
    // Removemos a referência ao metasGrid, visto que não usaremos mais cards isolados.
    const metasSummaryContainer = document.getElementById('metasSummaryContainer');
    
    const metasStorageKey = `metas_${currentUser.uid}`;
    let metasSalvas = JSON.parse(localStorage.getItem(metasStorageKey)) || {};

    // Mostrar sempre o container da tabela (o grid foi removido)
    metasSummaryContainer.style.display = 'block';

    // Função Utilitária Interna para deixar as medidas bonitas (ex: 1500g -> 1.5 Kg)
    function formatarMedida(valor, unidadeOriginal) {
        if (valor >= 1000) {
            if (unidadeOriginal === 'g') return `${(valor / 1000).toFixed(1)} Kg`;
            if (unidadeOriginal === 'ml') return `${(valor / 1000).toFixed(1)} L`;
        }
        return `${valor} ${unidadeOriginal}`;
    }

    Object.entries(itensAgrupados).forEach(([nomeUpper, grupo]) => {
        // ID seguro para o DOM (letras e num)
        const cardId = grupo.nome.replace(/[^a-zA-Z0-9]/g, ''); 
        if(!cardId) return;
        
        let metaAtual = metasSalvas[nomeUpper] || 0;
        
        // Sugestão basicona de preenchimento (depende da unidade)
        let sug1 = 12; let sug2 = 24;
        if(grupo.unidade === 'g' || grupo.unidade === 'ml') { sug1 = 12000; sug2 = 24000; }
        
        // 1. Linha Principal (Resumo)
        let pct = metaAtual > 0 ? Math.min((grupo.pesoTotal / metaAtual) * 100, 100) : 0;
        let corBarra = 'var(--sys-orange)';
        if(pct >= 100) corBarra = 'var(--sys-green)';
        else if (pct >= 50) corBarra = 'var(--sys-blue)';
             
        const trMain = document.createElement('tr');
        trMain.id = `summary_row_${cardId}`;
        
        let hasMetaUI = metaAtual > 0 
            ? `${formatarMedida(metaAtual, grupo.unidade)}` 
            : `<span style="color:var(--label-secondary); font-size: 0.85em; font-weight: normal;">Sem Meta 🎯</span>`;
            
        let progressHTML = metaAtual > 0 ? `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div class="summary-progress-bar" style="flex: 1;">
                    <div class="summary-progress-fill" id="table_fill_${cardId}" style="width: ${pct}%; background-color: ${corBarra};"></div>
                </div>
                <span id="table_status_${cardId}" style="font-size: 0.8rem; font-weight: 700; color: ${corBarra}; margin-left: auto;">${pct.toFixed(0)}%</span>
            </div>
        ` : `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div class="summary-progress-bar" style="flex: 1;">
                    <div class="summary-progress-fill" id="table_fill_${cardId}" style="width: 0%; background-color: var(--label-tertiary);"></div>
                </div>
                <span id="table_status_${cardId}" style="font-size: 0.8rem; font-weight: 700; color: var(--label-secondary); margin-left: auto;">--</span>
            </div>
        `;

        trMain.innerHTML = `
            <td><strong>${grupo.nome}</strong></td>
            <td>${formatarMedida(grupo.pesoTotal, grupo.unidade)}</td>
            <td id="table_meta_${cardId}">${hasMetaUI}</td>
            <td>${progressHTML}</td>
            <td style="text-align: right;">
                <button class="btn-editar-meta" data-configid="${cardId}" data-nomeupper="${nomeUpper}" data-unidade="${grupo.unidade}" data-nome="${grupo.nome}" data-meta="${metaAtual}" style="background: rgba(10, 132, 255, 0.1); color: var(--sys-blue); border: none; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">✏️ Editar Meta</button>
            </td>
        `;
        metasSummaryBody.appendChild(trMain);
    });

    // Eventos da Tabela Inline
    metasSummaryBody.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-editar-meta')) {
            const btn = e.target;
            const cardId = btn.getAttribute('data-configid');
            const nomeUpper = btn.getAttribute('data-nomeupper');
            const nome = btn.getAttribute('data-nome');
            const unidade = btn.getAttribute('data-unidade');
            const metaAtualFloat = parseFloat(btn.getAttribute('data-meta')) || 0;
            
            let resposta = prompt(`Defina a meta ideal para ${nome} (em ${unidade}):\n(Para remover a meta, deixe em branco e dê OK)`, metaAtualFloat > 0 ? metaAtualFloat : '');
            
            if (resposta !== null && resposta.trim() !== '') {
                const novaMeta = parseFloat(resposta.replace(',', '.'));
                if (!isNaN(novaMeta) && novaMeta >= 0) {
                    // Salvar
                    let metas = JSON.parse(localStorage.getItem(metasStorageKey)) || {};
                    metas[nomeUpper] = novaMeta;
                    localStorage.setItem(metasStorageKey, JSON.stringify(metas));
                    
                    // Atualizar botão
                    btn.setAttribute('data-meta', novaMeta);
                    
                    const grupo = itensAgrupados[nomeUpper];
                    const pesoTotalAtual = grupo ? grupo.pesoTotal : 0;
                    
                    let pct = novaMeta > 0 ? Math.min((pesoTotalAtual / novaMeta) * 100, 100) : 0;
                    let corBarra = 'var(--sys-orange)';
                    if(pct >= 100) corBarra = 'var(--sys-green)';
                    else if (pct >= 50) corBarra = 'var(--sys-blue)';
                    
                    const tableMeta = document.getElementById(`table_meta_${cardId}`);
                    if(novaMeta > 0) {
                         tableMeta.innerHTML = formatarMedida(novaMeta, unidade);
                    } else {
                         tableMeta.innerHTML = `<span style="color:var(--label-secondary); font-size: 0.85em; font-weight: normal;">Sem Meta 🎯</span>`;
                         corBarra = 'var(--label-tertiary)';
                    }
                    
                    const tableFill = document.getElementById(`table_fill_${cardId}`);
                    const tableStatus = document.getElementById(`table_status_${cardId}`);
                    if(tableFill) {
                        tableFill.style.width = `${pct}%`;
                        tableFill.style.backgroundColor = corBarra;
                    }
                    if(tableStatus) {
                        tableStatus.textContent = novaMeta > 0 ? `${pct.toFixed(0)}%` : '--';
                        tableStatus.style.color = novaMeta > 0 ? corBarra : 'var(--label-secondary)';
                    }
                    
                    btn.innerHTML = '✅ Salvo!';
                    btn.style.background = 'rgba(52, 199, 89, 0.1)';
                    setTimeout(() => { 
                         btn.innerHTML = '✏️ Editar Meta'; 
                         btn.style.background = 'rgba(10, 132, 255, 0.1)';
                    }, 2000);
                } else {
                    alert("A meta precisa ser um número positivo.");
                }
            } else if (resposta !== null && resposta.trim() === '') {
                 // apagar meta
                 let metas = JSON.parse(localStorage.getItem(metasStorageKey)) || {};
                 metas[nomeUpper] = 0;
                 localStorage.setItem(metasStorageKey, JSON.stringify(metas));
                 btn.setAttribute('data-meta', 0);
                 
                 const tableMeta = document.getElementById(`table_meta_${cardId}`);
                 tableMeta.innerHTML = `<span style="color:var(--label-secondary); font-size: 0.85em; font-weight: normal;">Sem Meta 🎯</span>`;
                 
                 const tableFill = document.getElementById(`table_fill_${cardId}`);
                 const tableStatus = document.getElementById(`table_status_${cardId}`);
                 if(tableFill) {
                    tableFill.style.width = `0%`;
                    tableFill.style.backgroundColor = 'var(--label-tertiary)';
                 }
                 if(tableStatus) {
                    tableStatus.textContent = '--';
                    tableStatus.style.color = 'var(--label-secondary)';
                 }
                 
                 btn.innerHTML = '🗑️ Removido';
                 btn.style.background = 'rgba(255, 59, 48, 0.1)'; // red
                 setTimeout(() => { 
                     btn.innerHTML = '✏️ Editar Meta'; 
                     btn.style.background = 'rgba(10, 132, 255, 0.1)';
                 }, 2000);
            }
        }
    });

    // Chama a função que gera e injeta os novos gráficos gerenciais
    gerarDashboard();

    // Atualiza o peso total exibido
    const elPeso = document.getElementById('pesoTotalInfo');
    if (elPeso) elPeso.textContent = pesoFisicoTotal.toFixed(1).replace('.', ',');
}
