const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment-timezone')

const uri = 'https://www.reddit.com/r/FreeGameFindings/new/'
let lastPostDate = ''

module.exports = async (startDate) => {
    const response = await axios.get(uri)
    const $ = cheerio.load(response.data)
    const script = $('script[id="data"]').get()[0].children[0].data
    const data = JSON.parse(script.substring(14).replace(/;/g, ''))
    const posts = data.posts.models
    
    for (const key in posts) {
        if (posts[key].isSponsored || !posts[key].source || startDate > moment(posts[key].created) || posts[key].created <= lastPostDate) delete posts[key]
    }

    const keys = Object.keys(posts)
    if (keys.length > 0) lastPostDate = posts[keys[0]].created

    return posts
}
