"use client";

import { Card, CardContent } from "@/components/ui/card";
import { QuestionTooltip } from "@/components/util/question-tooltip";

export function StatTile({
	label,
	value,
	sub,
	tooltip,
	className,
}: {
	label: string;
	value: string;
	sub?: React.ReactNode;
	tooltip?: string;
	className?: string;
}) {
	return (
		<Card className="gap-0 py-4">
			<CardContent className="px-4">
				<p className="flex flex-row items-center gap-1 text-sm text-muted-foreground">
					{label}
					{tooltip && <QuestionTooltip message={tooltip} />}
				</p>
				<p className={`mt-1 text-2xl font-semibold ${className ?? ""}`}>
					{value}
				</p>
				{sub && (
					<div className="mt-1 text-sm text-muted-foreground">{sub}</div>
				)}
			</CardContent>
		</Card>
	);
}
