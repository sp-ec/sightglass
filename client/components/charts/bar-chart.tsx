"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import type { TooltipComponentFormatterCallbackParams } from "echarts";

import { ChartPoint, ChartResponse } from "@/components/charts/chart-types";
import { useIsDark } from "@/hooks/use-is-dark";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { buildDataZoom } from "@/components/charts/chart-data-zoom";

interface BarChartProps {
	data: ChartResponse | null;
	xAxisKey: string;
	yAxisKey: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
}

import { buildTooltipOption } from "./chart-tooltip";
import { Skeleton } from "../ui/skeleton";

export default function BarChart({
	data,
	xAxisKey,
	yAxisKey,
	xAxisLabel,
	yAxisLabel,
}: BarChartProps) {
	const isDark = useIsDark();

	const option = useMemo(() => {
		if (!data || data.points.length === 0) return {};
		const seriesData = data.points.map((point) => [
			point[xAxisKey],
			point[yAxisKey],
		]);

		return {
			tooltip: {
				...buildTooltipOption(isDark),
				trigger: "axis",
				formatter: (params: TooltipComponentFormatterCallbackParams) => {
					const param = Array.isArray(params) ? params[0] : params;
					const originalPoint = data.points[param.dataIndex];

					if (!originalPoint) return "";

					return ChartTooltip({ point: originalPoint });
				},
			},
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
			dataZoom: buildDataZoom(isDark),
			series: [
				{
					type: "bar",
					large: true,
					largeThreshold: 2000,
					data: seriesData,
					itemStyle: {
						color: "#0ea5e9",
						opacity: 1,
					},
				},
			],
		};
	}, [data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel, isDark]);

	console.log("BarChart data:", data);

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
