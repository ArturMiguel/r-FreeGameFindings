<div style='text-align: center'>
<h3>
<h1> r/FreeGameFindings </h1>
  <a href='./README.md'>English</a> •
  <a href='./README.pt-br.md'>Português (Brasil)</a>
</h3> 
</div>

<hr>

Web scraper that collects free games posts published on Reddit and sends them to Discord. All information collected has their respective links and authors mentioned.

## How does it work?

The bot scrapes the subreddit [r/FreeGameFindings](https://www.reddit.com/r/FreeGameFindings/) and collects recent publications. After collection, the bot removes those that are ads, that have no origin or that have already been sent. At the end, the publications are sent to discord through the webhook.

<img src='./assets/preview.png' alt='image not found'>

## Installation

1) Clone the project.
2) Install the dependencies: 
```
npm install
```
3) Create a file called `.env` at the project root and put the variables values:
```
WEBHOOK= # Discord webhook URL
INTERVAL= # Interval in ms
```
4) Type `node .` to start the application.