import {
	findCompaniesList,
	countCompaniesList,
	findCompanySummary,
	findCompanyTagCounts,
	findCompanyGames,
} from "./companies.repository";
import {
	companyConfig,
	companyDetailResponse,
	companyListFilters,
	companyListResponse,
	companyListSort,
	COMPANIES_LIST_SORTS,
	COMPANIES_PAGE_SIZE,
} from "./companies.types";
import {
	formatAssetUrl,
	parseNumericRange,
} from "@/modules/games/games.service";
import { sortOrder } from "@/modules/games/games.types";

const parseCompanyFilters = (
	rawFilters: string | undefined,
): companyListFilters | undefined => {
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
	const filters: companyListFilters = {
		revenue: parseNumericRange(raw.revenue),
		games: parseNumericRange(raw.games),
	};

	return filters.revenue || filters.games ? filters : undefined;
};

// Every param comes straight off the query string, so each is validated here
export const fetchCompaniesList = async (
	config: companyConfig,
	rawPage: string | undefined,
	rawSearch: string | undefined,
	rawFilters: string | undefined,
	rawSort: string | undefined,
	rawOrder: string | undefined,
): Promise<companyListResponse> => {
	const parsedPage = Number(rawPage);
	const page =
		Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

	const search = rawSearch?.trim() ? rawSearch.trim() : null;
	const filters = parseCompanyFilters(rawFilters);
	const sort = COMPANIES_LIST_SORTS.includes(rawSort as companyListSort)
		? (rawSort as companyListSort)
		: "total_revenue";
	const order: sortOrder = rawOrder === "asc" ? "asc" : "desc";

	const [companies, total] = await Promise.all([
		findCompaniesList(
			config,
			search,
			filters,
			sort,
			order,
			COMPANIES_PAGE_SIZE,
			(page - 1) * COMPANIES_PAGE_SIZE,
		),
		countCompaniesList(config, search, filters),
	]);

	return {
		companies,
		total,
		page,
		page_size: COMPANIES_PAGE_SIZE,
		total_pages: Math.max(1, Math.ceil(total / COMPANIES_PAGE_SIZE)),
	};
};

export const fetchCompanyById = async (
	config: companyConfig,
	rawCompanyId: string | undefined,
): Promise<companyDetailResponse | null> => {
	// Postgres rejects an id that is not a positive int4 with an error rather
	// than an empty result, so those read as not found here
	const companyId = Number(rawCompanyId);
	if (
		!rawCompanyId ||
		!Number.isInteger(companyId) ||
		companyId <= 0 ||
		companyId > 2_147_483_647
	) {
		return null;
	}

	const [company, tags, rows] = await Promise.all([
		findCompanySummary(config, companyId),
		findCompanyTagCounts(config, companyId),
		findCompanyGames(config, companyId),
	]);
	if (!company) {
		return null;
	}

	const games = rows.map(({ asset_url_format, ...row }) => ({
		...row,
		small_capsule: formatAssetUrl(asset_url_format, row.small_capsule),
		header: formatAssetUrl(asset_url_format, row.header),
	}));

	return { company, tags, games };
};
