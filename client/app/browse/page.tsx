"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
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
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

import { FaWindows, FaApple, FaLinux } from "react-icons/fa";
import { ThumbsUp, ThumbsDown, Meh, InfoIcon } from "lucide-react";

const DEBOUNCE_DELAY = 200;

export default function BrowsePage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<{ app_id: string; name: string }[]>(
		[],
	);
	const [selectedItem, setSelectedItem] = useState<string>("");
	const [gameData, setGameData] = useState<any>(null);

	const reviewScoreColors = [
		{ bg: "bg-zinc-500/20", icon: <InfoIcon size={18} /> }, // 0 Not Enough Reviews
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 1 Overwhelmingly Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 2 Very Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 3: Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 4: Mostly Negative
		{ bg: "bg-yellow-400/20", icon: <Meh size={18} /> }, // 5: Mixed
		{ bg: "bg-lime-500/20", icon: <ThumbsUp size={18} /> }, // 6: Mostly Positive
		{ bg: "bg-lime-400/20", icon: <ThumbsUp size={18} /> }, // 7: Positive
		{ bg: "bg-green-500/20", icon: <ThumbsUp size={18} /> }, // 8: Very Positive
		{ bg: "bg-green-500/20", icon: <ThumbsUp size={18} /> }, // 9: Overwhelmingly Positive
	];

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
		<div className="flex flex-col items-center justify-start min-h-full gap-8">
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
						/>
						<ComboboxContent>
							<ComboboxEmpty>No items found.</ComboboxEmpty>
							<ComboboxList>
								{results.map((item) => (
									<ComboboxItem
										key={item.app_id}
										value={`${item.name} (${item.app_id})`}
										onSelect={() => setSelectedItem(item.app_id)}
										onClick={() => setSelectedItem(item.app_id)}
										onPointerDown={(e) => {
											e.preventDefault();
											setSelectedItem(item.app_id);
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
			{gameData && (
				<>
					<Card className="w-full max-w-lg">
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-row justify-between gap-4">
							<div className="w-1/2 flex flex-col justify-between">
								<div className="flex flex-col gap-1">
									<p>Name: {gameData.game.name}</p>
									<p>App ID: {gameData.game.app_id}</p>
									<p>
										Developer(s):{" "}
										{gameData.developers.map((dev: any) => dev.name).join(", ")}
									</p>
									<p>
										Publisher(s):{" "}
										{gameData.publishers.map((pub: any) => pub.name).join(", ")}
									</p>
									<p>
										Release Date:{" "}
										{new Date(
											gameData.game.steam_release_date,
										).toLocaleString()}
									</p>
									<p>
										Price:{" "}
										{gameData.game.price_in_cents > 0
											? `$${gameData.game.price_in_cents / 100}`
											: "Free"}
									</p>

									<div className="flex flex-row gap-2 text-lg mt-4">
										{gameData.game.windows && <FaWindows />}
										{gameData.game.mac && <FaApple />}
										{gameData.game.steamos_linux && <FaLinux />}
									</div>
								</div>

								<Button
									className="mt-4"
									onClick={() =>
										window.open(
											`https://store.steampowered.com/app/${gameData.game.app_id}`,
											"_blank",
										)
									}
								>
									View Store Page
								</Button>
							</div>
							<div className="w-1/2 bg-zinc-800 rounded-md p-4">
								<p className="mb-2">Short Description</p>
								<p>
									{gameData.game.short_description
										? gameData.game.short_description
										: "No description available."}
								</p>
							</div>
						</CardContent>
					</Card>
					<Card className="w-full max-w-lg">
						<CardHeader>
							<CardTitle>Reviews Summary</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-row justify-between gap-4">
							<div className="w-1/3">
								<p>Review Count: {gameData.game.review_count}</p>
								<p>Percent Positive: {gameData.game.percent_positive}%</p>
							</div>
							<div
								className={`w-2/3 text-lg flex flex-row place-items-center gap-2 justify-center place-content-center rounded-md ${reviewScoreColors[gameData.game.review_score]?.bg}`}
							>
								{reviewScoreColors[gameData.game.review_score]?.icon && (
									<div className="flex justify-center">
										{reviewScoreColors[gameData.game.review_score]?.icon}
									</div>
								)}
								<p className="text-center">
									{gameData.game.review_score_label}
								</p>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
