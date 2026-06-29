"use client";

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

import BasicGameInfo from "@/components/pages/browse/basic-game-info";
import GameReviewSummary from "@/components/pages/browse/game-review-summary";
import GameTagInfo from "@/components/pages/browse/game-tag-info";
import GameLanguages from "@/components/pages/browse/game-languages";
import GameAssets from "@/components/pages/browse/game-assets";

const DEBOUNCE_DELAY = 200;

export default function BrowsePage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<{ app_id: string; name: string }[]>(
		[],
	);

	const [selectedItem, setSelectedItem] = useState<string>("");
	const [gameData, setGameData] = useState<any>(null);

	useEffect(() => {
		if (!searchTerm.trim()) {
			setResults([]);
			return;
		}

		const delayDebounceFn = setTimeout(async () => {
			try {
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/games/search?title=${encodeURIComponent(searchTerm)}`,
				);
				const data = await res.json();
				setResults(data);
			} catch (error) {
				console.error("Search failed", error);
			}
		}, DEBOUNCE_DELAY);

		return () => clearTimeout(delayDebounceFn);
	}, [searchTerm]);

	useEffect(() => {
		if (selectedItem) {
			console.log("Selected game ID:", selectedItem);
			const fetchGameDetails = async () => {
				try {
					const res = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}/games/${selectedItem}`,
					);
					const data = await res.json();
					setGameData(data);
				} catch (error) {
					console.error("Failed to fetch game details", error);
				}
			};
			fetchGameDetails();
		}
	}, [selectedItem]);

	return (
		<div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto">
			<div className="flex flex-row gap-8 min-h-full min-w-full justify-center">
				<div className="flex flex-col items-center justify-start min-h-full gap-8 max-w-lg w-full">
					<Card className="w-full max-w-lg">
						<CardHeader>
							<CardTitle>Browse Games</CardTitle>
						</CardHeader>
						<CardContent>
							<Combobox items={results} autoHighlight>
								<ComboboxInput
									placeholder="Search for a game"
									onChange={(e) =>
										setSearchTerm((e.target as HTMLInputElement).value)
									}
									value={searchTerm}
								/>
								<ComboboxContent>
									<ComboboxEmpty>No items found.</ComboboxEmpty>
									<ComboboxList>
										{results.map((item) => (
											<ComboboxItem
												key={item.app_id}
												value={`${item.name}`}
												onSelect={() => {
													setSelectedItem(item.app_id);
													setSearchTerm(item.name);
												}}
												onClick={() => {
													setSelectedItem(item.app_id);
													setSearchTerm(item.name);
												}}
												onPointerDown={(e) => {
													e.preventDefault();
													setSelectedItem(item.app_id);
													setSearchTerm(item.name);
												}}
											>
												{item.name}
											</ComboboxItem>
										))}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</CardContent>
					</Card>
					{gameData?.game && (
						<>
							<BasicGameInfo
								gameInfo={gameData.game}
								gameDevelopers={gameData.developers}
								gamePublishers={gameData.publishers}
								gamePlatforms={gameData.platforms}
							/>
							<GameReviewSummary gameReviewData={gameData.reviews} />
						</>
					)}
				</div>

				{gameData && (
					<div className="flex flex-col items-center justify-start min-h-full gap-8 max-w-lg w-full">
						<GameTagInfo tagData={gameData.tags} />
						<GameLanguages languageData={gameData.languages} />
					</div>
				)}
			</div>
			{gameData?.assets && <GameAssets assetData={gameData.assets} />}
		</div>
	);
}
