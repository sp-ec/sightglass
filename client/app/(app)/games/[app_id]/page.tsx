"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import BasicGameInfo from "@/components/pages/browse/basic-game-info";
import GameReviewSummary from "@/components/pages/browse/game-review-summary";
import GameEstimates from "@/components/pages/browse/game-estimates";
import GameRelatedApps from "@/components/pages/browse/game-related-apps";
import GameTagInfo from "@/components/pages/browse/game-tag-info";
import GameLanguages from "@/components/pages/browse/game-languages";
import GameAssets from "@/components/pages/browse/game-assets";

export default function GameDetailPage() {
	const params = useParams<{ app_id: string }>();
	const appId = params.app_id;

	const [gameData, setGameData] = React.useState<any>(null);
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

				const body = await response.json();
				if (!body?.game) {
					throw new Error("That game could not be found");
				}

				setGameData(body);
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
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
				<div className="flex flex-col gap-6 lg:flex-row">
					<Skeleton className="h-96 w-full max-w-lg" />
					<Skeleton className="h-96 w-full max-w-lg" />
				</div>
			)}

			{!loading && gameData?.game && (
				<>
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
						<div className="flex w-full flex-col items-center gap-6">
							<BasicGameInfo
								gameInfo={gameData.game}
								gameDevelopers={gameData.developers}
								gamePublishers={gameData.publishers}
								gamePlatforms={gameData.platforms}
							/>
							<GameReviewSummary gameReviewData={gameData.reviews} />
							<GameRelatedApps
								isDemo={Boolean(gameData.is_demo)}
								parentApp={gameData.parent_app ?? null}
								demoApp={gameData.demo_app ?? null}
							/>
						</div>

						<div className="flex w-full flex-col items-center gap-6">
							<GameEstimates estimate={gameData.estimate ?? null} />
							<GameTagInfo tagData={gameData.tags} />
							<GameLanguages languageData={gameData.languages} />
						</div>
					</div>

					{gameData.assets && <GameAssets assetData={gameData.assets} />}
				</>
			)}
		</div>
	);
}
