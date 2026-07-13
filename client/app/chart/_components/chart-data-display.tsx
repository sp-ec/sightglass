import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { UpdatingBadge } from "@/components/util/updating-badge";
import ScatterChart from "@/components/charts/scatter-chart";
import BarChart from "@/components/charts/bar-chart";
import PieChart from "@/components/charts/pie-chart";
import RadarChart from "@/components/charts/radar-chart";

interface Props {
	chartType: string;
	loading: boolean;
	xAxisLabel: string;
	selectedYAxisLabel: string;
	selectedGroupByLabel: string;
	aggregateMode: string;
	bucketDisplayValue: string | number;
	sortedChartData: any;
	xAxis: string;
	yAxis: string;
}

export function ChartDataDisplay({
	chartType,
	loading,
	xAxisLabel,
	selectedYAxisLabel,
	selectedGroupByLabel,
	aggregateMode,
	bucketDisplayValue,
	sortedChartData,
	xAxis,
	yAxis,
}: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex flex-row gap-2 items-center">
					{selectedYAxisLabel} vs {xAxisLabel} by {selectedGroupByLabel}{" "}
					{loading && <UpdatingBadge />}
				</CardTitle>
				<CardDescription>
					{chartType === "bar" ? "Bar Chart" : "Scatterplot"}, aggregated with{" "}
					{aggregateMode} values, bucket size: {bucketDisplayValue}
				</CardDescription>
			</CardHeader>
			<CardContent
				className={
					chartType === "radar" || chartType === "pie" ? "h-240" : "h-120"
				}
			>
				{chartType === "bar" ? (
					<BarChart
						data={sortedChartData || null}
						xAxisKey={xAxis}
						yAxisKey={yAxis}
					/>
				) : chartType === "scatter" ? (
					<ScatterChart
						data={sortedChartData || null}
						xAxisKey={xAxis}
						yAxisKey={yAxis}
					/>
				) : chartType === "pie" ? (
					<PieChart
						data={sortedChartData || null}
						xAxisKey={xAxis}
						yAxisKey={yAxis}
					/>
				) : (
					<RadarChart
						data={sortedChartData || null}
						xAxisKey={xAxis}
						yAxisKey={yAxis}
					/>
				)}
			</CardContent>
		</Card>
	);
}