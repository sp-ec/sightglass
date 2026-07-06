import { BarChart3, ScatterChart as ScatterChartIcon } from "lucide-react";

export const GROUP_BY_OPTIONS = [
	{ label: "Review Count", value: "review_count" },
	{ label: "Review Score", value: "review_score" },
	{ label: "Release Date", value: "release_date" },
	{ label: "Price", value: "price" },
	{ label: "Tag", value: "tag" },
] as const;

export const CHART_TYPES = [
	{ label: "Bar Chart", value: "bar", icon: BarChart3 },
	{ label: "Scatterplot", value: "scatter", icon: ScatterChartIcon },
] as const;

export const AXIS_OPTIONS = [
	{ label: "Bucket", value: "bucket" },
	{ label: "Count", value: "count" },
	{ label: "Average Value", value: "average_value" },
	{ label: "Average Review Score", value: "average_review_score" },
	{ label: "Average Positive %", value: "average_percent_positive" },
	{ label: "Average Review Count", value: "average_review_count" },
	{ label: "Average Price", value: "average_price_in_cents" },
] as const;

export const BAR_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
export const SCATTER_NUMERIC_AXES = AXIS_OPTIONS.filter(
	(option) => option.value !== "bucket",
);

export type GroupByValue = (typeof GROUP_BY_OPTIONS)[number]["value"];
export type ChartType = (typeof CHART_TYPES)[number]["value"];
export type AxisValue = (typeof AXIS_OPTIONS)[number]["value"];
export type ChartPoint = Record<string, string | number | null>;

export type ChartResponse = {
	mode: GroupByValue;
	bucket_size: number | null;
	points: ChartPoint[];
};

export type BucketConfig = {
	min: number;
	max: number;
	step: number;
	unit?: string;
	locked?: boolean;
	displayValue?: (value: number) => string;
};

export const BUCKET_CONFIGS: Record<GroupByValue, BucketConfig> = {
	review_count: { min: 10, max: 5_000_000, step: 10 },
	review_score: { min: 1, max: 1, step: 1, locked: true },
	release_date: { min: 1, max: 1825, step: 1, unit: "days" },
	price: {
		min: 25,
		max: 100_000,
		step: 25,
		displayValue: (value) => `$${(value / 100).toFixed(2)}`,
	},
	tag: { min: 1, max: 1, step: 1, locked: true },
};