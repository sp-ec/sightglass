"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import { ChartPoint, ChartResponse } from "@/components/pages/query/query-types";

interface BarChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { TOOLTIP } from "./chart-tooltip";

export default function BarChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: BarChartProps) {
	const option = useMemo(() => {
		if (!data || data.points.length === 0) return {};
		const seriesData = data.points.map((point) => [
			point[xAxisKey],
			point[yAxisKey],
			point,
		]);

		return {
			tooltip: TOOLTIP,
			grid: {
				top: 40,
				right: 60,
				bottom: 80,
				left: 60,
			},
			xAxis: {
				type: "category",
				name: xAxisLabel || xAxisKey,
				nameLocation: "middle",
				scale: true,
			},
			yAxis: {
				type: "value",
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
				},
				{
					type: "slider",
					show: true,
					yAxisIndex: [0],
					right: 10,
					start: 0,
					end: 100,
					filterMode: "none",
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
					type: "bar",
					large: true,
					largeThreshold: 2000,
					data: seriesData,
					itemStyle: {
						color: "#60a5fa",
						opacity: 0.7,
					},
				},
			],
		};
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel]);

	console.log("BarChart data:", data);

	if (!data || data.points.length === 0) {
		return (
			<div className="flex h-full min-h-100 w-full items-center justify-center text-sm text-muted-foreground">
				No data available for this chart.
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
