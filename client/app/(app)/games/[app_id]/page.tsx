"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { GameHero } from "./_components/game-hero";
import { GameStats } from "./_components/game-stats";
import {
	GameContent,
	GameLanguagesCard,
} from "./_components/game-content";
import { GameInfoPanel } from "./_components/game-info-panel";
import { GameAssetGallery } from "./_components/game-asset-gallery";
import type { GameDetail } from "./game-detail-types";

export default function GameDetailPage() {
	const params = useParams<{ app_id: string }>();
	const appId = params.app_id;

	const [game, setGame] = React.useState<GameDetail | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!appId) {
			return;
		}

		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await apiFetch(`/games/${appId}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load this game");
				}

				const body = (await response.json()) as GameDetail | null;
				if (!body?.game) {
					throw new Error("That game could not be found");
				}

				setGame(body);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load this game");
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			controller.abort();
		};
	}, [appId]);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<Button variant="ghost" size="sm" className="self-start" asChild>
				<Link href="/browse">
					<ArrowLeft />
					Back to games
				</Link>
			</Button>

			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{loading && (
				<div className="flex flex-col gap-6">
					<Skeleton className="h-64 w-full rounded-xl" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-28 w-full" />
						))}
					</div>
					<Skeleton className="h-96 w-full" />
				</div>
			)}

			{!loading && game && (
				<>
					<GameHero
						game={game.game}
						assets={game.assets}
						platforms={game.platforms}
						developers={game.developers}
						publishers={game.publishers}
						isDemo={game.is_demo}
					/>

					<GameStats
						reviews={game.reviews}
						estimate={game.estimate}
						priceInCents={game.game.price_in_cents}
					/>

					{/* items-start keeps the shorter column from stretching into a gap */}
					<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
						<GameContent
							shortDescription={game.game.short_description}
							tags={game.tags}
						/>
						<GameInfoPanel
							game={game.game}
							platforms={game.platforms}
							developers={game.developers}
							publishers={game.publishers}
							isDemo={game.is_demo}
							parentApp={game.parent_app}
							demoApp={game.demo_app}
						/>
					</div>

					<GameLanguagesCard languages={game.languages} />

					<GameAssetGallery assets={game.assets} />
				</>
			)}
		</div>
	);
}
