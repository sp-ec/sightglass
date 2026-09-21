"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import type { uncertaintyBandRow } from "../app-settings-types";

interface Props {
	rows: uncertaintyBandRow[];
	errors: Record<string, string>;
	onChange: (rows: uncertaintyBandRow[]) => void;
}

export function UncertaintyBandList({ rows, errors, onChange }: Props) {
	const updateRow = (uiKey: string, patch: Partial<uncertaintyBandRow>) => {
		onChange(
			rows.map((row) => (row.uiKey === uiKey ? { ...row, ...patch } : row)),
		);
	};

	const addRow = () => {
		onChange([
			...rows,
			{
				uiKey: crypto.randomUUID(),
				reviewCount: 0,
				low: 1,
				high: 1,
				above: false,
			},
		]);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-[auto_8rem_8rem_8rem_auto] items-center gap-2 text-xs text-muted-foreground">
				<span>Applies when</span>
				<span>Reviews</span>
				<span>Low</span>
				<span>High</span>
				<span />
			</div>

			<div className="space-y-2">
				{rows.map((row, index) => {
					const countError = errors[`uncertaintyBands.${index}.reviewCount`];
					const lowError = errors[`uncertaintyBands.${index}.low`];
					const highError = errors[`uncertaintyBands.${index}.high`];

					return (
						<div key={row.uiKey} className="space-y-1">
							<div className="grid grid-cols-[auto_8rem_8rem_8rem_auto] items-center gap-2">
								<ButtonGroup>
									<Button
										variant="outline"
										disabled={!row.above}
										onClick={() => updateRow(row.uiKey, { above: false })}
									>
										Below &amp; Equal (&le;)
									</Button>
									<Button
										variant="outline"
										disabled={row.above}
										onClick={() => updateRow(row.uiKey, { above: true })}
									>
										Above (&gt;)
									</Button>
								</ButtonGroup>
								<Input
									type="number"
									step={1}
									min={0}
									value={row.reviewCount}
									aria-label="Review threshold"
									aria-invalid={Boolean(countError)}
									onChange={(e) =>
										updateRow(row.uiKey, {
											reviewCount: Number(e.target.value),
										})
									}
								/>
								<Input
									type="number"
									step={0.05}
									min={0}
									value={row.low}
									aria-label="Low bound"
									aria-invalid={Boolean(lowError)}
									onChange={(e) =>
										updateRow(row.uiKey, { low: Number(e.target.value) })
									}
								/>
								<Input
									type="number"
									step={0.05}
									min={0}
									value={row.high}
									aria-label="High bound"
									aria-invalid={Boolean(highError)}
									onChange={(e) =>
										updateRow(row.uiKey, { high: Number(e.target.value) })
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
							{(countError || lowError || highError) && (
								<p className="text-xs text-destructive">
									{countError ?? lowError ?? highError}
								</p>
							)}
						</div>
					);
				})}
			</div>

			{errors.uncertaintyBands && (
				<p className="text-xs text-destructive">{errors.uncertaintyBands}</p>
			)}

			<Button variant="outline" onClick={addRow}>
				<Plus />
				Add band
			</Button>
		</div>
	);
}
