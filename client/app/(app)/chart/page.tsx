"use client";

import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartState } from "@/app/(app)/chart/_hooks/use-chart-state";
import { ChartPrimaryControls } from "@/app/(app)/chart/_components/chart-primary-controls";
import { ChartAxisControls } from "@/app/(app)/chart/_components/chart-axis-controls";
import { ChartModifierControls } from "@/app/(app)/chart/_components/chart-modifier-controls";
import { ChartDataDisplay } from "@/app/(app)/chart/_components/chart-data-display";
import { ChartFilterPanel } from "@/app/(app)/chart/_components/chart-filter-panel";

const bucketSchema = z.number().finite().int().positive();

export default function ChartPage() {
    const { state, actions } = useChartState();

    const handleBucketSizeChange = (val: string, config: any) => {
        const parsed = Number(val);
        const validation = bucketSchema.safeParse(parsed);

        if (!validation.success) {
            actions.setBucketError(validation.error.issues[0]?.message ?? "Invalid bucket size");
            actions.setBucketSize(val);
            return;
        }

        if (parsed < config.min || parsed > config.max) {
            actions.setBucketError(`Bucket size must be between ${config.min} and ${config.max}`);
            actions.setBucketSize(String(parsed));
            return;
        }

        actions.setBucketError(null);
        actions.setBucketSize(String(parsed));
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
            {state.showFilters && (
                <ChartFilterPanel
                    filters={state.filters}
                    tagOptions={state.tagOptions}
                    languageOptions={state.languageOptions}
                    activeFilterCount={state.activeFilterCount}
                    onFilterChange={actions.setFilter}
                    onReset={actions.resetFilters}
                />
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chart Creator</CardTitle>
                        <CardDescription>
                            Aggregate, filter, and visualize Steam data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <ChartPrimaryControls
                            groupBy={state.groupBy}
                            chartType={state.chartType}
                            bucketSize={state.bucketSize}
                            bucketError={state.bucketError}
                            bucketConfig={state.bucketConfig}
                            selectedGroupByLabel={state.selectedGroupByLabel}
                            selectedChartTypeLabel={state.selectedChartTypeLabel}
                            onGroupByChange={actions.setGroupBy}
                            onChartTypeChange={actions.setChartType}
                            onBucketSizeChange={handleBucketSizeChange}
                        />

                        {state.groupBy && state.chartType && (
                            <>
                                <ChartAxisControls
                                    axisOptions={state.axisOptions}
                                    xAxisLabel={state.xAxisLabel}
                                    selectedYAxisLabel={state.selectedYAxisLabel}
                                    xAxisDisabled={state.xAxisDisabled}
                                    onXAxisChange={actions.setXAxis}
                                    onYAxisChange={actions.setYAxis}
                                />
                                <ChartModifierControls
                                    aggregateMode={state.aggregateMode}
                                    sortingMode={state.sortingMode}
                                    chartType={state.chartType}
                                    groupBy={state.groupBy}
                                    tagsCounted={state.tagsCounted}
                                    onAggregateChange={actions.setAggregateMode}
                                    onSortChange={actions.setSortingMode}
                                    onTagsCountedChange={actions.setTagsCounted}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {state.error && (
                    <div className="text-sm text-destructive">{state.error}</div>
                )}

                {state.canRenderChart && (
                    <ChartDataDisplay
                        chartType={state.chartType}
                        loading={state.loading}
                        xAxisLabel={state.xAxisLabel}
                        selectedYAxisLabel={state.selectedYAxisLabel}
                        selectedGroupByLabel={state.selectedGroupByLabel}
                        aggregateMode={state.aggregateMode}
                        bucketDisplayValue={state.bucketDisplayValue}
                        sortedChartData={state.sortedChartData}
                        xAxis={state.xAxis}
                        yAxis={state.yAxis}
                    />
                )}
            </div>
        </div>
    );
}