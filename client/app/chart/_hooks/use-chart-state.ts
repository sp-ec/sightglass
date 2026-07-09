import { useState, useEffect, useMemo } from "react";
import {
	GROUP_BY_OPTIONS,
	CHART_TYPES,
	AXIS_OPTIONS,
	BUCKET_CONFIGS,
	SCATTER_NUMERIC_AXES,
	GroupByValue,
	ChartType,
	AxisValue,
	ChartResponse,
} from "@/components/charts/chart-types";

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

	const bucketConfig = groupBy ? BUCKET_CONFIGS[groupBy] : null;
	const axisOptions =
		chartType === "scatter" ? SCATTER_NUMERIC_AXES : AXIS_OPTIONS;

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

	const isBarChart = chartType === "bar";
	const xAxisLabel = isBarChart ? "Bucket" : selectedXAxisLabel;
	const xAxisDisabled = isBarChart;

	const bucketDisplayValue = useMemo(() => {
		if (!bucketConfig) return bucketSize;
		const parsed = Number(bucketSize);
		if (!Number.isFinite(parsed)) return bucketSize;
		return bucketConfig.displayValue
			? bucketConfig.displayValue(parsed)
			: bucketSize;
	}, [bucketConfig, bucketSize]);

	// Handle axis resets based on chart type
	useEffect(() => {
		if (chartType === "bar" && xAxis !== "bucket") setXAxis("bucket");
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
	}, [groupBy, chartType, xAxis, yAxis]);

	// Handle Sorting
	useEffect(() => {
		if (!chartData || !sortingMode) return;

		const sortedPoints = [...chartData.points];

		console.log("Sorted points size: ", sortedPoints.length);

		if (sortingMode === "ascending") {
			sortedPoints.sort(
				(a, b) => (Number(a[yAxis]) || 0) - (Number(b[yAxis]) || 0),
			);
		} else if (sortingMode === "descending") {
			sortedPoints.sort(
				(a, b) => (Number(b[yAxis]) || 0) - (Number(a[yAxis]) || 0),
			);
		}
		setSortedChartData({ ...chartData, points: sortedPoints });
	}, [chartData, sortingMode, xAxis, yAxis]);

	// Data Fetching
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
	}, [groupBy, chartType, bucketSize, aggregateMode, tagsCounted]);

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
		},
	};
}
