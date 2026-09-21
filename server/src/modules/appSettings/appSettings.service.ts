import {
	backfillSteamApiKey,
	getAppSettingsRow,
	getPriceMultipliers,
	getTagMultipliers,
	getUncertaintyBands,
	hasSeedFlag,
	replaceEstimationSettings,
	seedDefaultTagMultipliers,
	setSeedFlag,
	updateRegistrationEnabled,
	updateSteamApiKey,
} from "@/modules/appSettings/appSettings.repository";
import {
	accessSettings,
	apiSettingsInput,
	APP_SETTINGS_CACHE_TTL_MS,
	appSettingsOutcome,
	appSettingsSnapshot,
	appSettingsUpdate,
	appSettingsView,
	audienceSettings,
	DEFAULT_TAG_MULTIPLIERS,
	estimationSettingsInput,
	realizedPriceSettings,
	reviewMultiplierSettings,
	tagResolution,
	TAG_MULTIPLIER_SEED_KEY,
} from "@/modules/appSettings/appSettings.types";
import { validationResult } from "@/modules/auth/auth.types";

const STEAM_API_KEY_PATTERN = /^[A-Za-z0-9._~-]+$/;
const TAG_RESOLUTIONS: tagResolution[] = ["average", "minimum", "maximum"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

// Settings change only through updateAppSettings, so the write path invalidates
// directly. The TTL is the backstop for multi-process deployments, where one
// process's write cannot clear another process's cache.
let cache: { snapshot: appSettingsSnapshot; expiresAt: number } | null = null;

const invalidateAppSettingsCache = (): void => {
	cache = null;
};

const loadSnapshot = async (): Promise<appSettingsSnapshot> => {
	if (cache && cache.expiresAt > Date.now()) {
		return cache.snapshot;
	}

	const [row, tagMultipliers, priceMultipliers, uncertaintyBands] =
		await Promise.all([
			getAppSettingsRow(),
			getTagMultipliers(),
			getPriceMultipliers(),
			getUncertaintyBands(),
		]);

	const snapshot: appSettingsSnapshot = {
		access: { registrationEnabled: row.registration_enabled },
		steamApiKey: row.steam_api_key,
		estimation: {
			reviewMultiplier: {
				baseline: row.review_multiplier_baseline,
				min: row.review_multiplier_min,
				max: row.review_multiplier_max,
			},
			audience: {
				divisor: row.audience_divisor,
				exponent: row.audience_exponent,
			},
			tagResolution: row.tag_resolution,
			realizedPrice: {
				minMultiplier: row.realized_price_min_multiplier,
				startingMultiplier: row.realized_price_starting_multiplier,
				perYearMultiplier: row.realized_price_per_year_multiplier,
				refundRateMin: row.realized_price_refund_rate_min,
				refundRateMultiplier: row.realized_price_refund_rate_multiplier,
			},
			tagMultipliers,
			priceMultipliers,
			uncertaintyBands,
		},
	};

	cache = { snapshot, expiresAt: Date.now() + APP_SETTINGS_CACHE_TTL_MS };
	return snapshot;
};

// Enough to confirm which key is stored, not enough to use it. The dot count is
// fixed so the key's true length is not leaked either.
const maskKey = (key: string): string =>
	key.length <= 4 ? "••••" : `${"•".repeat(8)}${key.slice(-4)}`;

const toView = (snapshot: appSettingsSnapshot): appSettingsView => ({
	access: snapshot.access,
	api: {
		hasKey: Boolean(snapshot.steamApiKey),
		maskedKey: snapshot.steamApiKey ? maskKey(snapshot.steamApiKey) : "",
	},
	estimation: snapshot.estimation,
});

const validateNumber = (
	value: unknown,
	label: string,
	min: number,
	max: number,
): validationResult<number> => {
	// A numeric string must not slip through: Number("") is 0, and a silently
	// zeroed divisor is a division by zero downstream
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return { ok: false, message: `${label} must be a number` };
	}

	if (value < min || value > max) {
		return {
			ok: false,
			message: `${label} must be between ${min} and ${max}`,
		};
	}

	return { ok: true, value };
};

