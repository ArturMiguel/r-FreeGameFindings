import axios from "axios";
import { SteamAppDetails } from "../types/SteamAppDetails";

export class SteamService {
  private sessionId = process.env.STEAM_SESSIONID;
  private steamLoginSecure = process.env.STEAM_LOGIN_SECURE;
  private userId = process.env.STEAM_USER_ID;
  private groupName = process.env.STEAM_GROUP_NAME;
  private userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

  private getHeaders() {
    return {
      "Cookie": `sessionid=${this.sessionId}; steamLoginSecure=${this.steamLoginSecure}`,
      "User-Agent": this.userAgent
    }
  }

  public async getAppDetails(appId: string): Promise<SteamAppDetails | null> {
    try {
      const response = await axios.get("https://store.steampowered.com/api/appdetails", {
        params: {
          appids: appId,
          l: "english"
        },
        headers: this.getHeaders()
      });

      const appData = response.data[appId];

      if (appData?.success && appData.data) {
        const data = appData.data;
        return {
          name: data.name,
          categories: data.categories,
          genres: data.genres,
          achievements: data.achievements || { total: 0 },
          release_date: data.release_date || { coming_soon: 0, date: "" },
          publishers: data.publishers,
          price_overview: data.price_overview
        };
      }

      return null;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async createUserStatus(statusText: string, appId: string) {
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
      throw new Error(error.message);
    }
  }

  public async createGroupAnnouncement(headline: string, body: string) {
    try {
      const params = new URLSearchParams();
      params.append("sessionID", this.sessionId);
      params.append("action", "post");
      params.append("headline", headline);
      params.append("body", body);

      params.append("languages[0][headline]", headline);
      params.append("languages[0][body]", body);

      for (let i = 1; i <= 31; i++) {
        params.append(`languages[${i}][headline]`, "");
        params.append(`languages[${i}][body]`, "");
        params.append(`languages[${i}][updated]`, "0");
      }

      const response = await axios.post(`https://steamcommunity.com/groups/${this.groupName}/announcements`, params, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
