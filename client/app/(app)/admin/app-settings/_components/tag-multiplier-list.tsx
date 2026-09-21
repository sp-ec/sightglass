"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type {
	tagMultiplierRow,
	tagOption,
	tagResolution,
} from "../app-settings-types";
import { QuestionTooltip } from "@/components/util/question-tooltip";

interface Props {
	rows: tagMultiplierRow[];
	tagOptions: tagOption[];
	resolution: tagResolution;
	errors: Record<string, string>;
	onResolutionChange: (value: tagResolution) => void;
	onChange: (rows: tagMultiplierRow[]) => void;
}

const RESOLUTIONS: { value: tagResolution; label: string }[] = [
	{ value: "average", label: "Average" },
	{ value: "minimum", label: "Minimum" },
	{ value: "maximum", label: "Maximum" },
];

export function TagMultiplierList({
	rows,
	tagOptions,
	resolution,
	errors,
	onResolutionChange,
	onChange,
}: Props) {
	const nameById = new Map(tagOptions.map((tag) => [tag.id, tag.name]));

	const updateRow = (uiKey: string, patch: Partial<tagMultiplierRow>) => {
		onChange(
			rows.map((row) => (row.uiKey === uiKey ? { ...row, ...patch } : row)),
		);
	};

	const addRow = () => {
		onChange([
			...rows,
			{ uiKey: crypto.randomUUID(), tagId: 0, mult: 1 },
		]);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<p className="flex flex-row gap-1 text-sm font-medium">Tag Resolution <QuestionTooltip message="How to combine the multipliers when a game carries more than one of these tags." /></p>
				
				<ButtonGroup>
					{RESOLUTIONS.map((option) => (
						<Button
							key={option.value}
							variant="outline"
							disabled={resolution === option.value}
							onClick={() => onResolutionChange(option.value)}
						>
							{option.label}
						</Button>
					))}
				</ButtonGroup>
			</div>

			{tagOptions.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No tags available — run a Steam sync first.
				</p>
			)}

			<div className="space-y-2">
				{rows.map((row, index) => {
					// Tags already spoken for elsewhere are hidden from this row's picker
					const taken = new Set(
						rows.filter((r) => r.uiKey !== row.uiKey).map((r) => r.tagId),
					);
					const available = tagOptions.filter((tag) => !taken.has(tag.id));
					const tagError = errors[`tagMultipliers.${index}.tagId`];
					const multError = errors[`tagMultipliers.${index}.mult`];

					return (
						<div key={row.uiKey} className="space-y-1">
							<div className="grid grid-cols-[1fr_8rem_auto] items-center gap-2">
								<Combobox items={available}>
									<ComboboxInput
										placeholder="Choose a tag"
										value={nameById.get(row.tagId) ?? ""}
									/>
									<ComboboxContent>
										<ComboboxEmpty>No tags found.</ComboboxEmpty>
										<ComboboxList>
											{available.map((tag) => (
												<ComboboxItem
													key={tag.id}
													value={tag.name}
													onSelect={() => updateRow(row.uiKey, { tagId: tag.id })}
													onClick={() => updateRow(row.uiKey, { tagId: tag.id })}
													onPointerDown={(e) => {
														e.preventDefault();
														updateRow(row.uiKey, { tagId: tag.id });
													}}
												>
													{tag.name}
												</ComboboxItem>
											))}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
								<Input
									type="number"
									step={0.05}
									min={0}
									value={row.mult}
									aria-label="Multiplier"
									aria-invalid={Boolean(multError)}
									onChange={(e) =>
										updateRow(row.uiKey, { mult: Number(e.target.value) })
									}
								/>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Remove row"
									onClick={() =>
										onChange(rows.filter((r) => r.uiKey !== row.uiKey))
									}
								>
									<Trash2 />
								</Button>
							</div>
							{(tagError || multError) && (
								<p className="text-xs text-destructive">
									{tagError ?? multError}
								</p>
							)}
						</div>
					);
				})}
			</div>

			{errors.tagMultipliers && (
				<p className="text-xs text-destructive">{errors.tagMultipliers}</p>
			)}

			<Button variant="outline" onClick={addRow}>
				<Plus />
				Add tag
			</Button>
		</div>
	);
}
