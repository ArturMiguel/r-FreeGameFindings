import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { RedditApiType } from "../types/RedditApiType";
import { RedditAuthor } from "../types/RedditAuthor";
import { RedditPost } from "../types/RedditPost";

export class RedditService {
  private apiType = (process.env.REDDIT_API_TYPE as RedditApiType) || RedditApiType.RSS;
  private clientId = process.env.REDDIT_CLIENT_ID;
  private clientSecret = process.env.REDDIT_CLIENT_SECRET;
  private userAgent = process.env.REDDIT_USER_AGENT;
  private defaultAvatar = "https://styles.redditmedia.com/t5_30mv3/styles/communityIcon_xnoh6m7g9qh71.png";

  async authorize(): Promise<string | null> {
    if (this.apiType == RedditApiType.RSS) {
      return null;
    }

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
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  async getPosts(token?: string): Promise<RedditPost[]> {
    if (this.apiType == RedditApiType.RSS) {
      return this.getPostsFromRSS();
    }
    return this.getPostsFromOAuth(token);
  }

  async getUser(username: string, token?: string): Promise<RedditAuthor> {
    if (this.apiType == RedditApiType.RSS) {
      return this.buildAuthor(username);
    }
    return this.getUserFromOAuth(username, token);
  }

  private buildAuthor(name: string, avatarUrl?: string): RedditAuthor {
    return {
      name: name,
      avatar_url: avatarUrl || this.defaultAvatar,
      url: `https://www.reddit.com/user/${name}`,
    };
  }

  private getOAuthHeaders(token: string) {
    return {
      "Authorization": `Bearer ${token}`,
      "User-Agent": this.userAgent
    };
  }

  private async getPostsFromOAuth(token: string): Promise<RedditPost[]> {
    try {
      const response = await axios.get("https://oauth.reddit.com/r/FreeGameFindings/new.json?limit=10&raw_json=1", {
        headers: this.getOAuthHeaders(token),
      });

      return response.data.data.children.map(({ data }) => ({
        id: data.id,
        title: data.title,
        author: this.buildAuthor(data.author),
        subreddit: data.subreddit,
        permalink: data.permalink,
        url: data.url,
        created_utc: data.created_utc,
        over_18: data.over_18 == true,
        preview_image_url: data.preview?.images?.[0]?.source?.url
      }));
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  private async getPostsFromRSS(): Promise<RedditPost[]> {
    try {
      const response = await axios.get("https://www.reddit.com/r/FreeGameFindings/new.rss");

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });

      const feed = parser.parse(response.data);
      const entries = feed.feed?.entry;

      if (!entries) return [];

      const entryList = Array.isArray(entries) ? entries : [entries];

      return entryList.map(entry => {
        const authorName = entry.author.name.replace("/u/", "");
        const postUrl = entry.link["@_href"];
        const content = entry.content?.["#text"] || (typeof entry.content == "string" ? entry.content : "");

        const extractLinkFromContent = (content: string): string | null => {
          const match = content.match(/<a\s+href="([^"]+)">\[link\]<\/a>/);
          return match ? match[1] : null;
        }

        return {
          id: String(entry.id).replace("t3_", ""),
          title: entry.title,
          author: this.buildAuthor(authorName),
          subreddit: entry.category["@_term"],
          permalink: postUrl.replace("https://www.reddit.com", ""),
          url: extractLinkFromContent(content) || postUrl,
          created_utc: Math.floor(new Date(entry.published).getTime() / 1000),
          over_18: false,
          preview_image_url: entry["media:thumbnail"]?.["@_url"],
        };
      });
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  private async getUserFromOAuth(username: string, token: string): Promise<RedditAuthor> {
    try {
      const response = await axios.get(`https://oauth.reddit.com/user/${username}/about`, {
        headers: this.getOAuthHeaders(token),
      });

      return this.buildAuthor(username, response.data.data.snoovatar_img);
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }
}