const validateInteger = (
	value: unknown,
	label: string,
	min: number,
	max: number,
): validationResult<number> => {
	const result = validateNumber(value, label, min, max);
	if (!result.ok) {
		return result;
	}

	if (!Number.isInteger(result.value)) {
		return { ok: false, message: `${label} must be a whole number` };
	}

	return result;
};

const validateBoolean = (
	value: unknown,
	label: string,
): validationResult<boolean> => {
	if (typeof value !== "boolean") {
		return { ok: false, message: `${label} must be true or false` };
	}

	return { ok: true, value };
};

const validateAccess = (value: unknown): validationResult<accessSettings> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Settings value is required" };
	}

	const enabled = validateBoolean(
		value.registrationEnabled,
		"Registration enabled",
	);
	if (!enabled.ok) {
		return enabled;
	}

	return { ok: true, value: { registrationEnabled: enabled.value } };
};

const validateApi = (value: unknown): validationResult<apiSettingsInput> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Settings value is required" };
	}

	if (value.clearSteamApiKey !== undefined) {
		const clear = validateBoolean(value.clearSteamApiKey, "Clear Steam API key");
		if (!clear.ok) {
			return clear;
		}

		if (clear.value) {
			return { ok: true, value: { clearSteamApiKey: true } };
		}
	}

	// An absent or blank key means "leave the stored key alone"
	if (value.steamApiKey === undefined || value.steamApiKey === null) {
		return { ok: true, value: {} };
	}

	if (typeof value.steamApiKey !== "string") {
		return { ok: false, message: "Enter a valid Steam API key" };
	}

	const key = value.steamApiKey.trim();
	if (key.length === 0) {
		return { ok: true, value: {} };
	}

	// Looser than Steam's current 32-character hex so a format change does not
	// brick the page, but still rejects whitespace, quotes and pasted URLs
	if (key.length < 8 || key.length > 255 || !STEAM_API_KEY_PATTERN.test(key)) {
		return { ok: false, message: "Enter a valid Steam API key" };
	}

	return { ok: true, value: { steamApiKey: key } };
};

const validateReviewMultiplier = (
	value: unknown,
): validationResult<reviewMultiplierSettings> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Review-to-sales multiplier is required" };
	}

	const baseline = validateNumber(
		value.baseline,
		"Review multiplier baseline",
		1,
		10000,
	);
	if (!baseline.ok) {
		return baseline;
	}

	const min = validateNumber(value.min, "Review multiplier minimum", 1, 10000);
	if (!min.ok) {
		return min;
	}

	const max = validateNumber(value.max, "Review multiplier maximum", 1, 10000);
	if (!max.ok) {
		return max;
	}

	if (min.value > baseline.value) {
		return {
			ok: false,
			message:
				"Review multiplier minimum must be less than or equal to the baseline",
		};
	}

	if (baseline.value > max.value) {
		return {
			ok: false,
			message:
				"Review multiplier baseline must be less than or equal to the maximum",
		};
	}

	return {
		ok: true,
		value: { baseline: baseline.value, min: min.value, max: max.value },
	};
};

const validateAudience = (
	value: unknown,
): validationResult<audienceSettings> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Audience size is required" };
	}

	const divisor = validateNumber(value.divisor, "Audience divisor", 1, 1e9);
	if (!divisor.ok) {
		return divisor;
	}

	const exponent = validateNumber(value.exponent, "Audience exponent", 0, 1);
	if (!exponent.ok) {
		return exponent;
	}

	return { ok: true, value: { divisor: divisor.value, exponent: exponent.value } };
};

