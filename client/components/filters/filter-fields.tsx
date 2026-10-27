import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { QuestionTooltip } from "@/components/util/question-tooltip";
import {
	ChartFilters,
	PERCENT_POSITIVE_MAX,
	PERCENT_POSITIVE_MIN,
	RangeInput,
} from "@/components/charts/chart-types";

interface RangeFieldProps {
	label: string;
	type: "number" | "date";
	value: RangeInput;
	step?: number;
	min?: number;
	tooltip?: string;
	inputClassName?: string;
	onChange: (value: RangeInput) => void;
}

export function RangeField({
	label,
	type,
	value,
	step,
	min,
	tooltip,
	inputClassName,
	onChange,
}: RangeFieldProps) {
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

interface DemoFieldProps {
	value: boolean | null;
	onChange: (value: boolean | null) => void;
}

const DEMO_OPTIONS = [
	{ label: "Any", value: null },
	{ label: "True", value: true },
	{ label: "False", value: false },
] as const;

export function DemoFilterField({ value, onChange }: DemoFieldProps) {
	return (
		<div className="space-y-2">
			<p className="flex flex-row gap-1 text-sm font-medium">
				Is Demo{" "}
				<QuestionTooltip message="Limit results to games that are, or are not, demos." />
			</p>
			<ButtonGroup className="w-full">
				{DEMO_OPTIONS.map((option) => (
					<Button
						key={option.label}
						variant="outline"
						size="sm"
						className="flex-1"
						disabled={value === option.value}
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</Button>
				))}
			</ButtonGroup>
		</div>
	);
}

interface PercentPositiveFieldProps {
	value: ChartFilters["percentPositive"];
	onChange: (value: ChartFilters["percentPositive"]) => void;
}

export function PercentPositiveField({
	value,
	onChange,
}: PercentPositiveFieldProps) {
	const [percentMin, percentMax] = value;

	return (
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
				value={value}
				onValueChange={(next) =>
					onChange(next as ChartFilters["percentPositive"])
				}
			/>
		</div>
	);
}
