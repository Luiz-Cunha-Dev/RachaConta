# RachaConta 💸

Bem-vindo ao RachaConta! Esta é uma aplicação Next.js desenvolvida com o Firebase Studio para calcular e dividir contas de forma fácil e inteligente.

## Funcionalidades

*   **Cálculo de Gorjeta**: Insira o valor total da conta e defina a porcentagem de gorjeta desejada usando um slider ou campo de input.
*   **Sugestão de Gorjeta com IA**: Forneça a URL de um restaurante e deixe a Inteligência Artificial (Gemini) sugerir uma porcentagem de gorjeta com base em fatores como localização e percepção de qualidade do serviço. (Requer configuração de API Key do Google AI).
*   **Modos de Divisão da Conta**:
    *   **Dividir Igualmente**: Divida o valor total (incluindo gorjeta) igualmente entre um número especificado de pessoas.
    *   **Divisão Personalizada por Porcentagem**: Atribua nomes e porcentagens específicas da conta para cada pessoa. O aplicativo valida se a soma das porcentagens é 100%.
*   **Resultados Detalhados**: Veja claramente o valor da gorjeta, o valor total da conta com gorjeta e o valor por pessoa (ou os valores individuais na divisão personalizada).
*   **Modo Escuro**: Alterne entre temas claro e escuro para melhor conforto visual.
*   **Baixar Resultado**: Faça o download de um resumo da conta em formato `.txt`.
*   **Compartilhar Resultado**: Compartilhe o resumo da conta usando a API de compartilhamento do navegador ou copie para a área de transferência.
*   **Interface Responsiva e Amigável**: Desenvolvido com Next.js, React, ShadCN UI, e Tailwind CSS.

## Configurando a API Key do Google AI (Opcional)

Para utilizar a funcionalidade de sugestão de gorjeta por Inteligência Artificial, você precisará de uma chave de API do Google AI (para modelos Gemini).

1.  **Obtenha sua API Key**:
    *   Visite o [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Crie um novo projeto ou selecione um existente.
    *   Clique em "Get API key" para gerar sua chave.

2.  **Configure a Chave na Aplicação**:
    *   Na interface do RachaConta, clique no ícone de chave inglesa (Configurar Chave de IA) localizado no cabeçalho ou próximo ao botão de sugestão de gorjeta.
    *   Cole sua API Key no campo fornecido e clique em "Salvar Chave".
    *   A chave será armazenada localmente no seu navegador (`localStorage`) e usada para as chamadas à API do Gemini.

**Nota de Segurança**: Armazenar a API Key no `localStorage` é uma conveniência para desenvolvimento e prototipagem. Para aplicações em produção, é recomendado gerenciar chaves de API de forma segura no backend, utilizando variáveis de ambiente.

## Como Iniciar (Desenvolvimento)

Este projeto foi iniciado com o Firebase Studio.

1.  **Clone o repositório (se aplicável).**
2.  **Instale as dependências**:
    ```bash
    npm install
    ```
3.  **Execute o servidor de desenvolvimento Next.js**:
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002` (ou outra porta, se configurada).

4.  **(Opcional) Execute o servidor de desenvolvimento Genkit (para testar fluxos de IA localmente)**:
    ```bash
    npm run genkit:dev
    ```

## Tecnologias Utilizadas

*   **Next.js (App Router)**
*   **React**
*   **TypeScript**
*   **ShadCN UI Components**
*   **Tailwind CSS**
*   **Genkit (para funcionalidades de IA com Gemini)**
*   **Lucide React (ícones)**
*   **Next-Themes (para modo escuro/claro)**

Divirta-se calculando e dividindo suas contas!