const validateRealizedPrice = (
	value: unknown,
): validationResult<realizedPriceSettings> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Realized price per unit is required" };
	}

	const minMultiplier = validateNumber(
		value.minMultiplier,
		"Realized price minimum multiplier",
		0.0001,
		1,
	);
	if (!minMultiplier.ok) {
		return minMultiplier;
	}

	const startingMultiplier = validateNumber(
		value.startingMultiplier,
		"Realized price starting multiplier",
		0.0001,
		1,
	);
	if (!startingMultiplier.ok) {
		return startingMultiplier;
	}

	const perYearMultiplier = validateNumber(
		value.perYearMultiplier,
		"Realized price per year multiplier",
		0,
		1,
	);
	if (!perYearMultiplier.ok) {
		return perYearMultiplier;
	}

	const refundRateMin = validateNumber(
		value.refundRateMin,
		"Refund rate minimum",
		0,
		1,
	);
	if (!refundRateMin.ok) {
		return refundRateMin;
	}

	const refundRateMultiplier = validateNumber(
		value.refundRateMultiplier,
		"Refund rate multiplier",
		0,
		1,
	);
	if (!refundRateMultiplier.ok) {
		return refundRateMultiplier;
	}

	if (minMultiplier.value > startingMultiplier.value) {
		return {
			ok: false,
			message:
				"Realized price minimum multiplier must be less than or equal to the starting multiplier",
		};
	}

	// Above 1 a game with no positive reviews yields a refund rate over 100%,
	// which turns the revenue estimate negative
	if (refundRateMin.value + refundRateMultiplier.value > 1) {
		return {
			ok: false,
			message: "Refund rate minimum plus multiplier must not exceed 1",
		};
	}

	return {
		ok: true,
		value: {
			minMultiplier: minMultiplier.value,
			startingMultiplier: startingMultiplier.value,
			perYearMultiplier: perYearMultiplier.value,
			refundRateMin: refundRateMin.value,
			refundRateMultiplier: refundRateMultiplier.value,
		},
	};
};

const validateTagMultipliers = (
	value: unknown,
): validationResult<estimationSettingsInput["tagMultipliers"]> => {
	if (!Array.isArray(value)) {
		return { ok: false, message: "Tag multipliers must be a list" };
	}

	if (value.length > 500) {
		return { ok: false, message: "Too many tag multipliers" };
	}

	const rows: estimationSettingsInput["tagMultipliers"] = [];
	const seen = new Set<number>();

	for (const entry of value) {
		if (!isRecord(entry)) {
			return { ok: false, message: "Each tag multiplier needs a tag" };
		}

		const tagId = validateInteger(entry.tagId, "Tag", 1, Number.MAX_SAFE_INTEGER);
		if (!tagId.ok) {
			return { ok: false, message: "Each tag multiplier needs a tag" };
		}

		const mult = validateNumber(entry.mult, "Tag multiplier", 0.0001, 100);
		if (!mult.ok) {
			return mult;
		}

		if (seen.has(tagId.value)) {
			return { ok: false, message: "Each tag may only appear once" };
		}

		seen.add(tagId.value);
		rows.push({ tagId: tagId.value, mult: mult.value });
	}

	return { ok: true, value: rows };
};

const validatePriceMultipliers = (
	value: unknown,
): validationResult<estimationSettingsInput["priceMultipliers"]> => {
	if (!Array.isArray(value)) {
		return { ok: false, message: "Price multipliers must be a list" };
	}

	if (value.length > 100) {
		return { ok: false, message: "Too many price multipliers" };
	}

	const rows: estimationSettingsInput["priceMultipliers"] = [];
	const seen = new Set<string>();

	for (const entry of value) {
		if (!isRecord(entry)) {
			return { ok: false, message: "Each price multiplier needs a threshold" };
		}

		const priceInCents = validateInteger(
			entry.priceInCents,
			"Price threshold",
			0,
			1_000_000,
		);
		if (!priceInCents.ok) {
			return priceInCents;
		}

		const multiplier = validateNumber(
			entry.multiplier,
			"Price multiplier",
			0.0001,
			100,
		);
		if (!multiplier.ok) {
			return multiplier;
		}

		const above = validateBoolean(entry.above, "Price comparison");
		if (!above.ok) {
			return above;
		}

		// The pair is the key, not the price alone: the defaults ship both
		// "<= 30" and "> 30"
		const key = `${priceInCents.value}:${above.value}`;
		if (seen.has(key)) {
			return { ok: false, message: "Each price threshold may only appear once" };
		}

		seen.add(key);
		rows.push({
			priceInCents: priceInCents.value,
			multiplier: multiplier.value,
			above: above.value,
		});
	}

	return { ok: true, value: rows };
};

