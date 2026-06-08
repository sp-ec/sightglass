export type GameTitle = {
	app_id: number;
	name: string;
	last_modified?: number;
};

export type GameDetails = {
  app_id: number;
  name: string;
  developer: string;
  publisher: string;
  positive: number;
  negative: number;
  owners: string;
  price: number;
  ccu: number;
  tags: Record<string, number>;
  languages: string;
  genre: string;
};