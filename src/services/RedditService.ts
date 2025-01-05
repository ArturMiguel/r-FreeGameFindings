import axios from "axios";

export class RedditService {
  private clientId = process.env.REDDIT_CLIENT_ID;
  private clientSecret = process.env.REDDIT_CLIENT_SECRET;
  private userAgent = process.env.REDDIT_USER_AGENT;

  async authorize() {
    try {
      const basicClient = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

      const params = new URLSearchParams({
        grant_type: "client_credentials",
      });

      const options = {
        headers: {
          "Authorization": `Basic ${basicClient}`,
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }

      const response = await axios.post("https://www.reddit.com/api/v1/access_token", params, options);
      return response.data.access_token;
    } catch (error) {
      throw new Error(error.response ? error.response.data : error.message);
    }
  }

  async getPosts(token: string) {
    try {
      const options = {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": this.userAgent
        }
      }

      const response = await axios.get("https://oauth.reddit.com/r/FreeGameFindings/new.json?limit=10", options);
      return response.data;
    } catch (error) {
      throw new Error(error.response ? error.response.data : error.message);
    }
  }

  async getUser(username: string, token: string) {
    try {
      const options = {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": this.userAgent
        }
      }

      const response = await axios.get(`https://oauth.reddit.com/user/${username}/about`, options);
      return response.data;
    } catch (error) {
      throw new Error(error.response ? error.response.data : error.message);
    }
  }
}