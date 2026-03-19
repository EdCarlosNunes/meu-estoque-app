<div align="center">
  <h1>🍏 Meu Estoque Inteligente</h1>
  <p><strong>Gestão de Estoque Alimentar com Experiência Visual Premium</strong></p>
  
  <p>
    <img alt="Versão" src="https://img.shields.io/badge/version-1.1.0-blue.svg" />
    <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Serverless-FFCA28?logo=firebase&logoColor=black" />
    <img alt="UI/UX" src="https://img.shields.io/badge/UI-iOS%2026%20Glassmorphism-000000?logo=apple" />
    <img alt="Status" src="https://img.shields.io/badge/status-ativo-34C759" />
  </p>
</div>

<br>

O **Meu Estoque Inteligente** é uma aplicação web para controle e gestão do estoque alimentar doméstico ou de pequenos negócios. Arquitetura **100% Serverless no Google Firebase** com interface **iOS 26 Mesh Gradient** — experiência "App-Like" digna da Apple.

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Login via **E-mail/Senha** com validação de senha forte
- **Login com Google** (1-Click via Firebase Auth)

### 📦 Gestão de Estoque
- **Cadastro com desmembramento automático de lotes**: adicione N unidades e o sistema cria N registros individuais
- **Seletor de unidade de medida**: Kg, g, L, ml
- **Validade padrão de 30 dias** para evitar alarmes desnecessários ao cadastrar
- **Ajuste de item inline**: edite nome, peso, preço e validade diretamente pelo botão ✏️
- **Consumo rápido**: remova um item do estoque com 1 clique (🍽️)
- **Exportação para CSV** com todos os dados do estoque

### 🗂️ Filtros e Ordenação da Tabela *(novo em v1.1.0)*
- **📅 Validade** — Padrão, itens que vencem primeiro no topo
- **💰 Menor Preço** — Do mais barato ao mais caro
- **💸 Maior Preço** — Do mais caro ao mais barato
- **📦 Mais Itens** — Produtos com maior quantidade em estoque
- **🔤 A → Z** — Ordem alfabética

### 📊 Inteligência de Dados
- **KPIs em tempo real**: Valor Investido, Total de Unidades, Itens em Atenção
- **Gráfico de Prazos de Validade** (barras horizontais por produto)
- **Gráfico de Volume de Estoque** (unidades por produto)
- **Gráfico Financeiro** (custo total por produto)
- **Radar de Validades** (distribuição: < 15 dias / 15-30 dias / > 30 dias)
- **🆕 Gráfico de Rosca — Carga Física por Produto** *(novo em v1.1.0)*: visualize a distribuição de peso do estoque por produto

### ⚖️ Widget de Carga Física *(corrigido em v1.1.0)*
- Exibe o **peso bruto total** da despensa em Kg (normaliza g → Kg automaticamente)
- Gráfico de rosca com a distribuição de peso por produto (top 8)

### ⏳ Calculadora de Autonomia
- Selecione um alimento específico ou "Toda a Despensa"
- Defina o número de pessoas e o consumo diário (Kg, g, L ou ml)
- Resultado em dias de autonomia estimada

### 🍽️ Assistente FIFO
- Lista os **3 produtos que vencem primeiro** para priorizar o consumo
- Botão de consumo rápido integrado

### 🎯 Planejamento de Metas
- Defina uma meta de estoque para cada produto
- Barra de progresso visual comparando estoque atual × meta

---

## 🚥 Sistema de Alertas Visuais

| Status | Critério |
|--------|----------|
| 🟢 **OK** | Validade superior a 30 dias |
| 🟡 **Atenção** | Vence em até 30 dias |
| 🔴 **Vencido** | Data de validade ultrapassada |

---

## 🚀 Acesso ao Vivo

👉 **[https://edcarlosnunes.github.io/meu-estoque-app/](https://edcarlosnunes.github.io/meu-estoque-app/)**

---

## 🛠️ Stack Tecnológico

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)

- **UI/UX:** Vanilla CSS, Flexbox, design responsivo, iOS 26 Glassmorphism
- **Backend/DB:** Firebase Authentication + Cloud Firestore NoSQL
- **Data-Viz:** Chart.js (Bar, Line, Doughnut)

---

## 💻 Como Rodar Localmente

```sh
git clone https://github.com/EdCarlosNunes/meu-estoque-app.git
cd meu-estoque-app
npx serve .
```

Abra `http://localhost:3000` no navegador. Nenhuma configuração de servidor necessária.

---

## 📋 Changelog

### v1.1.0 — Março 2026
- ✅ **Fix:** Carga Física Total agora contabiliza corretamente o peso de todos os itens
- ✅ **Novo:** Gráfico de rosca de distribuição de peso por produto
- ✅ **Novo:** Barra de filtros na tabela de estoque (5 critérios de ordenação)
- ✅ **Fix:** Preço unitário agora tratado corretamente no cadastro
- ✅ **Melhoria:** Data de validade padrão ajustada para +30 dias

### v1.0.0 — Lançamento inicial
- Dashboard analítico com KPIs, gráficos e alertas visuais
- Autenticação Firebase (E-mail + Google)
- Cadastro com desmembramento de lotes
- Calculadora de Autonomia, Assistente FIFO e Metas

---

*Feito com 💡 foco absoluto em Performance e UI/UX.*
