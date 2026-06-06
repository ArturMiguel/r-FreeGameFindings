import "dotenv/config";
import momentTz from "moment-timezone";
import { RedditService } from "./services/RedditService";
import { DiscordService } from "./services/DiscordService";
import nodeCron from "node-cron";
import "./server";

let lastDate = null;

async function exec() {
  try {
    const redditService = new RedditService();
    const discordService = new DiscordService();

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

    // Send to Discord
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

    lastDate = new Date(postList[0].created_utc * 1000)
  } catch (error) {
    console.log(error.message);
  }
}

exec().finally(() => {
  nodeCron.schedule("0 * * * *", () => {
    exec();
  })
});
