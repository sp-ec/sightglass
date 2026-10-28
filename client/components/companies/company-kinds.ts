export type CompanyKind = "publisher" | "developer";

// path is both the API prefix and the page route
export const COMPANY_KINDS = {
	publisher: {
		path: "/publishers",
		singular: "publisher",
		plural: "publishers",
		gamesLabel: "Games Published",
	},
	developer: {
		path: "/developers",
		singular: "developer",
		plural: "developers",
		gamesLabel: "Games Developed",
	},
} as const satisfies Record<
	CompanyKind,
	{ path: string; singular: string; plural: string; gamesLabel: string }
>;
