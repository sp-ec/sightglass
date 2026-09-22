"use client";

import { ExternalLink } from "lucide-react";
import { FaWindows, FaApple, FaLinux } from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { AssetImage } from "./asset-image";
import {
	COMPAT_LABELS,
	type GameAssets,
	type GameBasicInfo,
	type GamePlatforms,
	type NamedEntity,
} from "../game-detail-types";

interface Props {
	game: GameBasicInfo;
	assets: GameAssets;
	platforms: GamePlatforms;
	developers: NamedEntity[] | null;
	publishers: NamedEntity[] | null;
	isDemo: boolean;
}

const formatDate = (value: string | null): string =>
	value
		? new Date(value).toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Unknown release date";

export function GameHero({
	game,
	assets,
	platforms,
	developers,
	publishers,
	isDemo,
}: Props) {
	const deckCompat = platforms?.steam_deck_compat_category;
	const byline = [
		developers?.map((d) => d.name).join(", "),
		publishers?.map((p) => p.name).join(", "),
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<section className="relative overflow-hidden rounded-xl border">
			{/* Decorative backdrop; hidden entirely when Steam has none */}
			<div className="absolute inset-0 -z-10">
				<AssetImage
					src={assets?.page_background ?? null}
					alt=""
					hideOnError
					sizes="100vw"
					className="scale-110 blur-xl opacity-40"
				/>
			</div>
			<div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/85 via-background/80 to-background/95" />

			<div className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
				<div className="relative aspect-[460/215] w-full shrink-0 overflow-hidden rounded-lg border bg-muted md:w-[340px]">
					<AssetImage
						src={assets?.main_capsule ?? assets?.header ?? null}
						alt={game.name}
						priority
						sizes="(max-width: 768px) 100vw, 340px"
					/>
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-2xl font-semibold">{game.name}</h2>
						{isDemo && <Badge variant="secondary">Demo</Badge>}
					</div>

					{byline && (
						<p className="text-sm text-muted-foreground">{byline}</p>
					)}

					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
						<span className="text-muted-foreground">
							{formatDate(game.steam_release_date)}
						</span>
						<span className="text-muted-foreground">·</span>
						<span className="font-medium">
							{game.price_in_cents && game.price_in_cents > 0
								? formatPrice(game.price_in_cents)
								: "Free"}
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex flex-row items-center gap-2 text-lg text-muted-foreground">
							{platforms?.windows && <FaWindows title="Windows" />}
							{platforms?.mac && <FaApple title="macOS" />}
							{platforms?.steamos_linux && <FaLinux title="Linux / SteamOS" />}
						</div>
						{deckCompat != null && deckCompat > 0 && (
							<Badge variant="outline">
								Steam Deck: {COMPAT_LABELS[deckCompat] ?? "Unknown"}
							</Badge>
						)}
					</div>

					<div className="mt-1">
						<Button asChild size="sm">
							<a
								href={`https://store.steampowered.com/app/${game.app_id}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								View on Steam
								<ExternalLink />
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
