"use client";

import { Input } from "@/components/ui/input";
import { QuestionTooltip } from "@/components/util/question-tooltip";

interface Props {
	label: string;
	value: number;
	onChange: (value: number) => void;
	step?: number;
	min?: number;
	max?: number;
	hint?: string;
	error?: string;
}

export function NumberField({
	label,
	value,
	onChange,
	step = 0.01,
	min,
	max,
	hint,
	error,
}: Props) {
	return (
		<div className="space-y-2">
			<p className="flex flex-row gap-1 text-sm font-medium">
				{label} {hint && <QuestionTooltip message={hint} />}
			</p>
			<Input
				type="number"
				step={step}
				min={min}
				max={max}
				value={value}
				aria-invalid={Boolean(error)}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
