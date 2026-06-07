import axios from "axios";
import { SteamAppDetails } from "../types/SteamAppDetails";

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

  public async getAppDetails(appIds: string[]): Promise<Map<string, SteamAppDetails>> {
    try {
      const response = await axios.get("https://store.steampowered.com/api/appdetails", {
        params: {
          appids: appIds.join(","),
          l: "english",
          filters: "categories,genres,achievements,release_date,publishers"
        },
        headers: this.getHeaders()
      });

      const result = new Map<string, SteamAppDetails>();

      for (const appId of appIds) {
        const appData = response.data[appId];
        if (appData?.success && appData.data) {
          const data = appData.data;
          result.set(appId, {
            categories: data.categories || [],
            genres: data.genres || [],
            achievements: data.achievements || [],
            release_date: data.release_date || { coming_soon: 0, date: "" },
            publishers: data.publishers || []
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
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
