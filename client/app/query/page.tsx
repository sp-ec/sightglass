"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ScatterChart as ScatterChartIcon } from "lucide-react";
import { z } from "zod";
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
	ZAxis,
	Brush,
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

type BucketConfig = {
	min: number;
	max: number;
	step: number;
	unit?: string;
	locked?: boolean;
	displayValue?: (value: number) => string;
};

const BUCKET_CONFIGS: Record<GroupByValue, BucketConfig> = {
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

const bucketSchema = z.number().finite().int().positive();

const toNumber = (value: string | number | null | undefined) => {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const CustomTooltip = ({
	active,
	payload,
	label,
}: {
	active: any;
	payload: any;
	label: any;
}) => {
	if (active && payload && payload.length) {
		const payloadData = payload[0].payload;
		return (
			<div className="bg-card p-4 border rounded shadow-md">
				<p className="font-bold mb-2">Bucket: {payloadData.bucket}</p>
				<p className="text-sm text-gray-500">Count: {payloadData.count}</p>
				<p className="text-sm text-gray-500">
					Range: {payloadData.min_value} - {payloadData.max_value}
				</p>
				<p className="text-sm text-gray-500">
					Avg. Review Count: {payloadData.average_review_count}
				</p>
				<p className="text-sm text-gray-500">
					Avg. Review Score: {payloadData.average_review_score}
				</p>
				<p className="text-sm text-gray-500">
					Avg. % Positive: {payloadData.average_percent_positive}
				</p>
				<p className="text-sm text-gray-500">
					Avg. Price: ${(payloadData.average_price_in_cents / 100).toFixed(2)}
				</p>
			</div>
		);
	}

	return null;
};

export default function QueryPage() {
	const [groupBy, setGroupBy] = useState<GroupByValue | "">("");
	const [chartType, setChartType] = useState<ChartType | "">("");
	const [xAxis, setXAxis] = useState<AxisValue>("bucket");
	const [yAxis, setYAxis] = useState<AxisValue>("count");
	const [bucketSize, setBucketSize] = useState("100");
	const [chartData, setChartData] = useState<ChartResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bucketError, setBucketError] = useState<string | null>(null);
	const [scatterDomain, setScatterDomain] = useState<
		[number | "auto", number | "auto"]
	>(["auto", "auto"]);

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
	const bucketDisplayValue = useMemo(() => {
		if (!bucketConfig) {
			return bucketSize;
		}

		const parsed = Number(bucketSize);
		if (!Number.isFinite(parsed)) {
			return bucketSize;
		}

		if (bucketConfig.displayValue) {
			return bucketConfig.displayValue(parsed);
		}

		return bucketSize;
	}, [bucketConfig, bucketSize]);

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
			.filter((point) => point.x !== null && point.y !== null)
			.sort((a, b) => (a.x as number) - (b.x as number));
	}, [chartData, chartType, xAxis, yAxis]);

	useEffect(() => {
		setScatterDomain(["auto", "auto"]);
	}, [selectedSeries, xAxis, yAxis]);

	useEffect(() => {
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
												onSelect={() => {
													setGroupBy(option.value);
													setChartType("");
													setBucketSize(
														String(BUCKET_CONFIGS[option.value].min),
													);
													setBucketError(null);
												}}
												onClick={() => {
													setGroupBy(option.value);
													setChartType("");
													setBucketSize(
														String(BUCKET_CONFIGS[option.value].min),
													);
													setBucketError(null);
												}}
												onPointerDown={(e) => {
													e.preventDefault();
													setGroupBy(option.value);
													setChartType("");
													setBucketSize(
														String(BUCKET_CONFIGS[option.value].min),
													);
													setBucketError(null);
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

						{groupBy && chartType && bucketConfig && (
							<div className="space-y-2">
								<p className="text-sm font-medium">Bucket Size</p>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										min={bucketConfig.min}
										max={bucketConfig.max}
										step={bucketConfig.step}
										value={bucketSize}
										disabled={bucketConfig.locked}
										onChange={(e) => {
											const parsed = Number(e.target.value);
											const validation = bucketSchema.safeParse(parsed);

											if (!validation.success) {
												setBucketError(
													validation.error.issues[0]?.message ??
														"Invalid bucket size",
												);
												setBucketSize(e.target.value);
												return;
											}

											if (
												parsed < bucketConfig.min ||
												parsed > bucketConfig.max
											) {
												setBucketError(
													`Bucket size must be between ${bucketConfig.min} and ${bucketConfig.max}`,
												);
												setBucketSize(String(parsed));
												return;
											}

											setBucketError(null);
											setBucketSize(String(parsed));
										}}
									/>
									{bucketConfig.unit && (
										<span className="text-sm text-muted-foreground">
											{bucketConfig.unit}
										</span>
									)}
								</div>
								{bucketConfig.displayValue ? (
									<p className="text-xs text-muted-foreground">
										Value: {bucketDisplayValue}
									</p>
								) : null}
								{bucketError && (
									<p className="text-xs text-destructive">{bucketError}</p>
								)}
								<p className="text-xs text-muted-foreground">
									{bucketConfig.locked
										? "This grouping uses a fixed bucket size."
										: `Allowed range: ${bucketConfig.min} to ${bucketConfig.max}.`}
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
					<CardContent className="h-120">
						<ResponsiveContainer width="100%" height="100%">
							{chartType === "bar" ? (
								<BarChart
									data={selectedSeries}
									margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="bucket" />
									<YAxis />
									<Tooltip
										content={
											<CustomTooltip active={true} payload={[]} label="" />
										}
									/>
									<Bar dataKey={yAxis} radius={[0, 0, 0, 0]}>
										{selectedSeries.map((_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={BAR_COLORS[index % BAR_COLORS.length]}
											/>
										))}
									</Bar>
									<Brush dataKey="bucket" height={30} stroke="#8884d8" />
								</BarChart>
							) : (
								<ScatterChart
									data={selectedSeries}
									margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="x"
										type="number"
										name={xAxis}
										domain={scatterDomain}
										allowDataOverflow={true}
									/>
									<YAxis dataKey="y" type="number" name={yAxis} />

									<Tooltip
										content={
											<CustomTooltip active={true} payload={[]} label="" />
										}
									/>
									<Scatter
										data={selectedSeries as Array<{ x: number; y: number }>}
										fill="#60a5fa"
										shape={(props: any) => (
											<circle
												cx={props.cx}
												cy={props.cy}
												r={4}
												fill="#60a5fa"
											/>
										)}
									/>
									<Brush
										dataKey="x"
										height={30}
										stroke="#8884d8"
										onChange={(e: any) => {
											if (
												e.startIndex !== undefined &&
												e.endIndex !== undefined &&
												selectedSeries.length > 0
											) {
												setScatterDomain([
													selectedSeries[e.startIndex].x as number,
													selectedSeries[e.endIndex].x as number,
												]);
											}
										}}
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
