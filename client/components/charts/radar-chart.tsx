"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useMemo } from "react";

import { ChartPoint, ChartResponse } from "@/components/charts/chart-types";

interface RadarChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { TOOLTIP, ChartTooltip } from "./chart-tooltip";
import { Skeleton } from "../ui/skeleton";

export default function RadarChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: RadarChartProps) {
	const option = useMemo(() => {
		if (!data || data.points.length === 0) return {};

		const maxValues = [
			Math.max(...data.points.map((point) => Number(point[xAxisKey]))) || 0,
			Math.max(...data.points.map((point) => Number(point[yAxisKey]))) || 0,
		];

		const maxValue = Math.max(...maxValues);

		const valueMultipliers = [
			maxValues[0] < maxValues[1] ? maxValues[1] / maxValues[0] : 1,
			maxValues[1] < maxValues[0] ? maxValues[0] / maxValues[1] : 1,
		];

		console.log("RadarChart max values:", maxValues);
		console.log("RadarChart max value:", maxValue);
		console.log("Multipliers: ", valueMultipliers);

		const indicatorData = data.points.map((point) => ({
			name: String(point.bucket),
			max: maxValue,
		}));

		const seriesData1 = xAxisKey && {
			value: data.points.map((point) => Number(point[xAxisKey]) * valueMultipliers[0]),
			name: xAxisLabel || xAxisKey,
		};

		const seriesData2 = yAxisKey && {
			value: data.points.map((point) => Number(point[yAxisKey]) * valueMultipliers[1]),
			name: yAxisLabel || yAxisKey,
		};

		console.log("RadarChart indicator data:", indicatorData);
		console.log("RadarChart series1 data:", seriesData1);
		console.log("RadarChart series2 data:", seriesData2);

		return {
			radar: {
				indicator: indicatorData,
				radius: 400,
				startAngle: 90,
				splitNumber: 4,
				splitArea: {
					areaStyle: {
						color: ["oklch(26.9% 0 0)", "oklch(30.0% 0 0)"],
						shadowColor: "rgba(0, 0, 0, 0.2)",
						shadowBlur: 10,
					},
				},
			},
			series: [
				{
					type: "radar",
					stillShowZeroSum: false,
					radius: "200%",
					data: [
						(seriesData1 && {
							...seriesData1,
							areaStyle: {
								color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
									{
										color: "rgba(19, 150, 198, 0.1)",
										offset: 0,
									},
									{
										color: "rgba(19, 150, 198, 0.9)",
										offset: 1,
									},
								]),
							},
							lineStyle: {
								color: "rgba(19, 150, 198, 0.9)",
							},
							itemStyle: {
								color: "rgba(19, 150, 198, 0.9)",
							},
						}),
						(seriesData2 && {
							...seriesData2,
							lineStyle: {
								color: "rgba(227, 56, 56, 0.9)",
								type: "dashed",
							},
							itemStyle: {
								color: "rgba(227, 56, 56, 0.9)",
							},
							symbol: "rect",
						}),
					],
					label: {
						show: false,
					},
				},
			],
		};
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel]);

	console.log(xAxisKey, yAxisKey, xAxisLabel, yAxisLabel);

	if (!data || data.points.length === 0) {
		return (
			<div className="flex h-full min-h-100 w-full items-center justify-center text-sm text-muted-foreground flex-row gap-2">
				<Skeleton className="h-220 w-220 rounded-full" />
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
