import {
	estimationSettings,
	gameEstimate,
	estimationSql,
	gameEstimateInput,
	priceMultiplier,
	uncertaintyBand,
} from "@/modules/appSettings/appSettings.types";

// Units = Reviews × clamp(Baseline × Tag × Price × (Reviews / Divisor) ^ Exponent, Min, Max)
// Gross = Units × Price × RealizedShare × (1 − RefundRate)
//
// This file holds the formula twice: once in TypeScript as the readable
// reference, and once as SQL so the chart queries can aggregate it over the
// whole library. The two must agree; every edge-case rule below is applied in
// both, in the same order.

const SECONDS_PER_YEAR = 31557600;

// games.steam_release_date is TIMESTAMP WITHOUT TIME ZONE, but it is written
// from a JS Date (an absolute instant), so node-pg serializes it in the
// process's local zone. Reading it back through node-pg round-trips correctly,
// but Postgres arithmetic would read that local wall-clock value as UTC and be
// wrong by the offset. Converting AT TIME ZONE this zone undoes that, and is
// DST-aware. Storing the column as TIMESTAMPTZ would remove the need entirely.
const IANA_ZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/;

const localTimeZone = (): string => {
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	return zone && IANA_ZONE_PATTERN.test(zone) ? zone : "UTC";
};

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

// Postgres renders a float in scientific notation for very small magnitudes,
// which is not valid in a numeric literal, so pin the format
const literal = (value: number): string => {
	if (!Number.isFinite(value)) {
		throw new Error(`Refusing to build SQL from a non-finite value: ${value}`);
	}

	return value.toFixed(10).replace(/0+$/, "").replace(/\.$/, ".0");
};

// Below-or-equal rows ascending, then above rows descending, so the first
// match in the chain is the tightest threshold that applies
const orderThresholds = <T extends { above: boolean }>(
	rows: T[],
	threshold: (row: T) => number,
): T[] => {
	const below = rows
		.filter((row) => !row.above)
		.sort((a, b) => threshold(a) - threshold(b));
	const above = rows
		.filter((row) => row.above)
		.sort((a, b) => threshold(b) - threshold(a));

	return [...below, ...above];
};

const matchesThreshold = (
	above: boolean,
	threshold: number,
	value: number,
): boolean => (above ? value > threshold : value <= threshold);

const findPriceMultiplier = (
	rows: priceMultiplier[],
	priceInCents: number,
): number => {
	const match = orderThresholds(rows, (row) => row.priceInCents).find((row) =>
		matchesThreshold(row.above, row.priceInCents, priceInCents),
	);

	return match?.multiplier ?? 1;
};

const findUncertaintyBand = (
	rows: uncertaintyBand[],
	reviewCount: number,
): { low: number; high: number } => {
	const match = orderThresholds(rows, (row) => row.reviewCount).find((row) =>
		matchesThreshold(row.above, row.reviewCount, reviewCount),
	);

	return { low: match?.low ?? 1, high: match?.high ?? 1 };
};

const resolveTagMultiplier = (
	settings: estimationSettings,
	tagIds: number[],
): number => {
	const multipliers = settings.tagMultipliers
		.filter((row) => tagIds.includes(row.tagId))
		.map((row) => row.mult);

	// A game matching no configured tag is left unscaled
	if (multipliers.length === 0) {
		return 1;
	}

	if (settings.tagResolution === "minimum") {
		return Math.min(...multipliers);
	}

	if (settings.tagResolution === "maximum") {
		return Math.max(...multipliers);
	}

	return multipliers.reduce((sum, value) => sum + value, 0) / multipliers.length;
};

const yearsSinceRelease = (
	releaseDate: Date | string | null,
	now: Date,
): number => {
	if (!releaseDate) {
		return 0;
	}

	const released = new Date(releaseDate).getTime();
	if (Number.isNaN(released)) {
		return 0;
	}

	// Never negative: an unreleased date must not inflate the realized share
	return Math.max(
		0,
		(now.getTime() - released) / (SECONDS_PER_YEAR * 1000),
	);
};

