document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm');
    const estoqueBody = document.getElementById('estoqueBody');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.querySelector('.table-container');

    // Inicializar inputs de data com a data atual
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataEntrada').value = hoje;
    document.getElementById('dataValidade').value = hoje;

    // Carregar dados estruturados no localStorage
    let estoque = JSON.parse(localStorage.getItem('estoqueAlimentarWeb')) || [];

    // Persistência
    function salvarEstoque() {
        localStorage.setItem('estoqueAlimentarWeb', JSON.stringify(estoque));
    }

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

    // Ação: Remover Item por ID (Baixa)
    window.removerItem = function(id) {
        estoque = estoque.filter(item => item.id !== String(id));
        salvarEstoque();
        renderizarTabela();
    }

    // Renderização Visual
    function renderizarTabela() {
        estoqueBody.innerHTML = '';
        
        if (estoque.length === 0) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        // Melhor UX: Ordenar por data de validade mais próxima (os mais urgentes em cima)
        const estoqueOrdenado = [...estoque].sort((a, b) => new Date(a.validade) - new Date(b.validade));

        estoqueOrdenado.forEach(item => {
            const tr = document.createElement('tr');
            const status = classificarStatus(item.validade);

            tr.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.peso}</td>
                <td>${formataDataBR(item.entrada)}</td>
                <td>${formataDataBR(item.validade)}</td>
                <td>R$ ${Number(item.precoUnitario).toFixed(2)}</td>
                <td><span class="status-badge ${status.classe}">${status.texto}</span></td>
                <td><button class="btn-baixa" onclick="removerItem('${item.id}')">Baixa ✓</button></td>
            `;
            estoqueBody.appendChild(tr);
        });
    }

    // Submissão do Formulário
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const quantidade = parseInt(document.getElementById('quantidade').value, 10);
        const peso = parseFloat(document.getElementById('peso').value);
        const entrada = document.getElementById('dataEntrada').value;
        const validade = document.getElementById('dataValidade').value;
        const precoTotal = parseFloat(document.getElementById('preco').value);

        const precoUnitario = precoTotal / quantidade;
        const baseId = Date.now();

        // ⚠️ Regra de Negócio: Loop para Cadastro Individual
        // Garante que cada unidade comprada seja inserida como num inventário real
        for (let i = 0; i < quantidade; i++) {
            const novoItem = {
                id: `${baseId}-${i}`, // ID Único gerado para permitir exclusão unitária
                nome: nome,
                peso: peso,
                entrada: entrada,
                validade: validade,
                precoUnitario: precoUnitario,
            };
            estoque.push(novoItem);
        }

        salvarEstoque();
        renderizarTabela();
        
        // Reset inteligente: Limpamos text inputs, mas mantemos datas
        document.getElementById('nome').value = '';
        document.getElementById('quantidade').value = '1';
        document.getElementById('preco').value = '';
        document.getElementById('nome').focus();
    });

    // Início da aplicação
    renderizarTabela();
});
