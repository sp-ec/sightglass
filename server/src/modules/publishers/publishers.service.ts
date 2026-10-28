import {
	findPublishersList,
	countPublishersList,
} from "./publishers.repository";
import {
	publisherListFilters,
	publisherListResponse,
	publisherListSort,
	PUBLISHERS_LIST_SORTS,
	PUBLISHERS_PAGE_SIZE,
} from "./publishers.types";
import { parseNumericRange } from "@/modules/games/games.service";
import { sortOrder } from "@/modules/games/games.types";

const parsePublisherFilters = (
	rawFilters: string | undefined,
): publisherListFilters | undefined => {
	if (!rawFilters) {
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawFilters);
	} catch (error) {
		return undefined;
	}

	if (!parsed || typeof parsed !== "object") {
		return undefined;
	}

	const raw = parsed as Record<string, unknown>;
	const filters: publisherListFilters = {
		revenue: parseNumericRange(raw.revenue),
		games: parseNumericRange(raw.games),
	};

	return filters.revenue || filters.games ? filters : undefined;
};

// Every param comes straight off the query string, so each is validated here
export const fetchPublishersList = async (
	rawPage: string | undefined,
	rawSearch: string | undefined,
	rawFilters: string | undefined,
	rawSort: string | undefined,
	rawOrder: string | undefined,
): Promise<publisherListResponse> => {
	const parsedPage = Number(rawPage);
	const page =
		Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

	const search = rawSearch?.trim() ? rawSearch.trim() : null;
	const filters = parsePublisherFilters(rawFilters);
	const sort = PUBLISHERS_LIST_SORTS.includes(rawSort as publisherListSort)
		? (rawSort as publisherListSort)
		: "total_revenue";
	const order: sortOrder = rawOrder === "asc" ? "asc" : "desc";

	const [publishers, total] = await Promise.all([
		findPublishersList(
			search,
			filters,
			sort,
			order,
			PUBLISHERS_PAGE_SIZE,
			(page - 1) * PUBLISHERS_PAGE_SIZE,
		),
		countPublishersList(search, filters),
	]);

	return {
		publishers,
		total,
		page,
		page_size: PUBLISHERS_PAGE_SIZE,
		total_pages: Math.max(1, Math.ceil(total / PUBLISHERS_PAGE_SIZE)),
	};
};
