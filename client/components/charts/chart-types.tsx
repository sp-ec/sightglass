import { BarChart3, ScatterChart as ScatterChartIcon } from "lucide-react";

export const GROUP_BY_OPTIONS = [
	{ label: "Review Count", value: "review_count" },
	{ label: "Review Score", value: "review_score" },
	{ label: "Release Date", value: "release_date" },
	{ label: "Price", value: "price" },
	{ label: "Tag", value: "tag" },
	{ label: "Supported Languages", value: "supported_languages" },
	{ label: "Developer", value: "developer" },
	{ label: "Publisher", value: "publisher" },
	{ label: "Category", value: "category" },
	{ label: "Has Demo", value: "has_demo" },
] as const;

export const CHART_TYPES = [
	{ label: "Bar Chart", value: "bar", icon: BarChart3 },
	{ label: "Scatterplot", value: "scatter", icon: ScatterChartIcon },
] as const;

export const AXIS_OPTIONS = [
	{ label: "Bucket", value: "bucket" },
	{ label: "Count", value: "count" },
	{ label: "Aggregate Value", value: "aggregate_value" },
	{ label: "Review Score", value: "aggregate_review_score" },
	{ label: "Positive %", value: "aggregate_percent_positive" },
	{ label: "Review Count", value: "aggregate_review_count" },
	{ label: "Price", value: "aggregate_price_in_cents" },
] as const;

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
	aggregate: "average" | "median";
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
	review_count: { min: 1, max: 100_000_000, step: 10 },
	review_score: { min: 1, max: 1, step: 1, locked: true },
	release_date: { min: 1, max: 36525, step: 1, unit: "days" },
	price: {
		min: 1,
		max: 100_000_000,
		step: 25,
		displayValue: (value) => `$${(value / 100).toFixed(2)}`,
	},
	tag: { min: 1, max: 1, step: 1, locked: true },
	supported_languages: { min: 1, max: 1, step: 1, locked: true },
	developer: { min: 1, max: 1, step: 1, locked: true },
	publisher: { min: 1, max: 1, step: 1, locked: true },
	category: { min: 1, max: 1, step: 1, locked: true },
	has_demo: { min: 1, max: 1, step: 1, locked: true },
};

export type AxisOption = {
    label: string;
    value: string;
};