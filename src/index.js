require("dotenv").config();
const scraper = require("./scraper");
const momentTz = require("moment-timezone");
const axios = require("axios");

console.log("Bot started!");

let lastDate = null;

setInterval(async () => {
  let postList = await scraper();

  if (lastDate) {
    postList = postList.filter(post => momentTz(post.created_at).isAfter(lastDate));
  }

  const embedList = postList.map(post => {
    return {
      id: post.id,
      description: `[${post.content.domain}](${post.content.url})`,
      author: {
        icon_url: post.author.avatar,
        name: post.author.name,
        url: post.author.url
      },
      title: post.title,
      url: post.url,
      thumbnail: {
        url: post.content.image
      },
      footer: {
        text: `Postado em ${momentTz(post.created_at).tz("America/Sao_Paulo").format("DD/MM/YYYY [às] HH:mm:ss")}`
      },
    }
  })
  
  console.log(`${postList.length} post(s)`);

  if (embedList.length) {
    await axios.post(process.env.WEBHOOK, {
      content: "",
      tts: false,
      embeds: embedList
    }).catch(error => {
      console.log(`Status ${error.status}. Error: ${error.response.data}`)
    })

    lastDate = postList[0].created_at;
  }

}, process.env.INTERVAL);
