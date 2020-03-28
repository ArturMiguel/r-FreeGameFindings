const request = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')

module.exports = async () => {
    const path = './src/recent-post.json'
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{ "id": "" }')
    const recentPost = JSON.parse(fs.readFileSync(path, 'utf8'))

    const options = {
        uri: 'https://www.reddit.com/r/FreeGamesOnSteam/',
        transform: (body) => {
            return cheerio.load(body)
        }
    }
    const $ = await request(options)
    const script = $('script[id="data"]').get()[0].children[0].data
    const data = JSON.parse(script.substring(14).replace(/;/g, ''))
    const posts = data.posts.models
    let isRecent = true
    Object.keys(posts).forEach((k) => {
        if (posts[k].id === recentPost.id) isRecent = false
        if (isRecent === false || posts[k].isSponsored || !posts[k].source) delete posts[k]
    })
    if (Object.keys(posts).length > 0) fs.writeFileSync(path, `{ "id": "${Object.keys(posts)[0]}" }`)
    return posts
}
