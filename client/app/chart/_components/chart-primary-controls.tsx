import { z } from "zod";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { QuestionTooltip } from "@/components/util/question-tooltip";
import { GROUP_BY_OPTIONS, CHART_TYPES, BUCKET_CONFIGS } from "@/components/charts/chart-types";

const bucketSchema = z.number().finite().int().positive();

interface Props {
    groupBy: string;
    chartType: string;
    bucketSize: string;
    bucketError: string | null;
    bucketConfig: any;
    selectedGroupByLabel: string;
    selectedChartTypeLabel: string;
    onGroupByChange: (value: any) => void;
    onChartTypeChange: (value: any) => void;
    onBucketSizeChange: (value: string, config: any) => void;
}

export function ChartPrimaryControls({
    groupBy,
    chartType,
    bucketSize,
    bucketError,
    bucketConfig,
    selectedGroupByLabel,
    selectedChartTypeLabel,
    onGroupByChange,
    onChartTypeChange,
    onBucketSizeChange,
}: Props) {
    const handleGroupBySelect = (value: string) => {
        onGroupByChange(value);
        onChartTypeChange("");
    
        const config = BUCKET_CONFIGS[value as keyof typeof BUCKET_CONFIGS];
        onBucketSizeChange(String(config.min), config);
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
                <p className="text-sm font-medium">Group By</p>
                <Combobox items={GROUP_BY_OPTIONS}>
                    <ComboboxInput placeholder="Choose a group" value={selectedGroupByLabel} />
                    <ComboboxContent>
                        <ComboboxEmpty>No group options found.</ComboboxEmpty>
                        <ComboboxList>
                            {GROUP_BY_OPTIONS.map((option) => (
                                <ComboboxItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleGroupBySelect(option.value)}
                                    onClick={() => handleGroupBySelect(option.value)}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        handleGroupBySelect(option.value);
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
                        <ComboboxInput placeholder="Choose a chart type" value={selectedChartTypeLabel} />
                        <ComboboxContent>
                            <ComboboxEmpty>No chart types found.</ComboboxEmpty>
                            <ComboboxList>
                                {CHART_TYPES.map((option) => (
                                    <ComboboxItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => onChartTypeChange(option.value)}
                                        onClick={() => onChartTypeChange(option.value)}
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            onChartTypeChange(option.value);
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
                    <p className="text-sm font-medium flex flex-row gap-1">
                        Bucket Size{" "}
                        <QuestionTooltip message="The range of values to include in each bucket." />
                    </p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={bucketConfig.min}
                            max={bucketConfig.max}
                            step={bucketConfig.step}
                            value={bucketSize}
                            disabled={bucketConfig.locked}
                            onChange={(e) => onBucketSizeChange(e.target.value, bucketConfig)}
                        />
                        {bucketConfig.unit && (
                            <span className="text-sm text-muted-foreground">{bucketConfig.unit}</span>
                        )}
                    </div>
                    {bucketError && <p className="text-xs text-destructive">{bucketError}</p>}
                </div>
            )}
        </div>
    );
}