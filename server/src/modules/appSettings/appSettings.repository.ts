import pool from "@/sql/db";
import {
	appSettingsRow,
	estimationSettingsInput,
	priceMultiplier,
	tagMultiplier,
	tagMultiplierDefault,
	uncertaintyBand,
} from "@/modules/appSettings/appSettings.types";

const SETTINGS_COLUMNS = `
	registration_enabled,
	steam_api_key,
	review_multiplier_baseline,
	review_multiplier_min,
	review_multiplier_max,
	audience_divisor,
	audience_exponent,
	tag_resolution,
	realized_price_min_multiplier,
	realized_price_starting_multiplier,
	realized_price_per_year_multiplier,
	realized_price_refund_rate_min,
	realized_price_refund_rate_multiplier`;

// A missing singleton means the schema never initialized, which is a broken
// deployment rather than a runtime condition worth papering over
export const getAppSettingsRow = async (): Promise<appSettingsRow> => {
	const result = await pool.query(
		`SELECT ${SETTINGS_COLUMNS} FROM app_settings WHERE id = 1;`,
	);

	const row = result.rows[0] as appSettingsRow | undefined;
	if (!row) {
		throw new Error("app_settings is missing its singleton row");
	}

	return row;
};

export const getTagMultipliers = async (): Promise<tagMultiplier[]> => {
	const result = await pool.query(
		`SELECT m.tag_id, t.name, m.mult
		FROM estimation_tag_multipliers m
		JOIN tags t ON t.id = m.tag_id
		ORDER BY t.name ASC;`,
	);

	return result.rows.map((row) => ({
		tagId: row.tag_id as number,
		tagName: row.name as string,
		mult: row.mult as number,
	}));
};

export const getPriceMultipliers = async (): Promise<priceMultiplier[]> => {
	const result = await pool.query(
		`SELECT id, price_in_cents, multiplier, above
		FROM estimation_price_multipliers
		ORDER BY above ASC, price_in_cents ASC;`,
	);

	return result.rows.map((row) => ({
		id: row.id as number,
		priceInCents: row.price_in_cents as number,
		multiplier: row.multiplier as number,
		above: row.above as boolean,
	}));
};

export const getUncertaintyBands = async (): Promise<uncertaintyBand[]> => {
	const result = await pool.query(
		`SELECT id, review_count, low, high, above
		FROM estimation_uncertainty_bands
		ORDER BY above ASC, review_count ASC;`,
	);

	return result.rows.map((row) => ({
		id: row.id as number,
		reviewCount: row.review_count as number,
		low: row.low as number,
		high: row.high as number,
		above: row.above as boolean,
	}));
};

export const updateRegistrationEnabled = async (
	enabled: boolean,
): Promise<void> => {
	await pool.query(
		`UPDATE app_settings
		SET registration_enabled = $1, updated_at = NOW()
		WHERE id = 1;`,
		[enabled],
	);
};

export const updateSteamApiKey = async (key: string | null): Promise<void> => {
	await pool.query(
		`UPDATE app_settings
		SET steam_api_key = $1, updated_at = NOW()
		WHERE id = 1;`,
		[key],
	);
};

// Only writes when no key is stored yet, so it never overwrites one set
// through the admin page. Returns whether it wrote.
export const backfillSteamApiKey = async (key: string): Promise<boolean> => {
	const result = await pool.query(
		`UPDATE app_settings
		SET steam_api_key = $1, updated_at = NOW()
		WHERE id = 1 AND (steam_api_key IS NULL OR steam_api_key = '');`,
		[key],
	);

	return (result.rowCount ?? 0) > 0;
};

