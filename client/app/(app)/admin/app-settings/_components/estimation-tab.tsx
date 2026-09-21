"use client";

import * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { estimationSchema } from "../app-settings-schema";
import { useAppSettingsSection } from "../_hooks/use-app-settings-section";
import { EstimationFormula } from "./estimation-formula";
import { NumberField } from "./number-field";
import { PriceMultiplierList } from "./price-multiplier-list";
import { TagMultiplierList } from "./tag-multiplier-list";
import { UncertaintyBandList } from "./uncertainty-band-list";
import type {
	appSettingsView,
	estimationForm,
	estimationSettings,
	tagOption,
} from "../app-settings-types";

interface Props {
	initial: estimationSettings | null;
	tagOptions: tagOption[];
	onSaved: (saved: appSettingsView) => void;
}

// Rows get a stable ui key on load so React identity survives a removal; the
// server ids are not usable for that because unsaved rows have none
const toForm = (settings: estimationSettings): estimationForm => ({
	reviewMultiplier: settings.reviewMultiplier,
	audience: settings.audience,
	tagResolution: settings.tagResolution,
	realizedPrice: settings.realizedPrice,
	tagMultipliers: settings.tagMultipliers.map((row) => ({
		uiKey: `tag-${row.tagId}`,
		tagId: row.tagId,
		mult: row.mult,
	})),
	priceMultipliers: settings.priceMultipliers.map((row) => ({
		uiKey: `price-${row.id}`,
		priceInCents: row.priceInCents,
		multiplier: row.multiplier,
		above: row.above,
	})),
	uncertaintyBands: settings.uncertaintyBands.map((row) => ({
		uiKey: `band-${row.id}`,
		reviewCount: row.reviewCount,
		low: row.low,
		high: row.high,
		above: row.above,
	})),
});

const toPayload = (value: estimationForm) => ({
	reviewMultiplier: value.reviewMultiplier,
	audience: value.audience,
	tagResolution: value.tagResolution,
	realizedPrice: value.realizedPrice,
	tagMultipliers: value.tagMultipliers.map(({ tagId, mult }) => ({
		tagId,
		mult,
	})),
	priceMultipliers: value.priceMultipliers.map(
		({ priceInCents, multiplier, above }) => ({
			priceInCents,
			multiplier,
			above,
		}),
	),
	uncertaintyBands: value.uncertaintyBands.map(
		({ reviewCount, low, high, above }) => ({ reviewCount, low, high, above }),
	),
});

