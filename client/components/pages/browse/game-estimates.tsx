import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionTooltip } from "@/components/util/question-tooltip";
import { formatCents, formatCount } from "@/lib/utils";

type GameEstimate = {
	units: number;
	units_low: number;
	units_high: number;
	revenue_in_cents: number;
};

function GameEstimates({ estimate }: { estimate: GameEstimate | null }) {
	if (!estimate) {
		return <></>;
	}

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle className="flex flex-row items-center gap-1">
					Estimates
					<QuestionTooltip message="Derived from review count, price, tags and age using the formula under Administration > App Settings. These are estimates, not measurements." />
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div>
					<p className="text-sm text-muted-foreground">Units sold</p>
					<p className="text-lg">{formatCount(estimate.units)}</p>
					<p className="text-sm text-muted-foreground">
						{formatCount(estimate.units_low)} –{" "}
						{formatCount(estimate.units_high)}
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Gross revenue</p>
					<p className="text-lg">{formatCents(estimate.revenue_in_cents)}</p>
				</div>
			</CardContent>
		</Card>
	);
}

export default GameEstimates;
