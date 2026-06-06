import axios from "axios";

export class SteamService {
  private sessionId = process.env.STEAM_SESSIONID;
  private steamLoginSecure = process.env.STEAM_LOGIN_SECURE;
  private userId = process.env.STEAM_USER_ID;
  private userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

  private getHeaders() {
    return {
      "Cookie": `sessionid=${this.sessionId}; steamLoginSecure=${this.steamLoginSecure}`,
      "User-Agent": this.userAgent
    }
  }

  public async sendStatus(statusText: string, appId: string) {
    try {
      const formData = new FormData();
      formData.append("sessionid", this.sessionId);
      formData.append("status_text", statusText);
      formData.append("appid", appId);

      const response = await axios.post(`https://steamcommunity.com/profiles/${this.userId}/ajaxpostuserstatus`, formData, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
  }
}
