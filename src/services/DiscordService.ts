import axios from "axios";

export class DiscordService {
  private webhookURL = process.env.DISCORD_WEBHOOK;

  async sendWebhook(data: any) {
    try {
      const response = await axios.post(this.webhookURL, data);
      return response.statusText;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}