"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import type { TooltipComponentFormatterCallbackParams } from "echarts";

import { ChartPoint, ChartResponse } from "@/components/charts/chart-types";
import { useIsDark } from "@/hooks/use-is-dark";

interface PieChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { buildTooltipOption, ChartTooltip } from "./chart-tooltip";
import { Skeleton } from "../ui/skeleton";

export default function PieChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: PieChartProps) {
	const isDark = useIsDark();

	const option = useMemo(() => {
		if (!data || data.points.length === 0) return {};
		const seriesData = data.points.map((point) => ({
			name: String(point[xAxisKey]),
			value: point[yAxisKey],
		}));

		console.log("PieChart data:", seriesData);

		return {
			color: ['#1D4C9D', '#1396C6', '#77C414', '#FCD92C', '#ED912A', '#E33838'],
			tooltip: {
				...buildTooltipOption(isDark),
				trigger: "item",
				formatter: (params: TooltipComponentFormatterCallbackParams) => {
					const param = Array.isArray(params) ? params[0] : params;
					const originalPoint = data.points[param.dataIndex];

					return originalPoint ? ChartTooltip({ point: originalPoint }) : "";
				},
			},
			series: [
				{
					type: "pie",
					stillShowZeroSum: false,
					radius: "90%",
					data: seriesData,
					label: {
						show: false
					}
				},
			],
		};
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel, isDark]);

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
