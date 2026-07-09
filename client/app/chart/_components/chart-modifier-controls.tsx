import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { ListSortDescending, ListSortAscending, Menu } from "lucide-react";
import { QuestionTooltip } from "@/components/util/question-tooltip";

interface Props {
    aggregateMode: "average" | "median";
    sortingMode: "flat" | "ascending" | "descending";
    chartType: string;
    groupBy: string;
    tagsCounted: number | null;
    onAggregateChange: (mode: "average" | "median") => void;
    onSortChange: (mode: "flat" | "ascending" | "descending") => void;
    onTagsCountedChange: (count: number) => void;
}

export function ChartModifierControls({
    aggregateMode,
    sortingMode,
    chartType,
    groupBy,
    tagsCounted,
    onAggregateChange,
    onSortChange,
    onTagsCountedChange,
}: Props) {
    const disableSort = chartType === "scatter";

    return (
        <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
                <p className="text-sm font-medium">Aggregate Mode</p>
                <ButtonGroup>
                    <Button
                        variant="outline"
                        disabled={aggregateMode === "average"}
                        onClick={() => onAggregateChange("average")}
                    >
                        Average
                    </Button>
                    <Button
                        variant="outline"
                        disabled={aggregateMode === "median"}
                        onClick={() => onAggregateChange("median")}
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
                        disabled={sortingMode === "flat" || disableSort}
                        onClick={() => onSortChange("flat")}
                    >
                        <Menu />
                    </Button>
                    <Button
                        variant="outline"
                        disabled={sortingMode === "ascending" || disableSort}
                        onClick={() => onSortChange("ascending")}
                    >
                        <ListSortAscending />
                    </Button>
                    <Button
                        variant="outline"
                        disabled={sortingMode === "descending" || disableSort}
                        onClick={() => onSortChange("descending")}
                    >
                        <ListSortDescending />
                    </Button>
                </ButtonGroup>
            </div>
            {groupBy === "tag" && (
                <div className="space-y-2">
                    <p className="text-sm font-medium flex flex-row gap-1">
                        Tags Counted{" "}
                        <QuestionTooltip message="The number of tags, sorted by weight, to include when aggregating data." />
                    </p>
                    <Input
                        type="number"
                        min={1}
                        max={1000}
                        step={1}
                        value={tagsCounted ?? 0}
                        onChange={(e) => onTagsCountedChange(Number(e.target.value))}
                    />
                </div>
            )}
        </div>
    );
}