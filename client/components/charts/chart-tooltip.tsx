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

	const unitsText =
		units === null
			? null
			: unitsLow !== null && unitsHigh !== null && unitsLow !== unitsHigh
				? `${formatCount(units)} (${formatCount(unitsLow)} – ${formatCount(unitsHigh)})`
				: formatCount(units);

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
		${row("Est. Revenue", revenue === null ? null : formatCents(revenue))}
		${row("Value", num(point.aggregate_value)?.toString() ?? null)}
		${minValue === null || maxValue === null ? "" : `<div>Range: ${minValue} - ${maxValue}</div>`}
	`;
};

export const TOOLTIP = {
	trigger: "item",
	backgroundColor: "oklch(0.20 0.00 0)",
	borderColor: "oklch(0.27 0.00 0)",
	borderWidth: 1,
	padding: 12,
	textStyle: {
		color: "#f9fafb",
	},
	// Scatter carries the whole point as the third tuple element
	formatter: function (params: any) {
		const point = params.data?.[2];
		return point ? buildTooltip(point) : "";
	},
};

export const ChartTooltip = ({ point }: { point: ChartPoint }): string =>
	buildTooltip(point);
