import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { QuestionTooltip } from "@/components/util/question-tooltip";
import { ChartFilterChipSelect } from "@/app/(app)/chart/_components/chart-filter-chip-select";
import {
  ChartFilterMode,
  ChartFilters,
  FilterOption,
  PERCENT_POSITIVE_MAX,
  PERCENT_POSITIVE_MIN,
  RangeInput,
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

interface RangeFieldProps {
  label: string;
  type: "number" | "date";
  value: RangeInput;
  step?: number;
  min?: number;
  tooltip?: string;
  onChange: (value: RangeInput) => void;
}

// The native calendar indicator crowds the value at the panel's width
const DATE_INPUT_CLASSNAME =
  "px-1.5 text-[0.625rem] md:text-[0.625rem] [&::-webkit-calendar-picker-indicator]:size-3 [&::-webkit-calendar-picker-indicator]:p-0";

function RangeField({
  label,
  type,
  value,
  step,
  min,
  tooltip,
  onChange,
}: RangeFieldProps) {
  const inputClassName = type === "date" ? DATE_INPUT_CLASSNAME : undefined;

  return (
    <div className="space-y-2">
      <p className="flex flex-row gap-1 text-sm font-medium">
        {label} {tooltip && <QuestionTooltip message={tooltip} />}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          step={step}
          min={min}
          className={inputClassName}
          placeholder="Min"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type={type}
          step={step}
          min={min}
          className={inputClassName}
          placeholder="Max"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
        />
      </div>
    </div>
  );
}

export function ChartFilterPanel({
  filters,
  tagOptions,
  languageOptions,
  activeFilterCount,
  onFilterChange,
  onReset,
}: Props) {
  const [percentMin, percentMax] = filters.percentPositive;

  return (
    <Card className="w-full shrink-0 lg:w-72">
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

        <div className="space-y-2">
          <p className="flex flex-row gap-1 text-sm font-medium">
            Is Demo{" "}
            <QuestionTooltip message="Limit results to games that are, or are not, demos." />
          </p>
          <ButtonGroup className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={filters.isDemo === null}
              onClick={() => onFilterChange("isDemo", null)}
            >
              Any
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={filters.isDemo === true}
              onClick={() => onFilterChange("isDemo", true)}
            >
              True
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={filters.isDemo === false}
              onClick={() => onFilterChange("isDemo", false)}
            >
              False
            </Button>
          </ButtonGroup>
        </div>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Positive Reviews</p>
            <span className="text-xs text-muted-foreground">
              {percentMin}% - {percentMax}%
            </span>
          </div>
          <Slider
            min={PERCENT_POSITIVE_MIN}
            max={PERCENT_POSITIVE_MAX}
            step={1}
            value={filters.percentPositive}
            onValueChange={(value) =>
              onFilterChange(
                "percentPositive",
                value as ChartFilters["percentPositive"],
              )
            }
          />
        </div>

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
