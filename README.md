<div align="center">
  <h1>🍏 Meu Estoque Inteligente</h1>
  <p><strong>Gestão de Estoque Alimentar com Experiência Visual Premium</strong></p>
  
  <p>
    <img alt="Versão" src="https://img.shields.io/badge/version-2.0.0-blue.svg" />
    <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Serverless-FFCA28?logo=firebase&logoColor=black" />
    <img alt="UI/UX" src="https://img.shields.io/badge/UI-iOS%2026%20Glassmorphism-000000?logo=apple" />
  </p>
</div>

<br>

O **Meu Estoque Inteligente** é uma aplicação web poderosa desenhada para o controle e gestão de validade do seu estoque alimentar doméstico ou de pequenos negócios. Agora na versão 2.0, o aplicativo foi totalmente reescrito para utilizar uma arquitetura **100% Serverless no Google Firebase** e envelopado em uma interface **iOS 26 Mesh Gradient**, entregando uma experiência de uso imersiva "App-Like" digna da Apple.

## ✨ Características Principais

- 📱 **Design Premium (iOS 26):** Interface translúcida *True Glassmorphism* (`backdrop-filter: blur(40px)`) flutuando sobre um papel de parede animado *Mesh Gradient*.
- 🔐 **Autenticação Segura:** Login via E-mail/Senha (com validação de força bruta) ou 1-Click Login com **Google Authentication**.
- ☁️ **Banco de Dados em Nuvem:** Seus dados salvos em tempo real no **Firestore**. Acesse seu estoque com a sua conta de qualquer celular ou computador do mundo.
- 📦 **Cadastro Inteligente:** Desmembramento automático de lotes. Adicione o seletor visual de Unidade de Medida (Kg, g, L, ml) e o banco divide tudo para baixas unitárias.
- 📊 **Dashboard Analítico:** Componente integrado de Inteligência de Dados com KPI's em tempo real e gráficos interativos (Chart.js) mostrando produtos urgentes e volumes mapeados.
- 🚥 **Alertas Visuais:** Identifica automaticamente e colore itens com status "OK", "Atenção (Menos de 30 dias)" e "Vencido".

## 🚀 Como Acessar (Ao Vivo)

Acesse a aplicação completa funcionando direto do seu navegador, hospedada no GitHub Pages:

👉 **[https://edcarlosnunes.github.io/meu-estoque-app/](https://edcarlosnunes.github.io/meu-estoque-app/)**

## 🛠️ Stack Tecnológico

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)

- **UI/UX:** Vanilla CSS com variáveis nativas, Flexbox, e design responsivo fluido.
- **Backend/DB:** Firebase Authentication SDK e Cloud Firestore NoSQL.
- **Data-Viz:** Chart.js para dashboards e métricas.

## 💻 Como Rodar Localmente (Desenvolvimento)

Nenhuma configuração de servidor necessária (Serverless Architecture).

1. Clone o repositório
   ```sh
   git clone https://github.com/EdCarlosNunes/meu-estoque-app.git
   ```
2. Abra a pasta e utilize a extensão `Live Server` do VSCode no arquivo `index.html` ou hospede diretamente em qualquer CDN estática.

---
*Feito com 💡 foco absoluto em Performance e UI/UX.*
