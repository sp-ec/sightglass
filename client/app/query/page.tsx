"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ScatterChart as ScatterChartIcon } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const GROUP_BY_OPTIONS = [
	{ label: "Review Count", value: "review_count" },
	{ label: "Review Score", value: "review_score" },
	{ label: "Release Date", value: "release_date" },
	{ label: "Price", value: "price" },
	{ label: "Tag", value: "tag" },
] as const;

const CHART_TYPES = [
	{ label: "Bar Chart", value: "bar", icon: BarChart3 },
	{ label: "Scatterplot", value: "scatter", icon: ScatterChartIcon },
] as const;

const AXIS_OPTIONS = [
	{ label: "Bucket", value: "bucket" },
	{ label: "Count", value: "count" },
	{ label: "Min Value", value: "min_value" },
	{ label: "Max Value", value: "max_value" },
	{ label: "Average Value", value: "average_value" },
	{ label: "Average Review Score", value: "average_review_score" },
	{ label: "Average Positive %", value: "average_percent_positive" },
	{ label: "Average Review Count", value: "average_review_count" },
	{ label: "Average Price", value: "average_price_in_cents" },
] as const;

const DEFAULT_BUCKET_SIZE = "100";
const BAR_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
const SCATTER_NUMERIC_AXES = AXIS_OPTIONS.filter(
	(option) => option.value !== "bucket",
);

type GroupByValue = (typeof GROUP_BY_OPTIONS)[number]["value"];
type ChartType = (typeof CHART_TYPES)[number]["value"];
type AxisValue = (typeof AXIS_OPTIONS)[number]["value"];
type ChartPoint = Record<string, string | number | null>;

type ChartResponse = {
	mode: GroupByValue;
	bucket_size: number | null;
	points: ChartPoint[];
};

const isNumeric = (value: string | number | null | undefined) =>
	typeof value === "number" && Number.isFinite(value);

const toNumber = (value: string | number | null | undefined) =>
	isNumeric(value) ? value : null;

