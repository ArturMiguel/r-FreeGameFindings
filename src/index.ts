import "dotenv/config";
import momentTz from "moment-timezone";
import { RedditService } from "./services/RedditService";
import { DiscordService } from "./services/DiscordService";
import nodeCron from "node-cron";
import "./server";
import { SteamService } from "./services/SteamService";

let lastDate = null;
let isRunning = false;

async function exec() {
  if (isRunning) return;

  isRunning = true;

  try {
    const redditService = new RedditService();
    const discordService = new DiscordService();
    const steamService = new SteamService();

    // Get posts
    const authorization = await redditService.authorize();
    let postList = await redditService.getPosts(authorization);

    if (lastDate) {
      postList = postList.filter(post => momentTz(new Date(post.created_utc * 1000)).isAfter(lastDate));
    }

    console.log(`${postList.length} new post(s)`);

    if (!postList.length) {
      return;
    }

    lastDate = new Date(postList[0].created_utc * 1000);

    // Send to Discord
    try {
      const embedList = await Promise.all(postList.map(async (post) => {
        const authorInfo = await redditService.getUser(post.author.name, authorization);

        const payload = {
          id: post.id,
          description: `Source ${post.over_18 ? "(+18)" : ""}: [${post.subreddit}](https://www.reddit.com${post.permalink})`,
          title: post.title,
          url: post.url,
          footer: {
            icon_url: authorInfo.avatar_url,
            text: `${post.author.name} • ${momentTz(new Date(post.created_utc * 1000)).tz("America/Sao_Paulo").format("DD/MM/YYYY [às] HH:mm:ss")}`
          }
        }
        if (post.preview_image_url) {
          payload["image"] = {
            url: post.preview_image_url
          }
        }
        return payload;
      }))

      await discordService.sendWebhook({
        content: "",
        tts: false,
        embeds: embedList
      })
    } catch (error) {
      console.log(`[Discord] Failed to send ${postList.length} post(s): ${error.message}`);
    }

    // Send to Steam
    const steamPostList = postList.filter(p => p.url.includes("https://store.steampowered.com/app/"));

    try {
      for await (let post of steamPostList) {
        const appId = (post.url.match(/\/app\/(\d+)/)?.[1] || 0).toString();
        await steamService.sendStatus(`Available for free. Claim it now and it's yours to keep.\n\n${post.url}`, appId);
        await new Promise(resolve => setTimeout(() => resolve(1), 30000));
      }
    } catch (error) {
      console.log(`[Steam] Failed to send ${steamPostList.length} post(s): ${error.message}`);
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    isRunning = false;
  }
}

exec().finally(() => {
  nodeCron.schedule("* * * * *", () => {
    exec();
  })
});
