import { BarChart3, ScatterChart, ChartPie, Hexagon } from "lucide-react";
import { StreamgraphIcon } from "../icons/streamgraph-icon";
import { formatCents } from "@/lib/utils";

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
  { label: "Est. Units Sold", value: "estimated_units" },
  { label: "Est. Gross Revenue", value: "estimated_revenue" },
] as const;

export const CHART_TYPES = [
  { label: "Bar Chart", value: "bar", icon: BarChart3 },
  { label: "Scatterplot", value: "scatter", icon: ScatterChart },
  { label: "Pie Chart", value: "pie", icon: ChartPie },
  { label: "Radar Chart", value: "radar", icon: Hexagon },
  // { label: "Streamgraph", value: "streamgraph", icon: StreamgraphIcon },
] as const;

export const AXIS_OPTIONS = [
  { label: "None", value: "" },
  { label: "Bucket", value: "bucket" },
  { label: "Count", value: "count" },
  { label: "Aggregate Value", value: "aggregate_value" },
  { label: "Review Score", value: "aggregate_review_score" },
  { label: "Positive %", value: "aggregate_percent_positive" },
  { label: "Review Count", value: "aggregate_review_count" },
  { label: "Price", value: "aggregate_price_in_cents" },
  { label: "Est. Units Sold", value: "aggregate_estimated_units" },
  {
    label: "Est. Gross Revenue",
    value: "aggregate_estimated_revenue_in_cents",
  },
] as const;

export const NUMERIC_AXIS_OPTIONS = AXIS_OPTIONS.filter(
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
  // Selecting a group-by resets the bucket size to min, and estimates run into
  // the millions, so these start coarse rather than at 1
  estimated_units: {
    min: 1_000,
    max: 100_000_000,
    step: 1_000,
    unit: "units",
  },
  estimated_revenue: {
    min: 100_000,
    max: 1_000_000_000,
    step: 100_000,
    displayValue: (value) => formatCents(value),
  },
};

export type AxisOption = {
  label: string;
  value: string;
};

export type ChartFilterMode = "include" | "exclude";

export type FilterOption = {
  id: number;
  name: string;
};

export type RangeInput = {
  min: string;
  max: string;
};

export type ChartFilters = {
  releaseDate: RangeInput;
  price: RangeInput;
  isDemo: boolean | null;
  tags: number[];
  tagsMode: ChartFilterMode;
  languages: number[];
  languagesMode: ChartFilterMode;
  percentPositive: [number, number];
  reviewCount: RangeInput;
};

export const PERCENT_POSITIVE_MIN = 0;
export const PERCENT_POSITIVE_MAX = 100;

export const DEFAULT_CHART_FILTERS: ChartFilters = {
  releaseDate: { min: "", max: "" },
  price: { min: "", max: "" },
  isDemo: null,
  tags: [],
  tagsMode: "include",
  languages: [],
  languagesMode: "include",
  percentPositive: [PERCENT_POSITIVE_MIN, PERCENT_POSITIVE_MAX],
  reviewCount: { min: "", max: "" },
};

const parseRange = (
  range: RangeInput,
  transform?: (value: number) => number,
) => {
  const toValue = (raw: string) => {
    if (raw.trim() === "") return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return transform ? transform(parsed) : parsed;
  };

  const min = toValue(range.min);
  const max = toValue(range.max);
  return min == null && max == null ? undefined : { min, max };
};

const parseDateRange = (range: RangeInput) =>
  range.min || range.max
    ? { min: range.min || null, max: range.max || null }
    : undefined;

// Converts panel state into the payload accepted by the /games/chart filters param
export function serializeChartFilters(filters: ChartFilters): string | null {
  const [percentMin, percentMax] = filters.percentPositive;
  const isFullPercentRange =
    percentMin === PERCENT_POSITIVE_MIN && percentMax === PERCENT_POSITIVE_MAX;

  const payload = {
    release_date: parseDateRange(filters.releaseDate),
    price: parseRange(filters.price, (value) => Math.round(value * 100)),
    is_demo: filters.isDemo ?? undefined,
    tags: filters.tags.length ? filters.tags : undefined,
    tags_mode: filters.tags.length ? filters.tagsMode : undefined,
    languages: filters.languages.length ? filters.languages : undefined,
    languages_mode: filters.languages.length
      ? filters.languagesMode
      : undefined,
    percent_positive: isFullPercentRange
      ? undefined
      : { min: percentMin, max: percentMax },
    review_count: parseRange(filters.reviewCount),
  };

  const hasActiveFilter = Object.values(payload).some(
    (value) => value !== undefined,
  );

  return hasActiveFilter ? JSON.stringify(payload) : null;
}

export function countActiveChartFilters(filters: ChartFilters): number {
  const [percentMin, percentMax] = filters.percentPositive;

  return [
    Boolean(filters.releaseDate.min || filters.releaseDate.max),
    Boolean(filters.price.min || filters.price.max),
    filters.isDemo !== null,
    filters.tags.length > 0,
    filters.languages.length > 0,
    percentMin !== PERCENT_POSITIVE_MIN || percentMax !== PERCENT_POSITIVE_MAX,
    Boolean(filters.reviewCount.min || filters.reviewCount.max),
  ].filter(Boolean).length;
}
