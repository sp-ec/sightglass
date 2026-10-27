"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, ThumbsDown, ThumbsUp, Meh, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCount, formatPrice } from "@/lib/utils";
import type { GameListEntry } from "../games-list-types";

const formatReleaseDate = (value: string): string =>
	new Date(value).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

// Indexed by review_score, matching game-review-summary.tsx
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

export function GameListRow({ game }: { game: GameListEntry }) {
	const tone = reviewTone[game.review_score ?? 0] ?? reviewTone[0];
	const ToneIcon = tone.icon;
	const hasReviews = (game.review_count ?? 0) > 0;

	// Steam does not ship every capsule, so a missing or broken main capsule
	// falls back to the header before the placeholder
	const [failedSrcs, setFailedSrcs] = React.useState<string[]>([]);
	const capsule =
		[game.main_capsule, game.header].find(
			(src): src is string => !!src && !failedSrcs.includes(src),
		) ?? null;

	return (
		<Card className="p-0 transition-colors hover:border-sky-500/60">
			<Link
				href={`/games/${game.app_id}`}
				className="flex flex-col gap-4 p-4 sm:flex-row"
			>
				<div className="relative w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[231px]">
					{capsule ? (
						<Image
							key={capsule}
							src={capsule}
							alt=""
							fill
							sizes="231px"
							className="object-cover"
							onError={() =>
								setFailedSrcs((current) => [...current, capsule])
							}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground">
							<ImageOff className="size-5" />
						</div>
					)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-medium">{game.name}</h3>
						{game.is_demo && <Badge variant="secondary">Demo</Badge>}
					</div>

					<p className="line-clamp-2 text-sm text-muted-foreground">
						{game.short_description || "No description available."}
					</p>

					{game.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{game.tags.map((tag) => (
								<Badge key={tag} variant="outline">
									{tag}
								</Badge>
							))}
						</div>
					)}

					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
						<span className="text-muted-foreground">
							{formatCount(game.review_count ?? 0)}{" "}
							{game.review_count === 1 ? "review" : "reviews"}
						</span>
						{hasReviews && (
							<span className={`flex items-center gap-1.5 ${tone.text}`}>
								<ToneIcon className="size-4" />
								{game.percent_positive}% positive
							</span>
						)}
						<span className="text-muted-foreground">
							{game.steam_release_date
								? formatReleaseDate(game.steam_release_date)
								: "Unknown"}
						</span>
						{game.price_in_cents != null && (
							<span className="font-medium">
								{game.price_in_cents > 0
									? formatPrice(game.price_in_cents)
									: "Free"}
							</span>
						)}
					</div>
				</div>
			</Link>
		</Card>
	);
}
