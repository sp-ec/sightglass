"use client";

import { ExternalLink } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AssetImage } from "./asset-image";
import type { GameAssets } from "../game-detail-types";

// Every asset Steam exposes. Steam ships these at wildly different aspect
// ratios (the library capsule is portrait, the library hero is a wide banner),
// so tiles are a fixed height with the image contained inside. Sizing each
// tile to its own image is what left ragged holes in the grid.
const ASSET_FIELDS: {
	key: keyof NonNullable<GameAssets>;
	label: string;
	wide?: boolean;
}[] = [
	{ key: "main_capsule", label: "Main Capsule" },
	{ key: "header", label: "Header Capsule" },
	{ key: "small_capsule", label: "Small Capsule" },
	{ key: "hero_capsule", label: "Hero Capsule" },
	{ key: "library_capsule", label: "Library Capsule" },
	{ key: "logo", label: "Library Logo" },
	{ key: "community_icon", label: "Community Icon" },
	{ key: "library_hero", label: "Library Hero", wide: true },
	{ key: "page_background", label: "Page Background", wide: true },
];

export function GameAssetGallery({ assets }: { assets: GameAssets }) {
	const present = ASSET_FIELDS.filter((field) => assets?.[field.key]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Assets</CardTitle>
				<CardDescription>
					{present.length} of {ASSET_FIELDS.length} assets available from Steam.
					Select one to open the original.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{ASSET_FIELDS.map((field) => {
						const src = assets?.[field.key] ?? null;

						const tile = (
							<div
								className={cn(
									"relative w-full overflow-hidden rounded-md border bg-muted p-2",
									field.wide ? "h-64" : "h-44",
								)}
							>
								<AssetImage
									src={src}
									alt={field.label}
									className="object-contain"
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
								/>
							</div>
						);

						return (
							<div
								key={field.key}
								className={cn(
									"flex flex-col gap-2",
									field.wide && "sm:col-span-2 lg:col-span-3",
								)}
							>
								{src ? (
									<a href={src} target="_blank" rel="noopener noreferrer">
										{tile}
									</a>
								) : (
									tile
								)}
								<p className="flex items-center gap-1 text-sm text-muted-foreground">
									{field.label}
									{src && <ExternalLink className="size-3" />}
									{!src && (
										<span className="text-xs opacity-70">(not available)</span>
									)}
								</p>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