const validateUncertaintyBands = (
	value: unknown,
): validationResult<estimationSettingsInput["uncertaintyBands"]> => {
	if (!Array.isArray(value)) {
		return { ok: false, message: "Uncertainty bands must be a list" };
	}

	if (value.length > 100) {
		return { ok: false, message: "Too many uncertainty bands" };
	}

	const rows: estimationSettingsInput["uncertaintyBands"] = [];
	const seen = new Set<string>();

	for (const entry of value) {
		if (!isRecord(entry)) {
			return { ok: false, message: "Each uncertainty band needs a threshold" };
		}

		const reviewCount = validateInteger(
			entry.reviewCount,
			"Review threshold",
			0,
			10_000_000,
		);
		if (!reviewCount.ok) {
			return reviewCount;
		}

		const low = validateNumber(entry.low, "Uncertainty band low", 0.0001, 100);
		if (!low.ok) {
			return low;
		}

		const high = validateNumber(entry.high, "Uncertainty band high", 0.0001, 100);
		if (!high.ok) {
			return high;
		}

		if (low.value > high.value) {
			return {
				ok: false,
				message: "Uncertainty band low must be less than or equal to high",
			};
		}

		const above = validateBoolean(entry.above, "Review comparison");
		if (!above.ok) {
			return above;
		}

		const key = `${reviewCount.value}:${above.value}`;
		if (seen.has(key)) {
			return { ok: false, message: "Each review threshold may only appear once" };
		}

		seen.add(key);
		rows.push({
			reviewCount: reviewCount.value,
			low: low.value,
			high: high.value,
			above: above.value,
		});
	}

	return { ok: true, value: rows };
};

const validateEstimation = (
	value: unknown,
): validationResult<estimationSettingsInput> => {
	if (!isRecord(value)) {
		return { ok: false, message: "Settings value is required" };
	}

	const reviewMultiplier = validateReviewMultiplier(value.reviewMultiplier);
	if (!reviewMultiplier.ok) {
		return reviewMultiplier;
	}

	const audience = validateAudience(value.audience);
	if (!audience.ok) {
		return audience;
	}

	if (
		typeof value.tagResolution !== "string" ||
		!TAG_RESOLUTIONS.includes(value.tagResolution as tagResolution)
	) {
		return {
			ok: false,
			message: "Tag resolution must be average, minimum or maximum",
		};
	}

	const realizedPrice = validateRealizedPrice(value.realizedPrice);
	if (!realizedPrice.ok) {
		return realizedPrice;
	}

	const tagMultipliers = validateTagMultipliers(value.tagMultipliers);
	if (!tagMultipliers.ok) {
		return tagMultipliers;
	}

	const priceMultipliers = validatePriceMultipliers(value.priceMultipliers);
	if (!priceMultipliers.ok) {
		return priceMultipliers;
	}

	const uncertaintyBands = validateUncertaintyBands(value.uncertaintyBands);
	if (!uncertaintyBands.ok) {
		return uncertaintyBands;
	}

	return {
		ok: true,
		value: {
			reviewMultiplier: reviewMultiplier.value,
			audience: audience.value,
			tagResolution: value.tagResolution as tagResolution,
			realizedPrice: realizedPrice.value,
			tagMultipliers: tagMultipliers.value,
			priceMultipliers: priceMultipliers.value,
			uncertaintyBands: uncertaintyBands.value,
		},
	};
};

