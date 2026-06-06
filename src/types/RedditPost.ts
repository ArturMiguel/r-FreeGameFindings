import { RedditAuthor } from "./RedditAuthor";

export interface RedditPost {
  id: string;
  title: string;
  author: RedditAuthor;
  subreddit: string;
  permalink: string;
  url: string;
  created_utc: number;
  over_18: boolean;
  preview_image_url?: string;
}