export default function QueryPage() {
	const [groupBy, setGroupBy] = useState<GroupByValue | "">("");
	const [chartType, setChartType] = useState<ChartType | "">("");
	const [xAxis, setXAxis] = useState<AxisValue>("bucket");
	const [yAxis, setYAxis] = useState<AxisValue>("count");
	const [bucketSize, setBucketSize] = useState(DEFAULT_BUCKET_SIZE);
	const [chartData, setChartData] = useState<ChartResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	const selectedSeries = useMemo(() => {
		if (!chartData?.points?.length) {
			return [] as any[];
		}

		if (chartType === "bar") {
			return chartData.points.map((point, index) => ({
				...point,
				color: BAR_COLORS[index % BAR_COLORS.length],
			}));
		}

		return chartData.points
			.map((point) => ({
				x: toNumber(point[xAxis]),
				y: toNumber(point[yAxis]),
				bucket: point.bucket,
				count: toNumber(point.count),
				min_value: toNumber(point.min_value),
				max_value: toNumber(point.max_value),
				average_value: toNumber(point.average_value),
				average_review_score: toNumber(point.average_review_score),
				average_percent_positive: toNumber(point.average_percent_positive),
				average_review_count: toNumber(point.average_review_count),
				average_price_in_cents: toNumber(point.average_price_in_cents),
			}))
			.filter((point) => point.x !== null && point.y !== null);
	}, [chartData, chartType, xAxis, yAxis]);

	useEffect(() => {
		console.log(
			"Group By:",
			groupBy,
			"Chart Type:",
			chartType,
			"X Axis:",
			xAxis,
			"Y Axis:",
			yAxis,
		);
		if (!groupBy || !chartType) {
			setChartData(null);
			return;
		}

		if (chartType === "scatter") {
			if (xAxis === "bucket") {
				setXAxis("average_value");
			}
			if (yAxis === "bucket") {
				setYAxis("count");
			}
		}
	}, [groupBy, chartType, xAxis, yAxis]);

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
				const params = new URLSearchParams({ mode: groupBy });
				if (chartType !== "scatter") {
					params.set("bucket_size", bucketSize);
				}

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/games/chart?${params.toString()}`,
					{ signal: controller.signal },
				);

				if (!response.ok) {
					throw new Error("Failed to load chart data");
				}

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
	}, [groupBy, chartType, bucketSize]);

	const canRenderChart = Boolean(
		groupBy && chartType && chartData?.points.length,
	);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Query Charts</CardTitle>
					<CardDescription>
						Pick a grouping field, chart type, and axis mapping for charting
						aggregated game data.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<p className="text-sm font-medium">Group By</p>
							<Combobox items={GROUP_BY_OPTIONS}>
								<ComboboxInput
									placeholder="Choose a group"
									value={selectedGroupByLabel}
								/>
								<ComboboxContent>
									<ComboboxEmpty>No group options found.</ComboboxEmpty>
									<ComboboxList>
										{GROUP_BY_OPTIONS.map((option) => (
											<ComboboxItem
												key={option.value}
												value={option.label}
												onSelect={() => setGroupBy(option.value)}
												onClick={() => {
													setGroupBy(option.value);
												}}
												onPointerDown={(e) => {
													e.preventDefault();
													setGroupBy(option.value);
												}}
											>
												{option.label}
											</ComboboxItem>
										))}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</div>

						{groupBy && (
							<div className="space-y-2">
								<p className="text-sm font-medium">Chart Type</p>
								<Combobox items={CHART_TYPES}>
									<ComboboxInput
										placeholder="Choose a chart type"
										value={selectedChartTypeLabel}
									/>
									<ComboboxContent>
										<ComboboxEmpty>No chart types found.</ComboboxEmpty>
										<ComboboxList>
											{CHART_TYPES.map((option) => (
												<ComboboxItem
													key={option.value}
													value={option.label}
													onSelect={() => setChartType(option.value)}
													onClick={() => {
														setChartType(option.value);
													}}
													onPointerDown={(e) => {
														e.preventDefault();
														setChartType(option.value);
													}}
												>
													{option.label}
												</ComboboxItem>
											))}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
							</div>
						)}

						{groupBy && chartType && (
							<div className="space-y-2">
								<p className="text-sm font-medium">Bucket Size</p>
								<Input
									type="number"
									min={1}
									step={1}
									value={bucketSize}
									onChange={(e) => setBucketSize(e.target.value)}
									placeholder="100"
								/>
								<p className="text-xs text-muted-foreground">
									Used for numeric groupings like review count, review score,
									release date, and price.
								</p>
							</div>
						)}
					</div>

					{groupBy && chartType && (
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<p className="text-sm font-medium">X Axis</p>
								<Combobox items={axisOptions}>
									<ComboboxInput
										placeholder="Choose x axis"
										value={selectedXAxisLabel}
									/>
									<ComboboxContent>
										<ComboboxEmpty>No axis options found.</ComboboxEmpty>
										<ComboboxList>
											{axisOptions.map((option) => (
												<ComboboxItem
													key={option.value}
													value={option.label}
													onSelect={() => setXAxis(option.value)}
													onClick={() => {
														setXAxis(option.value);
													}}
													onPointerDown={(e) => {
														e.preventDefault();
														setXAxis(option.value);
													}}
												>
													{option.label}
												</ComboboxItem>
											))}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">Y Axis</p>
								<Combobox items={axisOptions}>
									<ComboboxInput
										placeholder="Choose y axis"
										value={selectedYAxisLabel}
									/>
									<ComboboxContent>
										<ComboboxEmpty>No axis options found.</ComboboxEmpty>
										<ComboboxList>
											{axisOptions.map((option) => (
												<ComboboxItem
													key={option.value}
													value={option.label}
													onSelect={() => setYAxis(option.value)}
													onClick={() => {
														setYAxis(option.value);
													}}
													onPointerDown={(e) => {
														e.preventDefault();
														setYAxis(option.value);
													}}
												>
													{option.label}
												</ComboboxItem>
											))}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{loading && (
				<div className="text-sm text-muted-foreground">
					Loading chart data...
				</div>
			)}
			{error && <div className="text-sm text-destructive">{error}</div>}

			{canRenderChart && (
				<Card>
					<CardHeader>
						<CardTitle>{selectedGroupByLabel}</CardTitle>
						<CardDescription>
							{chartType === "bar" ? "Bar chart" : "Scatterplot"} preview
						</CardDescription>
					</CardHeader>
					<CardContent className="h-[480px]">
						<ResponsiveContainer width="100%" height="100%">
							{chartType === "bar" ? (
								<BarChart
									data={selectedSeries}
									margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="bucket" />
									<YAxis />
									<Tooltip />
									<Bar dataKey={yAxis} radius={[6, 6, 0, 0]}>
										{selectedSeries.map((_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={BAR_COLORS[index % BAR_COLORS.length]}
											/>
										))}
									</Bar>
								</BarChart>
							) : (
								<ScatterChart
									margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="x" type="number" name={xAxis} />
									<YAxis dataKey="y" type="number" name={yAxis} />
									<Tooltip cursor={{ strokeDasharray: "3 3" }} />
									<Scatter
										data={selectedSeries as Array<{ x: number; y: number }>}
										fill="#60a5fa"
									/>
								</ScatterChart>
							)}
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
