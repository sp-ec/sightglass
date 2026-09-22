"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import {
	COMPAT_LABELS,
	type GameBasicInfo,
	type GamePlatforms,
	type NamedEntity,
	type RelatedApp,
} from "../game-detail-types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-b-0">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="text-sm break-words">{value}</dd>
		</div>
	);
}

const names = (list: NamedEntity[] | null): string =>
	list?.length ? list.map((item) => item.name).join(", ") : "—";

const dateTime = (value: string | null): string =>
	value ? new Date(value).toLocaleString() : "—";

interface Props {
	game: GameBasicInfo;
	platforms: GamePlatforms;
	developers: NamedEntity[] | null;
	publishers: NamedEntity[] | null;
	isDemo: boolean;
	parentApp: RelatedApp;
	demoApp: RelatedApp;
}

export function GameInfoPanel({
	game,
	platforms,
	developers,
	publishers,
	isDemo,
	parentApp,
	demoApp,
}: Props) {
	// A demo points back at its full game; a full game points at its demo
	const related = isDemo ? parentApp : demoApp;
	const relatedLabel = isDemo ? "Full game" : "Demo";

	const osCompat = platforms?.steam_os_compat_category;
	const deckCompat = platforms?.steam_deck_compat_category;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Details</CardTitle>
				</CardHeader>
				<CardContent>
					<dl>
						<Row label="App ID" value={game.app_id} />
						<Row label="Developers" value={names(developers)} />
						<Row label="Publishers" value={names(publishers)} />
						<Row
							label="Release date"
							value={
								game.steam_release_date
									? new Date(game.steam_release_date).toLocaleString()
									: "—"
							}
						/>
						<Row
							label="Price"
							value={
								game.price_in_cents && game.price_in_cents > 0
									? formatPrice(game.price_in_cents)
									: "Free"
							}
						/>
						<Row
							label="Content rating"
							value={
								game.rating
									? `${game.rating}${game.rating_type ? ` (${game.rating_type})` : ""}`
									: "—"
							}
						/>
						<Row
							label="Steam Deck"
							value={
								deckCompat != null ? (COMPAT_LABELS[deckCompat] ?? "—") : "—"
							}
						/>
						<Row
							label="SteamOS"
							value={osCompat != null ? (COMPAT_LABELS[osCompat] ?? "—") : "—"}
						/>
						<Row label="Last synced" value={dateTime(game.last_updated)} />
						{game.store_url && (
							<Row label="Store path" value={game.store_url} />
						)}
					</dl>
				</CardContent>
			</Card>

			{related && (
				<Card>
					<CardHeader>
						<CardTitle>{relatedLabel}</CardTitle>
					</CardHeader>
					<CardContent>
						<Link
							href={`/games/${related.app_id}`}
							className="flex flex-row items-center gap-1 text-sm underline underline-offset-4"
						>
							{related.name}
							<ArrowUpRight className="size-4 shrink-0" />
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
