import { useState, useEffect, useMemo, useCallback } from "react";
import {
	GROUP_BY_OPTIONS,
	CHART_TYPES,
	AXIS_OPTIONS,
	BUCKET_CONFIGS,
	NUMERIC_AXIS_OPTIONS,
	GroupByValue,
	ChartType,
	AxisValue,
	ChartResponse,
	ChartFilters,
	FilterOption,
	DEFAULT_CHART_FILTERS,
	serializeChartFilters,
	countActiveChartFilters,
} from "@/components/charts/chart-types";

const FILTER_DEBOUNCE_DELAY = 400;

export function useChartState() {
	const [groupBy, setGroupBy] = useState<GroupByValue | "">("");
	const [chartType, setChartType] = useState<ChartType | "">("");
	const [xAxis, setXAxis] = useState<AxisValue>("bucket");
	const [yAxis, setYAxis] = useState<AxisValue>("count");
	const [bucketSize, setBucketSize] = useState("100");
	const [aggregateMode, setAggregateMode] = useState<"average" | "median">(
		"average",
	);
	const [sortingMode, setSortingMode] = useState<
		"flat" | "ascending" | "descending"
	>("flat");
	const [chartData, setChartData] = useState<ChartResponse | null>(null);
	const [sortedChartData, setSortedChartData] = useState<ChartResponse | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bucketError, setBucketError] = useState<string | null>(null);
	const [tagsCounted, setTagsCounted] = useState<number | null>(10);
	const [filters, setFilters] = useState<ChartFilters>(DEFAULT_CHART_FILTERS);
	const [tagOptions, setTagOptions] = useState<FilterOption[]>([]);
	const [languageOptions, setLanguageOptions] = useState<FilterOption[]>([]);
	const [debouncedFilters, setDebouncedFilters] = useState<string | null>(null);

	const bucketConfig = groupBy ? BUCKET_CONFIGS[groupBy] : null;
	const axisOptions = NUMERIC_AXIS_OPTIONS;

	const serializedFilters = useMemo(
		() => serializeChartFilters(filters),
		[filters],
	);
	const activeFilterCount = useMemo(
		() => countActiveChartFilters(filters),
		[filters],
	);

	const setFilter = useCallback(
		<Key extends keyof ChartFilters>(key: Key, value: ChartFilters[Key]) => {
			setFilters((current) => ({ ...current, [key]: value }));
		},
		[],
	);

	const resetFilters = useCallback(
		() => setFilters(DEFAULT_CHART_FILTERS),
		[],
	);

	const selectedGroupByLabel = useMemo(
		() =>
			GROUP_BY_OPTIONS.find((option) => option.value === groupBy)?.label ?? "",
		[groupBy],
	);
	const selectedChartTypeLabel = useMemo(
		() => CHART_TYPES.find((option) => option.value === chartType)?.label ?? "",
		[chartType],
	);
	const selectedXAxisLabel = useMemo(
		() => axisOptions.find((option) => option.value === xAxis)?.label ?? "",
		[axisOptions, xAxis],
	);
	const selectedYAxisLabel = useMemo(
		() => axisOptions.find((option) => option.value === yAxis)?.label ?? "",
		[axisOptions, yAxis],
	);

	const isBucketChart = chartType === "bar" || chartType === "pie";
	const xAxisLabel = isBucketChart ? "Bucket" : selectedXAxisLabel;
	const xAxisDisabled = isBucketChart;
	// const isStreamgraph = chartType === "streamgraph";

	const bucketDisplayValue = useMemo(() => {
		if (!bucketConfig) return bucketSize;
		const parsed = Number(bucketSize);
		if (!Number.isFinite(parsed)) return bucketSize;
		return bucketConfig.displayValue
			? bucketConfig.displayValue(parsed)
			: bucketSize;
	}, [bucketConfig, bucketSize]);

	useEffect(() => {
		if (isBucketChart) setXAxis("bucket");
	}, [chartType, xAxis]);

	useEffect(() => {
		if (!groupBy || !chartType) {
			setChartData(null);
			return;
		}
		if (chartType === "scatter") {
			if (xAxis === "bucket") setXAxis("aggregate_value");
			if (yAxis === "bucket") setYAxis("count");
		}
		if (chartType === "radar") {
			if (xAxis === "bucket") setXAxis("count");
			if (yAxis === "bucket") setYAxis("aggregate_review_score");
		}
	}, [groupBy, chartType, xAxis, yAxis]);

	// Handle sorting
	useEffect(() => {
		if (!chartData || !sortingMode) return;

		const sortedPoints = [...chartData.points];
		const sortedSeries = chartType === "radar" ? xAxis : yAxis;

		if (sortingMode === "ascending") {
			sortedPoints.sort(
				(a, b) =>
					(Number(a[sortedSeries]) || 0) - (Number(b[sortedSeries]) || 0),
			);
		} else if (sortingMode === "descending") {
			sortedPoints.sort(
				(a, b) =>
					(Number(b[sortedSeries]) || 0) - (Number(a[sortedSeries]) || 0),
			);
		}
		setSortedChartData({ ...chartData, points: sortedPoints });
	}, [chartData, sortingMode, xAxis, yAxis]);

	// filter option loading
	useEffect(() => {
		const controller = new AbortController();
		const loadFilterOptions = async () => {
			try {
				const [tagResponse, languageResponse] = await Promise.all([
					fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/tags`, {
						signal: controller.signal,
					}),
					fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/languages`, {
						signal: controller.signal,
					}),
				]);
				if (!tagResponse.ok || !languageResponse.ok) {
					throw new Error("Failed to load filter options");
				}
				setTagOptions((await tagResponse.json()) as FilterOption[]);
				setLanguageOptions((await languageResponse.json()) as FilterOption[]);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError("Failed to load filter options");
				}
			}
		};

		loadFilterOptions();
		return () => controller.abort();
	}, []);

	// debounce filters so typed ranges do not refetch on every keystroke
	useEffect(() => {
		const timeout = setTimeout(
			() => setDebouncedFilters(serializedFilters),
			FILTER_DEBOUNCE_DELAY,
		);
		return () => clearTimeout(timeout);
	}, [serializedFilters]);

	// data fetching
	useEffect(() => {
		if (!groupBy || !chartType) {
			setChartData(null);
			return;
		}

		const controller = new AbortController();
		const loadChartData = async () => {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams({
					mode: groupBy,
					bucket_size: bucketSize,
					aggregate: aggregateMode,
					tags_counted: String(tagsCounted),
				});
				if (debouncedFilters) {
					params.set("filters", debouncedFilters);
				}
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/games/chart?${params.toString()}`,
					{ signal: controller.signal },
				);
				if (!response.ok) throw new Error("Failed to load chart data");
				const data = (await response.json()) as ChartResponse;
				setChartData(data);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError("Failed to load chart data");
				}
			} finally {
				setLoading(false);
			}
		};

		loadChartData();
		return () => controller.abort();
	}, [
		groupBy,
		chartType,
		bucketSize,
		aggregateMode,
		tagsCounted,
		debouncedFilters,
	]);

	return {
		state: {
			groupBy,
			chartType,
			xAxis,
			yAxis,
			bucketSize,
			aggregateMode,
			sortingMode,
			tagsCounted,
			filters,
			tagOptions,
			languageOptions,
			activeFilterCount,
			loading,
			error,
			bucketError,
			bucketConfig,
			axisOptions,
			selectedGroupByLabel,
			selectedChartTypeLabel,
			xAxisLabel,
			selectedYAxisLabel,
			xAxisDisabled,
			bucketDisplayValue,
			sortedChartData,
			canRenderChart: Boolean(groupBy && chartType),
			showFilters: Boolean(groupBy && chartType),
		},
		actions: {
			setGroupBy,
			setChartType,
			setXAxis,
			setYAxis,
			setBucketSize,
			setAggregateMode,
			setSortingMode,
			setTagsCounted,
			setBucketError,
			setFilter,
			resetFilters,
		},
	};
}
