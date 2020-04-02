const request = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')

const path = `./src/recent-post.json`
if (!fs.existsSync(path)) fs.writeFileSync(path, '{ "created": 0, "title": "" }')

module.exports = async () => {
    const recentPost = JSON.parse(fs.readFileSync(path, 'utf8'))
    const options = {
        uri: 'https://www.reddit.com/r/FreeGameFindings/new/',
        transform: (body) => {
            return cheerio.load(body)
        }
    }
    const $ = await request(options)
    const script = $('script[id="data"]').get()[0].children[0].data
    const data = JSON.parse(script.substring(14).replace(/;/g, ''))
    const posts = data.posts.models
    for (const key in posts) {
        if (posts[key].created <= recentPost.created || posts[key].isSponsored || !posts[key].source) delete posts[key]
    }
    const oKeys = Object.keys(posts)
    if (oKeys.length > 0) {
      fs.writeFileSync(path, `{ "created": ${posts[oKeys[0]].created}, "title": "${posts[oKeys[0]].title}" }`)
    }
    return posts
}