export const estimateGame = (
	settings: estimationSettings,
	game: gameEstimateInput,
	now: Date = new Date(),
): gameEstimate => {
	const reviewCount = game.reviewCount ?? 0;
	const priceInCents = game.priceInCents ?? 0;
	const percentPositive = game.percentPositive ?? 0;

	const tagMult = resolveTagMultiplier(settings, game.tagIds);
	const priceMult = findPriceMultiplier(settings.priceMultipliers, priceInCents);

	const reviewMultiplier = clamp(
		settings.reviewMultiplier.baseline *
			tagMult *
			priceMult *
			Math.pow(reviewCount / settings.audience.divisor, settings.audience.exponent),
		settings.reviewMultiplier.min,
		settings.reviewMultiplier.max,
	);

	const units = reviewCount * reviewMultiplier;

	const realizedShare = Math.max(
		settings.realizedPrice.minMultiplier,
		settings.realizedPrice.startingMultiplier -
			settings.realizedPrice.perYearMultiplier *
				yearsSinceRelease(game.releaseDate, now),
	);

	const refundRate =
		settings.realizedPrice.refundRateMin +
		settings.realizedPrice.refundRateMultiplier * (1 - percentPositive / 100);

	const band = findUncertaintyBand(settings.uncertaintyBands, reviewCount);

	// Revenue is proportional to units, so the same band brackets both
	const revenuePerUnit = priceInCents * realizedShare * (1 - refundRate);

	return {
		units,
		unitsLow: units * band.low,
		unitsHigh: units * band.high,
		revenueInCents: units * revenuePerUnit,
		revenueLowInCents: units * band.low * revenuePerUnit,
		revenueHighInCents: units * band.high * revenuePerUnit,
	};
};

const buildCase = (
	branches: { when: string; then: number }[],
	fallback = 1,
): string => {
	if (branches.length === 0) {
		return literal(fallback);
	}

	const whens = branches
		.map((branch) => `WHEN ${branch.when} THEN ${literal(branch.then)}`)
		.join(" ");

	return `CASE ${whens} ELSE ${literal(fallback)} END`;
};

const thresholdBranch = (
	column: string,
	above: boolean,
	threshold: number,
	value: number,
) => ({
	when: `${column} ${above ? ">" : "<="} ${literal(threshold)}`,
	then: value,
});

