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

    postList = postList.filter(post => post.url.includes("858710"));

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

    if (steamPostList.length) {
      try {
        const steamAppIds = steamPostList.map(p => (p.url.match(/\/app\/(\d+)/)?.[1] || 0).toString());
        const steamDetails = await steamService.getAppDetails(steamAppIds);

        for await (let post of steamPostList) {
          const appId = (post.url.match(/\/app\/(\d+)/)?.[1] || 0).toString();
          const appDetails = steamDetails.get(appId);

          let statusText = `🎁 Available for free. Claim it now and it's yours to keep.\n\n${post.url}`;

          if (appDetails) {
            const lines: string[] = [];

            if (appDetails.genres.length) {
              lines.push(`🎮 Genres: ${appDetails.genres.map(g => g.description).join(", ")}\n`);
            }
            if (appDetails.categories.length) {
              lines.push(`🏷️ Categories: ${appDetails.categories.map(c => c.description).join(", ")}\n`);
            }
            if (appDetails.achievements.length && appDetails.achievements[0].total > 0) {
              lines.push(`🏆 Achievements: ${appDetails.achievements[0].total}\n`);
            }
            if (appDetails.release_date.date) {
              lines.push(`📅 Release date: ${appDetails.release_date.date}\n`);
            }
            if (appDetails.publishers.length) {
              lines.push(`🏢 Publisher: ${appDetails.publishers.join(", ")}\n`);
            }

            if (lines.length) {
              statusText += `\n\n${lines.join("\n")}`;
            }
          }

          await steamService.sendStatus(statusText, appId);
          await new Promise(resolve => setTimeout(() => resolve(1), 30000));
        }
      } catch (error) {
        console.log(`[Steam] Failed to send ${steamPostList.length} post(s): ${error.message}`);
      }
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    isRunning = false;
  }
}

exec().finally(() => {
  const interval = process.env.INTERVAL || "0 * * * *";
  nodeCron.schedule(interval, () => {
    exec();
  })
});
