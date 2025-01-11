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

    const authorization = await redditService.authorize();
    let postList = (await redditService.getPosts(authorization)).data.children;

    if (lastDate) {
      postList = postList.filter(post => momentTz(new Date(post.data.created_utc * 1000)).isAfter(lastDate));
    }

    console.log(`${postList.length} new post(s)`);

    if (!postList.length) {
      return;
    }
    
    const embedList = await Promise.all(postList.map(async ({ data }) => {
      const authorInfo = await redditService.getUser(data.author, authorization);
      
      const payload = {
        id: data.id,
        description: `Source ${data.over_18 == true ? "(+18)" : ""}: [${data.subreddit}](https://www.reddit.com${data.permalink})`,
        title: data.title,
        url: data.url,
        footer: {
          icon_url: authorInfo.data.snoovatar_img || "https://styles.redditmedia.com/t5_30mv3/styles/communityIcon_xnoh6m7g9qh71.png",
          text: `${data.author} • ${momentTz(new Date(data.created_utc * 1000)).tz("America/Sao_Paulo").format("DD/MM/YYYY [às] HH:mm:ss")}`
        }
      }
      if (data.preview) {
        payload["image"] = {
          url: data.preview.images[0].source.url
        }
      }
      return payload;
    }))

    lastDate = new Date(postList[0].data.created_utc * 1000)

    await discordService.sendWebhook({
      content: "",
      tts: false,
      embeds: embedList
    })
  } catch (error) {
    console.log(error.message);
  }
}

exec().finally(() => {
  nodeCron.schedule("0 */2 * * *", () => {
    exec();
  })
});
