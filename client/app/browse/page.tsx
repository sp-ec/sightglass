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

const DEBOUNCE_DELAY = 200;

export default function BrowsePage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<{ app_id: string; name: string }[]>(
		[],
	);
	const [selectedItem, setSelectedItem] = useState<string>("");

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

	return (
		<div className="flex flex-col items-center justify-start min-h-full">
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
			App ID: {selectedItem}
		</div>
	);
}