const validateAppSettingsUpdate = (
	body: unknown,
): validationResult<appSettingsUpdate> => {
	if (!isRecord(body)) {
		return { ok: false, message: "Request body is required" };
	}

	if (body.section === "access") {
		const value = validateAccess(body.value);
		return value.ok
			? { ok: true, value: { section: "access", value: value.value } }
			: value;
	}

	if (body.section === "api") {
		const value = validateApi(body.value);
		return value.ok
			? { ok: true, value: { section: "api", value: value.value } }
			: value;
	}

	if (body.section === "estimation") {
		const value = validateEstimation(body.value);
		return value.ok
			? { ok: true, value: { section: "estimation", value: value.value } }
			: value;
	}

	return { ok: false, message: "Unknown settings section" };
};

// Postgres raises 23503 when a foreign key is violated
const isForeignKeyViolation = (error: unknown): boolean =>
	isRecord(error) && error.code === "23503";

export const loadAppSettings = async (): Promise<appSettingsView> =>
	toView(await loadSnapshot());

export const updateAppSettings = async (
	body: unknown,
): Promise<appSettingsOutcome> => {
	const validated = validateAppSettingsUpdate(body);
	if (!validated.ok) {
		return { status: "invalid", message: validated.message };
	}

	const update = validated.value;

	if (update.section === "access") {
		await updateRegistrationEnabled(update.value.registrationEnabled);
	}

	if (update.section === "api") {
		if (update.value.clearSteamApiKey) {
			await updateSteamApiKey(null);
		} else if (update.value.steamApiKey) {
			await updateSteamApiKey(update.value.steamApiKey);
		}
	}

	if (update.section === "estimation") {
		try {
			await replaceEstimationSettings(update.value);
		} catch (error) {
			if (isForeignKeyViolation(error)) {
				return {
					status: "invalid",
					message: "One or more selected tags no longer exist",
				};
			}

			throw error;
		}
	}

	invalidateAppSettingsCache();
	return { status: "ok", appSettings: await loadAppSettings() };
};

export const getSteamApiKey = async (): Promise<string | null> => {
	const snapshot = await loadSnapshot();
	return snapshot.steamApiKey;
};

export const isRegistrationOpen = async (): Promise<boolean> => {
	const snapshot = await loadSnapshot();
	return snapshot.access.registrationEnabled;
};

// The default tag multipliers reference tags by name, so they can only be
// seeded once the tags table has been populated at least once. The flag is set
// only when something was actually inserted, so a later full delete is
// permanent while a still-empty tags table retries on the next sync.
export const ensureDefaultTagMultipliers = async (): Promise<void> => {
	if (await hasSeedFlag(TAG_MULTIPLIER_SEED_KEY)) {
		return;
	}

	const unmatched = await seedDefaultTagMultipliers(DEFAULT_TAG_MULTIPLIERS);
	if (unmatched.length === DEFAULT_TAG_MULTIPLIERS.length) {
		return;
	}

	if (unmatched.length > 0) {
		console.warn(
			`No Steam tag matched these default tag multipliers: ${unmatched.join(", ")}`,
		);
	}

	await setSeedFlag(TAG_MULTIPLIER_SEED_KEY);
	invalidateAppSettingsCache();
};

// One-time migration off the STEAM_API_KEY env var. Writes only when the
// database has no key yet, so it never overwrites one set through the admin page.
export const backfillSteamApiKeyFromEnv = async (): Promise<void> => {
	const key = process.env.STEAM_API_KEY?.trim();
	if (!key) {
		return;
	}

	if (await backfillSteamApiKey(key)) {
		invalidateAppSettingsCache();
		console.log(
			"Imported STEAM_API_KEY from the environment into app settings. The env var can now be removed.",
		);
	}
};
