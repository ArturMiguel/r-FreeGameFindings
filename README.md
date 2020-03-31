# Reddit scraper

Bot that checks free game posts published on Reddit and sends them to Discord.

*This project is for personal use. All information collected has their respective links and authors mentioned.

## How does it work?

The bot scrapes [r/FreeGameFindings](https://www.reddit.com/r/FreeGameFindings/) and collects all recent posts. After collecting the posts, the bot removes the invalid posts (not free games or already been sent) and sends the new posts to Discord. The `id` of the last post sent is stored locally in `./src/recent-post.json` for comparisons.

## Requirements
- [Node.js](https://nodejs.org/en/)
- [Discord app/bot](https://discordapp.com/developers/applications)

## Environment

```
# .env

BOT_TOKEN = <discord_bot_token>
GUILD_ID = <your_server_id>
CHANNEL_ID = <post_channel_id>
INTERVAL = <check_interval_in_milliseconds>
```