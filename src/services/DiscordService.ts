import axios from "axios";

export class DiscordService {
  private webhookURL = process.env.DISCORD_WEBHOOK;
  private maxEmbedsPerRequest = 10;

  public async sendWebhook(data: any) {
    try {
      const embeds: any[] = data.embeds || [];

      for (let i = 0; i < embeds.length; i += this.maxEmbedsPerRequest) {
        await axios.post(this.webhookURL, {
          ...data,
          embeds: embeds.slice(i, i + this.maxEmbedsPerRequest),
        });
      }
    } catch (error) {
      throw new Error(error.response ? error.response.data.embeds.join(",") : error.message);
    }
  }
}