export function EstimationTab({ initial, tagOptions, onSaved }: Props) {
	const form = React.useMemo(
		() => (initial === null ? null : toForm(initial)),
		[initial],
	);

	const section = useAppSettingsSection({
		section: "estimation",
		initial: form,
		schema: estimationSchema,
		toPayload,
		onSaved,
	});

	const { value, update, dirty, errors, formError, saving, saved, save } =
		section;

	if (value === null) {
		return null;
	}

	return (
		<div className="space-y-6">
			<EstimationFormula />

			<Card>
				<CardHeader>
					<CardTitle>Review-to-sales multiplier</CardTitle>
					<CardDescription>
						Turns review count into unit sales. The clamp keeps outliers from
						running away.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<NumberField
						label="Baseline"
						value={value.reviewMultiplier.baseline}
						step={1}
						error={errors["reviewMultiplier.baseline"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								reviewMultiplier: { ...current.reviewMultiplier, baseline: next },
							}))
						}
					/>
					<NumberField
						label="Minimum"
						value={value.reviewMultiplier.min}
						step={1}
						error={errors["reviewMultiplier.min"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								reviewMultiplier: { ...current.reviewMultiplier, min: next },
							}))
						}
					/>
					<NumberField
						label="Maximum"
						value={value.reviewMultiplier.max}
						step={1}
						error={errors["reviewMultiplier.max"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								reviewMultiplier: { ...current.reviewMultiplier, max: next },
							}))
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Audience size</CardTitle>
					<CardDescription>
						Dampens the multiplier for games with very large review counts:
						(Reviews / Divisor) ^ Exponent.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<NumberField
						label="Divisor"
						value={value.audience.divisor}
						step={1}
						min={1}
						error={errors["audience.divisor"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								audience: { ...current.audience, divisor: next },
							}))
						}
					/>
					<NumberField
						label="Exponent"
						value={value.audience.exponent}
						step={0.005}
						error={errors["audience.exponent"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								audience: { ...current.audience, exponent: next },
							}))
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tag multipliers</CardTitle>
					<CardDescription>
						Scales the estimate by genre. Tag Resolution decides what happens
						when a game matches several rows.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TagMultiplierList
						rows={value.tagMultipliers}
						tagOptions={tagOptions}
						resolution={value.tagResolution}
						errors={errors}
						onResolutionChange={(next) =>
							update((current) => ({ ...current, tagResolution: next }))
						}
						onChange={(rows) =>
							update((current) => ({ ...current, tagMultipliers: rows }))
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Price multipliers</CardTitle>
					<CardDescription>
						Cheaper games convert more reviews per sale. The first matching
						threshold applies.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PriceMultiplierList
						rows={value.priceMultipliers}
						errors={errors}
						onChange={(rows) =>
							update((current) => ({ ...current, priceMultipliers: rows }))
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Realized price per unit</CardTitle>
					<CardDescription>
						What a copy actually sells for after discounts and refunds — Price ×
						RealizedShare × (1 − RefundRate).
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<NumberField
						label="Min multiplier"
						value={value.realizedPrice.minMultiplier}
						hint="The floor the yearly decay bottoms out at, so it sits below the starting multiplier."
						error={errors["realizedPrice.minMultiplier"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								realizedPrice: { ...current.realizedPrice, minMultiplier: next },
							}))
						}
					/>
					<NumberField
						label="Starting multiplier"
						value={value.realizedPrice.startingMultiplier}
						error={errors["realizedPrice.startingMultiplier"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								realizedPrice: {
									...current.realizedPrice,
									startingMultiplier: next,
								},
							}))
						}
					/>
					<NumberField
						label="Per year multiplier"
						value={value.realizedPrice.perYearMultiplier}
						step={0.005}
						hint="Subtracted from the starting multiplier for each year since release."
						error={errors["realizedPrice.perYearMultiplier"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								realizedPrice: {
									...current.realizedPrice,
									perYearMultiplier: next,
								},
							}))
						}
					/>
					<NumberField
						label="Refund rate min"
						value={value.realizedPrice.refundRateMin}
						step={0.005}
						hint="The refund rate assumed even for a game with entirely positive reviews."
						error={errors["realizedPrice.refundRateMin"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								realizedPrice: { ...current.realizedPrice, refundRateMin: next },
							}))
						}
					/>
					<NumberField
						label="Refund rate multiplier"
						value={value.realizedPrice.refundRateMultiplier}
						step={0.005}
						hint="Scaled by the share of negative reviews and added to the minimum."
						error={errors["realizedPrice.refundRateMultiplier"]}
						onChange={(next) =>
							update((current) => ({
								...current,
								realizedPrice: {
									...current.realizedPrice,
									refundRateMultiplier: next,
								},
							}))
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Uncertainty band</CardTitle>
					<CardDescription>
						Low and high bounds applied to the finished unit estimate, chosen by
						review count.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<UncertaintyBandList
						rows={value.uncertaintyBands}
						errors={errors}
						onChange={(rows) =>
							update((current) => ({ ...current, uncertaintyBands: rows }))
						}
					/>
				</CardContent>
				<CardFooter className="flex items-center gap-3">
					<Button onClick={() => void save()} disabled={!dirty || saving}>
						{saving && <Spinner />}
						{saving ? "Saving..." : "Save"}
					</Button>
					{saved && <span className="text-sm text-muted-foreground">Saved</span>}
					{formError && (
						<span role="alert" className="text-sm text-destructive">
							{formError}
						</span>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
