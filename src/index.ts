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

    console.log(`[Scrapper] ${postList.length} new post(s)`);

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
    console.log(`[Scrapper] ${steamPostList.length} Steam post(s)`);

    if (steamPostList.length) {
      try {
        for await (let post of steamPostList) {
          const appId = (post.url.match(/\/app\/(\d+)/)?.[1] || 0).toString();
          const appDetails = await steamService.getAppDetails(appId);

          console.log(`[Steam] ${appDetails.name}: discount ${appDetails?.price_overview?.discount_percent}`);

          if (appDetails?.price_overview?.discount_percent == 100) {

            // User status
            let statusText = `🎁 Free "${appDetails.name}". Claim it now and it's yours to keep.\n\n${post.url}`;
            const lines: string[] = [];
            lines.push(`🎮 Genres: ${appDetails.genres.map(g => g.description).join(", ")}\n`);
            lines.push(`🏷️ Categories: ${appDetails.categories.map(c => c.description).join(", ")}\n`);
            lines.push(`🏆 Achievements: ${appDetails.achievements.total}\n`);
            lines.push(`📅 Release date: ${appDetails.release_date.date}\n`);
            lines.push(`🏢 Publisher: ${appDetails.publishers.join(", ")}\n`);
            statusText += `\n\n${lines.join("\n")}`;

            await steamService.createUserStatus(statusText, appId);
            await new Promise(resolve => setTimeout(() => resolve(1), 30000));
            
            // Group announcement
            let announcementBody = `🎁 Claim it now and it's yours to keep.\n\n${post.url}`;
            const announcementLines: string[] = [];
            announcementLines.push(`🎮 [b]Genres:[/b] ${appDetails.genres.map(g => g.description).join(", ")}\n`);
            announcementLines.push(`🏷️ [b]Categories:[/b] ${appDetails.categories.map(c => c.description).join(", ")}\n`);
            announcementLines.push(`🏆 [b]Achievements:[/b] ${appDetails.achievements.total}\n`);
            announcementLines.push(`📅 [b]Release date:[/b] ${appDetails.release_date.date}\n`);
            announcementLines.push(`🏢 [b]Publisher:[/b] ${appDetails.publishers.join(", ")}\n`);
            announcementBody += `\n\n${announcementLines.join("\n")}`;

            await steamService.createGroupAnnouncement(`Free "${appDetails.name}"`, announcementBody);
          }

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
