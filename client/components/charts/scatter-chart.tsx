"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import { ChartPoint, ChartResponse } from "@/components/charts/chart-types";

interface ScatterChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { TOOLTIP } from "./chart-tooltip";
import { Skeleton } from "../ui/skeleton";

export default function ScatterChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: ScatterChartProps) {
	const option = useMemo(() => {
		if (!data || data.points.length === 0) return {};

			const isCategorical =
				data.points[0].bucket !== undefined &&
				typeof data.points[0].bucket === "string";

			const seriesData = data.points.map((point) => {
				return [point[xAxisKey] as any, point[yAxisKey] as any, point];
			});

			return {
				tooltip: TOOLTIP,
				grid: {
					top: 40,
					right: 60,
					bottom: 80,
					left: 60,
				},
				xAxis: {
					type:
						isCategorical && xAxisKey == "aggregate_value"
							? "category"
							: "value",
					name: xAxisLabel || xAxisKey,
					nameLocation: "middle",
					scale: true,
				},
				yAxis: {
					type:
						isCategorical && yAxisKey == "aggregate_value"
							? "category"
							: "value",
					name: yAxisLabel || yAxisKey,
					nameLocation: "middle",
					nameGap: 40,
					scale: true,
				},
				dataZoom: [
					{
						type: "slider",
						show: true,
						xAxisIndex: [0],
						bottom: 10,
						start: 0,
						end: 100,
						filterMode: "none",
						backgroundColor: "oklch(0.27 0.00 0)",
						fillerColor: "rgb(16, 29, 47, 0.5)",
						borderColor: "oklch(0.37 0.00 0)",
						handleStyle: {
							color: "oklch(0.68 0.15 237)",
							borderColor: "#b3d8ff",
							borderWidth: 1,
						},
						moveHandleStyle: {
							color: "oklch(0.68 0.15 237)",
						},
					},
					{
						type: "slider",
						show: true,
						yAxisIndex: [0],
						right: 10,
						start: 0,
						end: 100,
						filterMode: "none",
						backgroundColor: "oklch(0.27 0.00 0)",
						fillerColor: "rgb(16, 29, 47, 0.5)",
						borderColor: "oklch(0.37 0.00 0)",
						handleStyle: {
							color: "oklch(0.68 0.15 237)",
							borderColor: "#b3d8ff",
							borderWidth: 1,
						},
						moveHandleStyle: {
							color: "oklch(0.68 0.15 237)",
						},
					},
					{
						type: "inside",
						xAxisIndex: [0],
						filterMode: "none",
					},
					{
						type: "inside",
						yAxisIndex: [0],
						filterMode: "none",
					},
				],
				series: [
					{
						type: "scatter",
						symbolSize: 8,
						data: seriesData,
						itemStyle: {
							color: "#0ea5e9",
							opacity: 1,
						},
						large: true,
						largeThreshold: 2000,
					},
				],
			};
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel]);

	console.log("ScatterChart data:", data);

	if (!data || data.points.length === 0) {
		return (
			<div className="flex h-full min-h-100 w-full items-center justify-center text-sm text-muted-foreground flex-row gap-2">
				<div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground flex-col gap-2">
					<Skeleton className="h-full w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-108 w-10 mb-12" />
			</div>
		);
	}

	return (
		<ReactECharts
			option={option}
			style={{ height: "100%", minHeight: "400px", width: "100%" }}
			opts={{ renderer: "canvas" }}
		/>
	);
}
