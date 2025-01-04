<div style='text-align: center'>
<h3>
<h1> r/FreeGameFindings </h1>
  <a href='./README.md'>English</a> •
  <a href='./README.pt-br.md'>Português (Brasil)</a>
</h3> 
</div>

<hr>

Web scraper que coleta jogos gratuitos publicados no Reddit [r/FreeGameFindings](https://www.reddit.com/r/FreeGameFindings/) e os envia para o Discord via webhook.

<img src='./assets/preview.png' alt='image not found'>

## Instalação:

1) Clone este projeto:
```
git clone https://github.com/ArturMiguel/r-FreeGameFindings
```
2) Instale as dependências:
```
npm ci
```
3) Crie um arquivo chamado `.env` na raiz do projeto e coloque essas variáveis:
```
WEBHOOK= # URL do Webhook do Discord
INTERVAL= # Intervalo em milissegundos
```
4) Digite npm `run start` para iniciar a aplicação.