"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import type { priceMultiplierRow } from "../app-settings-types";

interface Props {
	rows: priceMultiplierRow[];
	errors: Record<string, string>;
	onChange: (rows: priceMultiplierRow[]) => void;
}

export function PriceMultiplierList({ rows, errors, onChange }: Props) {
	const updateRow = (uiKey: string, patch: Partial<priceMultiplierRow>) => {
		onChange(
			rows.map((row) => (row.uiKey === uiKey ? { ...row, ...patch } : row)),
		);
	};

	const addRow = () => {
		onChange([
			...rows,
			{
				uiKey: crypto.randomUUID(),
				priceInCents: 0,
				multiplier: 1,
				above: false,
			},
		]);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				{rows.map((row, index) => {
					const priceError = errors[`priceMultipliers.${index}.priceInCents`];
					const multError = errors[`priceMultipliers.${index}.multiplier`];

					return (
						<div key={row.uiKey} className="space-y-1">
							<div className="grid grid-cols-[auto_8rem_8rem_auto] items-center gap-2">
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
								{/* Stored as cents to match games.price_in_cents, shown as dollars */}
								<Input
									type="number"
									step={0.01}
									min={0}
									value={row.priceInCents / 100}
									aria-label="Price threshold in dollars"
									aria-invalid={Boolean(priceError)}
									onChange={(e) =>
										updateRow(row.uiKey, {
											priceInCents: Math.round(Number(e.target.value) * 100),
										})
									}
								/>
								<Input
									type="number"
									step={0.05}
									min={0}
									value={row.multiplier}
									aria-label="Multiplier"
									aria-invalid={Boolean(multError)}
									onChange={(e) =>
										updateRow(row.uiKey, { multiplier: Number(e.target.value) })
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
							{(priceError || multError) && (
								<p className="text-xs text-destructive">
									{priceError ?? multError}
								</p>
							)}
						</div>
					);
				})}
			</div>

			{errors.priceMultipliers && (
				<p className="text-xs text-destructive">{errors.priceMultipliers}</p>
			)}

			<Button variant="outline" onClick={addRow}>
				<Plus />
				Add price
			</Button>
		</div>
	);
}
