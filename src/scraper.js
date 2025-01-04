const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async () => {
  const response = await axios.get("https://www.reddit.com/r/FreeGameFindings/new")
  const $ = cheerio.load(response.data)

  const postList = [];

  $("shreddit-post").each((_, post) => {
    const { attribs } = post;
    const img = $(post).find("div[slot='thumbnail'] > a > img").get(0);
    const createdAt = $(post).find("span[slot='credit-bar'] faceplate-timeago").get(0).attribs["ts"];

    postList.push({
      id: attribs["id"],
      title: attribs["post-title"],
      url: `https://www.reddit.com${attribs["permalink"]}`,
      created_at: createdAt,
      author: {
        id: attribs["author-id"],
        name: attribs["author"],
        avatar: attribs["icon"],
        url: `https://www.reddit.com/user/${attribs["author"]}`
      },
      content: {
        domain: attribs["domain"],
        url: attribs["content-href"],
        image: img ? img.attribs["src"] : null
      }
    })
  });

  return postList;
}
