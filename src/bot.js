require('dotenv').config()
const Discord = require('discord.js')
const scraper = require('./scraper')
const moment = require('moment')

moment.locale('pt-br')

const bot = new Discord.Client()

bot.on('ready', () => {
    console.log('Bot started!')
    setInterval(async () => {
        const posts = await scraper()
        for (const key in posts) sendMessage(posts[key])
        console.log(`${Object.keys(posts).length} new posts (${moment().format('DD/MM/YYYY [-] HH:mm:ss')}).`)
    }, 1000 * 60 * 60)
})

function sendMessage(post) {
    const guildId = process.env.GUILD_ID
    const channelId = process.env.CHANNEL_ID
    const channel = bot.guilds.cache.get(guildId).channels.cache.get(channelId)
    const embed = new Discord.MessageEmbed()
    .setTitle(post.title)
    .setURL(post.permalink)
    .setDescription(`[Ir para ${post.source.displayText}](${post.source.url})`)
    .setImage(post.preview ? post.preview.url : '')
    .setFooter(`Postado por ${post.author} em ${moment(post.created).format('DD/MM/YYYY [às] HH:mm:ss')}`)
    channel.send(embed)
}

bot.login(process.env.BOT_TOKEN)