// Replace-all rather than a diff: the lists are small, and a row the admin just
// added has no server identity to diff against.
// Errors bubble so the service can map 23503 (unknown tag_id) to a 400.
export const replaceEstimationSettings = async (
	input: estimationSettingsInput,
): Promise<void> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		await client.query(
			`UPDATE app_settings SET
				review_multiplier_baseline = $1,
				review_multiplier_min = $2,
				review_multiplier_max = $3,
				audience_divisor = $4,
				audience_exponent = $5,
				tag_resolution = $6,
				realized_price_min_multiplier = $7,
				realized_price_starting_multiplier = $8,
				realized_price_per_year_multiplier = $9,
				realized_price_refund_rate_min = $10,
				realized_price_refund_rate_multiplier = $11,
				updated_at = NOW()
			WHERE id = 1;`,
			[
				input.reviewMultiplier.baseline,
				input.reviewMultiplier.min,
				input.reviewMultiplier.max,
				input.audience.divisor,
				input.audience.exponent,
				input.tagResolution,
				input.realizedPrice.minMultiplier,
				input.realizedPrice.startingMultiplier,
				input.realizedPrice.perYearMultiplier,
				input.realizedPrice.refundRateMin,
				input.realizedPrice.refundRateMultiplier,
			],
		);

		await client.query("DELETE FROM estimation_tag_multipliers;");
		if (input.tagMultipliers.length > 0) {
			const values: unknown[] = [];
			const placeholders = input.tagMultipliers
				.map((row, i) => {
					values.push(row.tagId, row.mult);
					return `($${i * 2 + 1}, $${i * 2 + 2})`;
				})
				.join(", ");

			await client.query(
				`INSERT INTO estimation_tag_multipliers (tag_id, mult)
				VALUES ${placeholders};`,
				values,
			);
		}

		await client.query("DELETE FROM estimation_price_multipliers;");
		if (input.priceMultipliers.length > 0) {
			const values: unknown[] = [];
			const placeholders = input.priceMultipliers
				.map((row, i) => {
					values.push(row.priceInCents, row.multiplier, row.above);
					return `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`;
				})
				.join(", ");

			await client.query(
				`INSERT INTO estimation_price_multipliers (price_in_cents, multiplier, above)
				VALUES ${placeholders};`,
				values,
			);
		}

		await client.query("DELETE FROM estimation_uncertainty_bands;");
		if (input.uncertaintyBands.length > 0) {
			const values: unknown[] = [];
			const placeholders = input.uncertaintyBands
				.map((row, i) => {
					values.push(row.reviewCount, row.low, row.high, row.above);
					return `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`;
				})
				.join(", ");

			await client.query(
				`INSERT INTO estimation_uncertainty_bands (review_count, low, high, above)
				VALUES ${placeholders};`,
				values,
			);
		}

		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

export const hasSeedFlag = async (seedKey: string): Promise<boolean> => {
	try {
		const result = await pool.query(
			`SELECT 1 FROM app_settings_seed_flags WHERE seed_key = $1 LIMIT 1;`,
			[seedKey],
		);

		return (result.rowCount ?? 0) > 0;
	} catch (error) {
		return false;
	}
};

export const setSeedFlag = async (seedKey: string): Promise<void> => {
	await pool.query(
		`INSERT INTO app_settings_seed_flags (seed_key) VALUES ($1)
		ON CONFLICT (seed_key) DO NOTHING;`,
		[seedKey],
	);
};

// Inserts the defaults whose names match a synced tag and returns the names
// that did not match, so the caller can report them
export const seedDefaultTagMultipliers = async (
	defaults: tagMultiplierDefault[],
): Promise<string[]> => {
	if (defaults.length === 0) {
		return [];
	}

	const names = defaults.map((entry) => entry.name.toLowerCase());
	const result = await pool.query(
		`SELECT id, name FROM tags WHERE LOWER(name) = ANY($1);`,
		[names],
	);

	const tagIdsByName = new Map<string, number>(
		result.rows.map((row) => [
			(row.name as string).toLowerCase(),
			row.id as number,
		]),
	);

	const matched = defaults.filter((entry) =>
		tagIdsByName.has(entry.name.toLowerCase()),
	);

	if (matched.length > 0) {
		const values: unknown[] = [];
		const placeholders = matched
			.map((entry, i) => {
				values.push(tagIdsByName.get(entry.name.toLowerCase()), entry.mult);
				return `($${i * 2 + 1}, $${i * 2 + 2})`;
			})
			.join(", ");

		await pool.query(
			`INSERT INTO estimation_tag_multipliers (tag_id, mult)
			VALUES ${placeholders}
			ON CONFLICT (tag_id) DO NOTHING;`,
			values,
		);
	}

	return defaults
		.filter((entry) => !tagIdsByName.has(entry.name.toLowerCase()))
		.map((entry) => entry.name);
};
