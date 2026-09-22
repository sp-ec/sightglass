"use client";

import { InfoIcon, Meh, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionTooltip } from "@/components/util/question-tooltip";
import { formatCents, formatCount } from "@/lib/utils";
import type { GameEstimate, GameReviews } from "../game-detail-types";

// Indexed by Steam's review_score, 0 through 9
const reviewTone = [
	{ text: "text-muted-foreground", icon: InfoIcon },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-yellow-400", icon: Meh },
	{ text: "text-lime-400", icon: ThumbsUp },
	{ text: "text-lime-400", icon: ThumbsUp },
	{ text: "text-green-400", icon: ThumbsUp },
	{ text: "text-green-400", icon: ThumbsUp },
];

function Tile({
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

interface Props {
	reviews: GameReviews;
	estimate: GameEstimate;
	priceInCents: number | null;
}

export function GameStats({ reviews, estimate, priceInCents }: Props) {
	const isFree = !priceInCents || priceInCents <= 0;
	const tone = reviewTone[reviews?.review_score ?? 0] ?? reviewTone[0];
	const ToneIcon = tone.icon;

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Tile
				label="Reviews"
				value={formatCount(reviews?.review_count ?? 0)}
				sub={
					reviews?.review_score_label ? (
						<span className={`flex items-center gap-1.5 ${tone.text}`}>
							<ToneIcon className="size-4" />
							{reviews.review_score_label}
						</span>
					) : null
				}
			/>
			<Tile
				label="Positive"
				value={
					reviews?.percent_positive != null
						? `${reviews.percent_positive}%`
						: "—"
				}
				className={tone.text}
			/>
			<Tile
				label="Est. Units Sold"
				value={estimate ? formatCount(estimate.units) : "—"}
				tooltip="Estimated from review count, price, tags and age using the formula under Administration > App Settings."
				sub={
					estimate
						? `${formatCount(estimate.units_low)} – ${formatCount(estimate.units_high)}`
						: null
				}
			/>
			<Tile
				label="Est. Gross Revenue"
				value={estimate ? formatCents(estimate.revenue_in_cents) : "—"}
				tooltip="Estimated units multiplied by price, adjusted for discounts over time and refunds."
				// A free game really does earn nothing from unit sales, but a bare
				// $0 beside millions of units reads like a failure rather than a fact
				sub={isFree ? "Free-to-play, so no unit revenue" : null}
			/>
		</div>
	);
}
