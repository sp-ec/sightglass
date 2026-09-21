"use client";

// These formulas are documentation only: nothing computes estimates yet. When
// the estimator is built, re-check this file against it so the two cannot drift.

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "app-settings:formula-open";

// Each tunable term is marked so the editable quantities stand out from the
// fixed structure of the equation
const Term = ({ children }: { children: React.ReactNode }) => (
	<span className="font-medium text-primary">{children}</span>
);

export function EstimationFormula() {
	const [open, setOpen] = React.useState(true);

	React.useEffect(() => {
		try {
			// Opens on a first visit, then remembers the admin's choice
			setOpen(window.localStorage.getItem(STORAGE_KEY) !== "false");
		} catch {
			// Private windows and blocked site data both throw; the default stands
		}
	}, []);

	const onOpenChange = (next: boolean) => {
		setOpen(next);
		try {
			window.localStorage.setItem(STORAGE_KEY, String(next));
		} catch {
			// Not being able to remember the panel state is not worth surfacing
		}
	};

	return (
		<Card>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium">
					How estimates are calculated
					<ChevronDown
						className={cn("size-4 transition-transform", open && "rotate-180")}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="space-y-6 pb-6">
						<div className="space-y-2">
							<p className="text-sm font-medium">Estimated units</p>
							<pre className="overflow-x-auto whitespace-pre rounded-md bg-muted p-4 font-mono text-xs leading-relaxed">
								{"Units = Reviews × "}
								<Term>ReviewMultiplier</Term>
								{"\n\n"}
								<Term>ReviewMultiplier</Term>
								{" = clamp(\n    "}
								<Term>Baseline</Term>
								{" × "}
								<Term>Tag</Term>
								{" × "}
								<Term>Price</Term>
								{" × (Reviews / "}
								<Term>Divisor</Term>
								{") ^ "}
								<Term>Exponent</Term>
								{",\n    "}
								<Term>Min</Term>
								{",\n    "}
								<Term>Max</Term>
								{"\n)"}
							</pre>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Estimated gross revenue</p>
							<pre className="overflow-x-auto whitespace-pre rounded-md bg-muted p-4 font-mono text-xs leading-relaxed">
								{"Gross = Units × Price × RealizedShare × (1 − RefundRate)\n\n"}
								{"RealizedShare = max("}
								<Term>MinMultiplier</Term>
								{", "}
								<Term>StartingMultiplier</Term>
								{" − "}
								<Term>PerYearMultiplier</Term>
								{" × Years)\n"}
								{"RefundRate    = "}
								<Term>RefundRateMin</Term>
								{" + "}
								<Term>RefundRateMultiplier</Term>
								{" × (1 − PositiveReviewPercent)"}
							</pre>
						</div>

						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<span className="font-medium text-foreground">Tag</span>{" "}
								combines the multipliers of every tag a game carries, using the
								Tag Resolution setting below. A game matching no listed tag uses
								1.0.
							</li>
							<li>
								<span className="font-medium text-foreground">Price</span> is
								the multiplier from the first matching price threshold.
							</li>
							<li>
								<span className="font-medium text-foreground">
									RealizedShare
								</span>{" "}
								is what a copy actually sells for after discounts. It decays each
								year since release and bottoms out at the minimum multiplier,
								which is why that floor sits below the starting value.
							</li>
							<li>
								<span className="font-medium text-foreground">Years</span>{" "}
								is the time since the game&apos;s Steam release date.
							</li>
							<li>
								The{" "}
								<span className="font-medium text-foreground">
									uncertainty band
								</span>{" "}
								brackets the finished unit estimate as{" "}
								<span className="font-mono">Units × low</span> to{" "}
								<span className="font-mono">Units × high</span>, picked by review
								count.
							</li>
						</ul>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
