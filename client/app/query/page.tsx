"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import ScatterChart from "@/components/charts/scatter-chart";
import BarChart from "@/components/charts/bar-chart";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

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
} from "@/components/pages/query/query-types";

import { ListSortDescending, ListSortAscending, Menu } from "lucide-react";

const bucketSchema = z.number().finite().int().positive();

export default function QueryPage() {
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
	const isBarChart = chartType === "bar";
	const xAxisLabel = isBarChart ? "Bucket" : selectedXAxisLabel;
	const xAxisDisabled = isBarChart;
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

	useEffect(() => {
		if (chartType === "bar" && xAxis !== "bucket") {
			setXAxis("bucket");
		}
	}, [chartType, xAxis]);

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
		if (!chartData || !sortingMode) {
			return;
		}

		let sortedPoints = [...chartData.points];
		if (sortingMode === "ascending") {
			sortedPoints.sort((a, b) => {
				const aValue = a[yAxis];
				const bValue = b[yAxis];

				if (typeof aValue === "number" && typeof bValue === "number") {
					return aValue - bValue;
				}
				return 0;
			});
		} else if (sortingMode === "descending") {
			sortedPoints.sort((a, b) => {
				const aValue = a[yAxis];
				const bValue = b[yAxis];

				if (typeof aValue === "number" && typeof bValue === "number") {
					return bValue - aValue;
				}
				return 0;
			});
		}

		setSortedChartData({ ...chartData, points: sortedPoints });
	}, [chartData, sortingMode, xAxis, yAxis]);

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
					params.set("aggregate", aggregateMode);
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
	}, [groupBy, chartType, bucketSize, aggregateMode]);

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
										value={xAxisLabel}
										disabled={xAxisDisabled}
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

					{groupBy && chartType && (
						<div className="grid gap-4 md:grid-cols-6">
							<div className="space-y-2">
								<p className="text-sm font-medium">Aggregate Mode</p>
								<ButtonGroup>
									<Button
										variant="outline"
										disabled={aggregateMode === "average"}
										onClick={() => setAggregateMode("average")}
									>
										Average
									</Button>
									<Button
										variant="outline"
										disabled={aggregateMode === "median"}
										onClick={() => setAggregateMode("median")}
									>
										Median
									</Button>
								</ButtonGroup>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">Sorting</p>
								<ButtonGroup>
									<Button
										variant="outline"
										disabled={sortingMode === "flat" || chartType === "scatter"}
										onClick={() => setSortingMode("flat")}
									>
										<Menu />
									</Button>
									<Button
										variant="outline"
										disabled={
											sortingMode === "ascending" || chartType === "scatter"
										}
										onClick={() => setSortingMode("ascending")}
									>
										<ListSortAscending />
									</Button>
									<Button
										variant="outline"
										disabled={
											sortingMode === "descending" || chartType === "scatter"
										}
										onClick={() => setSortingMode("descending")}
									>
										<ListSortDescending />
									</Button>
								</ButtonGroup>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* {loading && (
				<div className="text-sm text-muted-foreground">
					Loading chart data...
				</div>
			)} */}
			{error && <div className="text-sm text-destructive">{error}</div>}

			{canRenderChart && (
				<Card>
					<CardHeader>
						<CardTitle>{selectedGroupByLabel}</CardTitle>
						<CardDescription>
							{chartType === "bar" ? "Bar chart" : "Scatterplot"}
						</CardDescription>
					</CardHeader>
					<CardContent className="h-120">
						{chartType === "bar" ? (
							<BarChart
								data={sortedChartData || null}
								xAxisKey={xAxis}
								yAxisKey={yAxis}
							/>
						) : (
							<ScatterChart
								data={sortedChartData || null}
								xAxisKey={xAxis}
								yAxisKey={yAxis}
							/>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
