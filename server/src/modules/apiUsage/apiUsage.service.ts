import {
	getTodayUsage,
	reserveApiRequest,
} from "@/modules/apiUsage/apiUsage.repository";
import {
	ApiLimitReachedError,
	apiUsageView,
	STEAM_API_DAILY_LIMIT,
} from "@/modules/apiUsage/apiUsage.types";

const nextUtcMidnight = (): Date => {
	const now = new Date();
	return new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
	);
};

// Call before every keyed Steam Web API request. The slot is taken before the
// request is sent, because Steam counts failed requests too.
export const reserveSteamApiRequest = async (): Promise<void> => {
	if (!(await reserveApiRequest(STEAM_API_DAILY_LIMIT))) {
		throw new ApiLimitReachedError();
	}
};

export const isApiLimitReached = async (): Promise<boolean> =>
	(await getTodayUsage()) >= STEAM_API_DAILY_LIMIT;

export const getApiUsage = async (): Promise<apiUsageView> => ({
	used: await getTodayUsage(),
	limit: STEAM_API_DAILY_LIMIT,
	resetsAt: nextUtcMidnight().toISOString(),
});
