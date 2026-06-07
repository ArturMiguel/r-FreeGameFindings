export interface SteamAppDetails {
  name: string;
  categories: { id: number, description: string }[];
  genres: { id: number, description: string }[];
  achievements: { total: number };
  release_date: { coming_soon: number, date: string };
  publishers: string[];
  price_overview?: {
    discount_percent: number;
  };
}
