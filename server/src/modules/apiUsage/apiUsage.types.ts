// Valve's documented cap on Steam Web API calls per key per day
export const STEAM_API_DAILY_LIMIT = 100_000;

export type apiUsageView = {
	used: number;
	limit: number;
	// ISO timestamp of the next UTC midnight, when the count starts over
	resetsAt: string;
};

export class ApiLimitReachedError extends Error {
	constructor() {
		super("Daily Steam API limit reached");
		this.name = "ApiLimitReachedError";
	}
}
