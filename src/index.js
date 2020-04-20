require('dotenv').config()
const scraper = require('./scraper')
const moment = require('moment-timezone')
const axios = require('axios')

const startDate = moment()

console.log('Bot started!')

setInterval(async () => {
    const posts = await scraper(startDate)
    const embeds = []

    for (const key in posts) {
        embeds.push({
            title: posts[key].flair.length > 0 ? `(${posts[key].flair[0].text}) ${posts[key].title}` : posts[key].title,
            url: posts[key].permalink,
            description: `Página do jogo: [${posts[key].source.displayText}](${posts[key].source.url})`,
            image: {
                url: posts[key].preview ? posts[key].preview.url : ''
            },
            footer: {
                text: `Postado por "${posts[key].author}" em ${moment(posts[key].created).tz('America/Sao_Paulo').format('DD/MM/YYYY [às] HH:mm:ss')}`
            }
        })
    }
    
    if (embeds.length > 0) {
        await axios.post(process.env.WEBHOOK, {
            embeds: embeds
        })
    }
    console.log(`${Object.keys(posts).length} new post(s).`)
}, process.env.INTERVAL)
