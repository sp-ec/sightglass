import { z } from "zod";

// Mirrors the server's validation rules in appSettings.service.ts. Keep the two
// in step: the server is the boundary, this only spares a round trip.

export const accessSchema = z.object({
	registrationEnabled: z.boolean(),
});

export const apiSchema = z.object({
	// An empty field means "leave the stored key alone", so it stays valid
	steamApiKey: z
		.string()
		.trim()
		.refine(
			(value) =>
				value.length === 0 ||
				(value.length >= 8 &&
					value.length <= 255 &&
					/^[A-Za-z0-9._~-]+$/.test(value)),
			"Enter a valid Steam API key",
		),
});

const reviewMultiplierSchema = z
	.object({
		baseline: z.number().finite().min(1).max(10000),
		min: z.number().finite().min(1).max(10000),
		max: z.number().finite().min(1).max(10000),
	})
	.refine((value) => value.min <= value.baseline, {
		message: "Minimum must be less than or equal to the baseline",
		path: ["min"],
	})
	.refine((value) => value.baseline <= value.max, {
		message: "Maximum must be greater than or equal to the baseline",
		path: ["max"],
	});

const audienceSchema = z.object({
	divisor: z.number().finite().min(1).max(1e9),
	exponent: z.number().finite().min(0).max(1),
});

const realizedPriceSchema = z
	.object({
		minMultiplier: z.number().finite().gt(0).max(1),
		startingMultiplier: z.number().finite().gt(0).max(1),
		perYearMultiplier: z.number().finite().min(0).max(1),
		refundRateMin: z.number().finite().min(0).max(1),
		refundRateMultiplier: z.number().finite().min(0).max(1),
	})
	.refine((value) => value.minMultiplier <= value.startingMultiplier, {
		message: "Minimum must be less than or equal to the starting multiplier",
		path: ["minMultiplier"],
	})
	// Above 1 a game with no positive reviews would produce negative revenue
	.refine((value) => value.refundRateMin + value.refundRateMultiplier <= 1, {
		message: "Refund rate minimum plus multiplier must not exceed 1",
		path: ["refundRateMultiplier"],
	});

const tagMultiplierRowSchema = z.object({
	uiKey: z.string(),
	tagId: z.number().int().min(1, "Pick a tag"),
	mult: z.number().finite().gt(0).max(100),
});

const priceMultiplierRowSchema = z.object({
	uiKey: z.string(),
	priceInCents: z.number().int().min(0).max(1_000_000),
	multiplier: z.number().finite().gt(0).max(100),
	above: z.boolean(),
});

const uncertaintyBandRowSchema = z
	.object({
		uiKey: z.string(),
		reviewCount: z.number().int().min(0).max(10_000_000),
		low: z.number().finite().gt(0).max(100),
		high: z.number().finite().gt(0).max(100),
		above: z.boolean(),
	})
	.refine((value) => value.low <= value.high, {
		message: "Low must be less than or equal to high",
		path: ["low"],
	});

// The pair is the key, not the threshold alone: the defaults ship both
// "<= 30" and "> 30"
const uniqueBy = <T,>(rows: T[], key: (row: T) => string): boolean =>
	new Set(rows.map(key)).size === rows.length;

export const estimationSchema = z
	.object({
		reviewMultiplier: reviewMultiplierSchema,
		audience: audienceSchema,
		tagResolution: z.enum(["average", "minimum", "maximum"]),
		realizedPrice: realizedPriceSchema,
		tagMultipliers: z.array(tagMultiplierRowSchema).max(500),
		priceMultipliers: z.array(priceMultiplierRowSchema).max(100),
		uncertaintyBands: z.array(uncertaintyBandRowSchema).max(100),
	})
	.refine((value) => uniqueBy(value.tagMultipliers, (row) => String(row.tagId)), {
		message: "Each tag may only appear once",
		path: ["tagMultipliers"],
	})
	.refine(
		(value) =>
			uniqueBy(
				value.priceMultipliers,
				(row) => `${row.priceInCents}:${row.above}`,
			),
		{
			message: "Each price threshold may only appear once",
			path: ["priceMultipliers"],
		},
	)
	.refine(
		(value) =>
			uniqueBy(
				value.uncertaintyBands,
				(row) => `${row.reviewCount}:${row.above}`,
			),
		{
			message: "Each review threshold may only appear once",
			path: ["uncertaintyBands"],
		},
	);
