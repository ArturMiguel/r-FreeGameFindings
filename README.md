<div style='text-align: center'>
<h3>
<h1> r/FreeGameFindings </h1>
  <a href='./README.md'>English</a> •
  <a href='./README.pt-br.md'>Português (Brasil)</a>
</h3> 
</div>

<hr>

Web scraper that collects free games posts published on Reddit [r/FreeGameFindings](https://www.reddit.com/r/FreeGameFindings/) and sends them to Discord webhook.

<img src='./assets/preview.png' alt='image not found'>

## Installation

1) Clone this project.
```
git clone https://github.com/ArturMiguel/r-FreeGameFindings
```
2) Install the dependencies: 
```
npm ci
```
3) Create a file called `.env` at the project root and put the variables values:
```
WEBHOOK= # Discord webhook URL
INTERVAL= # Interval in ms
```
4) Type `npm run start` to start the application.