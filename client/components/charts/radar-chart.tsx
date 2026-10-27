"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useMemo } from "react";
import type { TooltipComponentFormatterCallbackParams } from "echarts";

import { ChartPoint, ChartResponse } from "@/components/charts/chart-types";
import { useIsDark } from "@/hooks/use-is-dark";

interface RadarChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { buildTooltipOption, ChartTooltip } from "./chart-tooltip";
import { Skeleton } from "../ui/skeleton";

// A radar tooltip covers every bucket at once, so cap it before it runs off screen
const RADAR_TOOLTIP_LIMIT = 8;

const RADAR_COLORS = {
	light: {
		bands: ["rgba(15, 23, 42, 0.03)", "rgba(15, 23, 42, 0.06)"],
		bandShadow: "rgba(15, 23, 42, 0.08)",
		line: "rgba(15, 23, 42, 0.12)",
		label: "#475569",
	},
	dark: {
		bands: ["oklch(26.9% 0 0)", "oklch(30.0% 0 0)"],
		bandShadow: "rgba(0, 0, 0, 0.2)",
		line: "rgba(255, 255, 255, 0.12)",
		label: "#cbd5e1",
	},
};

export default function RadarChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: RadarChartProps) {
	const isDark = useIsDark();
	const colors = isDark ? RADAR_COLORS.dark : RADAR_COLORS.light;

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
			// ECharts reports a radar hover as the whole series rather than the
			// single vertex under the cursor, so the tooltip lists each bucket
			tooltip: {
				...buildTooltipOption(isDark),
				trigger: "item",
				formatter: (params: TooltipComponentFormatterCallbackParams) => {
					const param = Array.isArray(params) ? params[0] : params;
					const seriesName = param?.name ?? "";
					const rows = data.points
						.slice(0, RADAR_TOOLTIP_LIMIT)
						.map((point) => ChartTooltip({ point }))
						.join(`<div style="height:6px"></div>`);
					const hidden = data.points.length - RADAR_TOOLTIP_LIMIT;

					return `
						<div style="font-weight:bold;margin-bottom:6px;">${seriesName}</div>
						${rows}
						${hidden > 0 ? `<div style="margin-top:6px;opacity:0.7;">+${hidden} more</div>` : ""}
					`;
				},
			},
			radar: {
				indicator: indicatorData,
				radius: 400,
				startAngle: 90,
				splitNumber: 4,
				axisName: {
					color: colors.label,
				},
				axisLine: {
					lineStyle: { color: colors.line },
				},
				splitLine: {
					lineStyle: { color: colors.line },
				},
				splitArea: {
					areaStyle: {
						color: colors.bands,
						shadowColor: colors.bandShadow,
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
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel, isDark, colors]);

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