// Every value is inlined from one settings snapshot rather than read from the
// live tables, so all terms in a query are consistent with each other even if
// an admin saves settings mid-request. The numbers come from validated
// settings and are re-checked by literal().
export const buildEstimationSql = (
	settings: estimationSettings,
	now: Date = new Date(),
): estimationSql => {
	const hasTagMultipliers = settings.tagMultipliers.length > 0;

	const aggregate =
		settings.tagResolution === "minimum"
			? "MIN"
			: settings.tagResolution === "maximum"
				? "MAX"
				: "AVG";

	// One pass over the matching game_tags rows for the whole result set,
	// rather than a correlated subquery per game. Relies on game_tags_tag_id_idx.
	// double precision, not numeric: AVG over numeric here measured ~400ms
	// slower across the library, and these are heuristic multipliers
	const tagValues = settings.tagMultipliers
		.map(
			(row) =>
				`(${Math.trunc(row.tagId)}, ${literal(row.mult)}::double precision)`,
		)
		.join(", ");

	// VALUES () is a syntax error, and an empty tag list is a valid setting
	const tagMultCteSql = hasTagMultipliers
		? `game_tag_mult AS (
                SELECT gt.game_id, ${aggregate}(m.mult) AS mult
                FROM game_tags gt
                JOIN (VALUES ${tagValues}) AS m(tag_id, mult) ON m.tag_id = gt.tag_id
                GROUP BY gt.game_id
            )`
		: "";

	const tagMultJoinSql = hasTagMultipliers
		? `LEFT JOIN game_tag_mult ON game_tag_mult.game_id = games.app_id`
		: "";

	const tagMultSql = hasTagMultipliers
		? `COALESCE(game_tag_mult.mult, 1)`
		: `1`;

	// Estimates are heuristics, so the math runs in double precision rather than
	// numeric: power() on float8 is far cheaper, and these values are rounded for
	// display anyway
	const priceMultSql = buildCase(
		orderThresholds(settings.priceMultipliers, (row) => row.priceInCents).map(
			(row) =>
				thresholdBranch(
					"games.price_in_cents",
					row.above,
					row.priceInCents,
					row.multiplier,
				),
		),
	);

	const reviewCountSql = `COALESCE(reviews.review_count, 0)::double precision`;

	const reviewMultiplierSql = `LEAST(${literal(settings.reviewMultiplier.max)}, GREATEST(${literal(settings.reviewMultiplier.min)},
        ${literal(settings.reviewMultiplier.baseline)}
        * ${tagMultSql}
        * ${priceMultSql}
        * POWER(${reviewCountSql} / ${literal(settings.audience.divisor)}, ${literal(settings.audience.exponent)})
    ))`;

	const rawUnitsSql = `(${reviewCountSql} * ${reviewMultiplierSql})`;

	// "now" is pinned rather than NOW() so one request's estimates are all
	// computed against the same instant and agree with estimateGame().
	// A NULL release date counts as brand new, and a future date never exceeds
	// the starting multiplier.
	const nowSql = `'${now.toISOString()}'::timestamptz`;
	const releasedAtSql = `(games.steam_release_date AT TIME ZONE '${localTimeZone()}')`;
	const yearsSql = `GREATEST(0, COALESCE(EXTRACT(EPOCH FROM (${nowSql} - ${releasedAtSql})) / ${SECONDS_PER_YEAR}, 0))`;

	const realizedShareSql = `GREATEST(${literal(settings.realizedPrice.minMultiplier)},
        ${literal(settings.realizedPrice.startingMultiplier)} - ${literal(settings.realizedPrice.perYearMultiplier)} * ${yearsSql})`;

	const refundRateSql = `(${literal(settings.realizedPrice.refundRateMin)}
        + ${literal(settings.realizedPrice.refundRateMultiplier)} * (1 - COALESCE(reviews.percent_positive, 0)::double precision / 100))`;

	const bandSql = (pick: "low" | "high") =>
		buildCase(
			orderThresholds(settings.uncertaintyBands, (row) => row.reviewCount).map(
				(row) =>
					thresholdBranch(
						"COALESCE(reviews.review_count, 0)",
						row.above,
						row.reviewCount,
						pick === "low" ? row.low : row.high,
					),
			),
		);

	// One row per game, built once and joined in. Three things make this the
	// cheap shape: every sub-expression is evaluated a single time in the
	// LATERAL, the six outputs are plain products of those results rather than
	// re-expansions of the whole formula, and the estimate is computed per
	// *game* rather than per output row — tag mode duplicates each game by
	// tags_counted, which would otherwise multiply the cost again.
	// Revenue is proportional to units, so one revenue-per-unit factor serves
	// the point estimate and both ends of the band.
	const cteSql = `${tagMultCteSql ? `${tagMultCteSql},` : ""}
        game_estimates AS (
            SELECT
                games.app_id AS game_id,
                est.units AS estimated_units,
                est.units * est.band_low AS estimated_units_low,
                est.units * est.band_high AS estimated_units_high,
                est.units * est.revenue_per_unit AS estimated_revenue_in_cents,
                est.units * est.band_low * est.revenue_per_unit AS estimated_revenue_low_in_cents,
                est.units * est.band_high * est.revenue_per_unit AS estimated_revenue_high_in_cents
            FROM games
            LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
            ${tagMultJoinSql}
            CROSS JOIN LATERAL (
                SELECT
                    ${rawUnitsSql} AS units,
                    ${bandSql("low")} AS band_low,
                    ${bandSql("high")} AS band_high,
                    COALESCE(games.price_in_cents, 0)::double precision
                        * ${realizedShareSql}
                        * (1 - ${refundRateSql}) AS revenue_per_unit
            ) est
        )`;

	return {
		cteSql,
		joinSql: `LEFT JOIN game_estimates ON game_estimates.game_id = games.app_id`,
		unitsSql: `game_estimates.estimated_units`,
		unitsLowSql: `game_estimates.estimated_units_low`,
		unitsHighSql: `game_estimates.estimated_units_high`,
		revenueSql: `game_estimates.estimated_revenue_in_cents`,
		revenueLowSql: `game_estimates.estimated_revenue_low_in_cents`,
		revenueHighSql: `game_estimates.estimated_revenue_high_in_cents`,
	};
};
