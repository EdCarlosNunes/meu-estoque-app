<div align="center">
  <img src="https://raw.githubusercontent.com/EdCarlosNunes/meu-estoque-app/main/assets/preview.png" alt="Logo Banco de Dados de Comida" width="100" height="auto" />
  <h1>🍎 Banco de Dados de Comida</h1>
  <p><strong>Gestão de Estoque Alimentar Elegante e Inteligente</strong></p>
  
  <p>
    <img alt="Versão" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
    <img alt="Licença" src="https://img.shields.io/badge/license-MIT-green.svg" />
  </p>
</div>

<br>

O **Banco de Dados de Comida** é uma aplicação web de página única (SPA) desenhada para facilitar o controle do seu estoque alimentar doméstico ou de pequenos negócios. Desenvolvido com uma interface moderna e limpa, inspirada na estética Glassmorphism do macOS/iOS.

## ✨ Características Principais

- 🍏 **Design Premium (Glassmorphism):** Interface translúcida, cantos arredondados e tipografia nativa (`-apple-system`).
- 📦 **Cadastro Inteligente:** Sistema em loop que permite inserir rapidamente "X" unidades de um produto e o banco de dados desmembra automaticamente, gerando IDs únicos para baixa unitária e calculando o preço fracionado.
- ☁️ **Sincronização em Nuvem (Firebase):** Sistema com Autenticação de Usuário e banco de dados real-time (Firestore). Cada conta possui seu estoque individual e persistente, acessível de qualquer dispositivo.
- 🚥 **Alertas Visuais:** O grid de estoque identifica automaticamente e colore de forma suave (tons pastel) produtos com status "OK" (Verde), "Atenção - Vence em até 30 dias" (Amarelo) e "Vencido" (Vermelho).
- 📱 **Responsivo:** Layout em painéis que se adapta para telas de celulares, tablets ou desktops.

## 🚀 Como Acessar (Ao Vivo)

Acesse a aplicação completa funcionando direto do seu navegador, sem precisar instalar nada, hospedada gratuitamente no Netlify:

👉 **[https://edcarlosnunes.github.io/meu-estoque-app/](https://edcarlosnunes.github.io/meu-estoque-app/)**

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica.
- **CSS3 Moderno:** Variáveis nativas, Flexbox, `backdrop-filter` (Glassmorphism) e design responsivo.
- **Vanilla JavaScript (ES6+):** Lógica de negócios de loop de inventário e manipulação do DOM.
- **Google Firebase:** Backend serverless (Authentication e Cloud Firestore).

## 💻 Como Rodar Localmente (Desenvolvimento)

Como o projeto utiliza tecnologias fundamentais da web sem bundlers ou dependências complexas (Node.js/NPM), rodar localmente é instantâneo:

1. Clone o repositório
   ```sh
   git clone https://github.com/EdCarlosNunes/meu-estoque-app.git
   ```
2. Entre na pasta do projeto
   ```sh
   cd meu-estoque-app
   ```
3. Dê um duplo clique no arquivo `index.html` para abrir diretamente no seu navegador padrão (Google Chrome, Edge, Safari, etc).

## 📝 Licença

Desenvolvido para fins pessoais e portfólio. Código livre para uso e modificação.

---
*Feito com 💡 foco em UI/UX moderna.*
