import "dotenv/config";
import momentTz from "moment-timezone";
import { RedditService } from "./services/RedditService";
import { DiscordService } from "./services/DiscordService";
import "./server";

let lastDate = null;

setInterval(async () => {
  try {
    const redditService = new RedditService();
    const discordService = new DiscordService();

    const authorization = await redditService.authorize();
    let postList = (await redditService.getPosts(authorization)).data.children;

    if (lastDate) {
      postList = postList.filter(post => momentTz(new Date(post.created_utc * 1000)).isAfter(lastDate));
    }

    if (!postList.length) {
      return;
    }
    
    const embedList = await Promise.all(postList.map(async ({ data }) => {
      const authorInfo = await redditService.getUser(data.author, authorization);
      
      const payload = {
        id: data.id,
        description: `Source: [${data.subreddit}](https://www.reddit.com${data.permalink})`,
        title: data.title,
        url: data.url,
        footer: {
          icon_url: authorInfo.data.snoovatar_img,
          text: `${data.author} • ${momentTz(new Date(data.created_utc * 1000)).tz("America/Sao_Paulo").format("DD/MM/YYYY [às] HH:mm:ss")}`
        },
      }
      if (data.thumbnail.includes("http")) { // "default", "nfsw" (over_18 = true), ...
        payload["thumbnail"] = {
          url: data.thumbnail
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
}, parseInt(process.env.INTERVAL));