import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DemoFilterField,
  PercentPositiveField,
  RangeField,
} from "@/components/filters/filter-fields";
import { ChartFilterChipSelect } from "@/app/(app)/chart/_components/chart-filter-chip-select";
import {
  ChartFilterMode,
  ChartFilters,
  FilterOption,
} from "@/components/charts/chart-types";

interface Props {
  filters: ChartFilters;
  tagOptions: FilterOption[];
  languageOptions: FilterOption[];
  activeFilterCount: number;
  onFilterChange: <Key extends keyof ChartFilters>(
    key: Key,
    value: ChartFilters[Key],
  ) => void;
  onReset: () => void;
}

// The native calendar indicator crowds the value at the panel's width
const DATE_INPUT_CLASSNAME =
  "px-1.5 text-[0.625rem] md:text-[0.625rem] [&::-webkit-calendar-picker-indicator]:size-3 [&::-webkit-calendar-picker-indicator]:p-0";

export function ChartFilterPanel({
  filters,
  tagOptions,
  languageOptions,
  activeFilterCount,
  onFilterChange,
  onReset,
}: Props) {
  return (
    <Card className="w-full shrink-0 lg:w-80">
      <CardHeader>
        <CardTitle>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {activeFilterCount} active
            </span>
          )}
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            disabled={activeFilterCount === 0}
            onClick={onReset}
          >
            Reset
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RangeField
          label="Release Date"
          type="date"
          inputClassName={DATE_INPUT_CLASSNAME}
          value={filters.releaseDate}
          onChange={(value) => onFilterChange("releaseDate", value)}
        />

        <Separator />

        <RangeField
          label="Price"
          type="number"
          min={0}
          step={1}
          tooltip="Price in dollars."
          value={filters.price}
          onChange={(value) => onFilterChange("price", value)}
        />

        <Separator />

        <DemoFilterField
          value={filters.isDemo}
          onChange={(value) => onFilterChange("isDemo", value)}
        />

        <Separator />

        <ChartFilterChipSelect
          label="Tags"
          placeholder="Select tags"
          options={tagOptions}
          selectedIds={filters.tags}
          mode={filters.tagsMode}
          onSelectionChange={(ids) => onFilterChange("tags", ids)}
          onModeChange={(mode: ChartFilterMode) =>
            onFilterChange("tagsMode", mode)
          }
        />

        <Separator />

        <ChartFilterChipSelect
          label="Supported Languages"
          placeholder="Select languages"
          options={languageOptions}
          selectedIds={filters.languages}
          mode={filters.languagesMode}
          onSelectionChange={(ids) => onFilterChange("languages", ids)}
          onModeChange={(mode: ChartFilterMode) =>
            onFilterChange("languagesMode", mode)
          }
        />

        <Separator />

        <PercentPositiveField
          value={filters.percentPositive}
          onChange={(value) => onFilterChange("percentPositive", value)}
        />

        <Separator />

        <RangeField
          label="Review Count"
          type="number"
          min={0}
          step={1}
          value={filters.reviewCount}
          onChange={(value) => onFilterChange("reviewCount", value)}
        />
      </CardContent>
    </Card>
  );
}
