import type { TooltipComponentFormatterCallbackParams } from "echarts";
import { ChartPoint } from "./chart-types";
import { formatCents, formatCount, formatPrice } from "@/lib/utils";

// Postgres numeric arrives as a string, so every value is coerced before use
const num = (value: ChartPoint[string]): number | null => {
	if (value == null || value === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const row = (label: string, value: string | null): string =>
	value === null ? "" : `<div>${label}: ${value}</div>`;

// Zero is a real result — a game with no reviews estimates to zero units — so
// rows are gated on null rather than truthiness
const buildTooltip = (point: ChartPoint): string => {
	const units = num(point.aggregate_estimated_units);
	const unitsLow = num(point.aggregate_estimated_units_low);
	const unitsHigh = num(point.aggregate_estimated_units_high);
	const revenue = num(point.aggregate_estimated_revenue_in_cents);
	const revenueLow = num(point.aggregate_estimated_revenue_low_in_cents);
	const revenueHigh = num(point.aggregate_estimated_revenue_high_in_cents);

	// The band collapses to a single number when low and high agree, which is
	// what an unconfigured uncertainty band produces
	const withRange = (
		value: number | null,
		low: number | null,
		high: number | null,
		format: (n: number) => string,
	): string | null => {
		if (value === null) {
			return null;
		}

		return low !== null && high !== null && low !== high
			? `${format(value)} (${format(low)} – ${format(high)})`
			: format(value);
	};

	const unitsText = withRange(units, unitsLow, unitsHigh, formatCount);
	const revenueText = withRange(revenue, revenueLow, revenueHigh, formatCents);

	const price = num(point.aggregate_price_in_cents);
	const minValue = num(point.min_value);
	const maxValue = num(point.max_value);

	return `
		<div style="font-weight:bold;margin-bottom:4px;">Bucket: ${point.bucket ?? "N/A"}</div>
		${row("Count", num(point.count) === null ? null : formatCount(num(point.count)!))}
		${row("Review Count", num(point.aggregate_review_count)?.toString() ?? null)}
		${row("Review Score", num(point.aggregate_review_score)?.toString() ?? null)}
		${row("Positive %", num(point.aggregate_percent_positive)?.toString() ?? null)}
		${row("Price", price === null ? null : formatPrice(price))}
		${row("Est. Units", unitsText)}
		${row("Est. Revenue", revenueText)}
		${row("Value", num(point.aggregate_value)?.toString() ?? null)}
		${minValue === null || maxValue === null ? "" : `<div>Range: ${minValue} - ${maxValue}</div>`}
	`;
};

// ECharts renders the tooltip as a detached div, so its colors are set per theme rather than inherited
const TOOLTIP_COLORS = {
	light: {
		background: "oklch(1 0 0 / 0.8)",
		border: "oklch(0.2 0.02 260 / 0.1)",
		text: "#0f172a",
		shadow: "0 16px 40px -12px rgba(15, 23, 42, 0.25)",
	},
	dark: {
		background: "oklch(0.20 0.015 262 / 0.75)",
		border: "oklch(1 0 0 / 0.1)",
		text: "#f9fafb",
		shadow: "0 16px 40px -12px rgba(0, 0, 0, 0.5)",
	},
};

export const buildTooltipOption = (isDark: boolean) => {
	const colors = isDark ? TOOLTIP_COLORS.dark : TOOLTIP_COLORS.light;

	return {
		trigger: "item",
		backgroundColor: colors.background,
		borderColor: colors.border,
		borderWidth: 1,
		padding: 14,
		extraCssText: `border-radius: 12px; backdrop-filter: blur(16px) saturate(160%); box-shadow: ${colors.shadow};`,
		textStyle: {
			color: colors.text,
		},
		// Scatter carries the whole point as the third tuple element
		formatter: function (params: TooltipComponentFormatterCallbackParams) {
			const param = Array.isArray(params) ? params[0] : params;
			const point = (param?.data as unknown[] | undefined)?.[2] as
				| ChartPoint
				| undefined;
			return point ? buildTooltip(point) : "";
		},
	};
};

export const ChartTooltip = ({ point }: { point: ChartPoint }): string =>
	buildTooltip(point);
