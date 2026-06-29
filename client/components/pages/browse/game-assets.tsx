import React, { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

type GameAssetDisplayProps = {
	url: string;
	name: string;
	width: number;
	height: number;
	size?: number;
};

type GameAssetsProps = {
	assetData: any;
};

function GameAssetDisplay({
	url,
	name,
	width,
	height,
	size,
}: GameAssetDisplayProps) {
	const fallbackUrl = "/images/not-found.png";
	const [imageUrl, setImageUrl] = useState(url);

	useEffect(() => {
		setImageUrl(url);
	}, [url]);

	return (
		<div className="flex flex-col gap-2">
			<Link href={imageUrl} target="_blank" rel="noopener noreferrer">
				<Image
					src={imageUrl}
					alt={name}
					width={width}
					height={height}
					className={`block rounded-md w-${size}`}
					onError={() => setImageUrl(fallbackUrl)}
				/>
			</Link>

			<p className="text-sm text-muted-foreground">{name}</p>
		</div>
	);
}

function GameAssets({ assetData }: GameAssetsProps) {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Assets</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{assetData && (
					<div className="flex flex-col gap-4">
						<div className="flex flex-row gap-4">
							<GameAssetDisplay
								url={assetData.main_capsule}
								name="Main Capsule"
								width={1232}
								height={896}
							/>
							<div className="flex flex-col gap-4">
								<GameAssetDisplay
									url={assetData.small_capsule}
									name="Small Capsule"
									width={462}
									height={174}
									size={100}
								/>
								<GameAssetDisplay
									url={assetData.hero_capsule}
									name="Hero Capsule"
									width={920}
									height={430}
									size={100}
								/>
							</div>
						</div>
						<div className="flex flex-row gap-4">
							<div className="w-72">
								<GameAssetDisplay
									url={assetData.library_capsule}
									name="Library Capsule"
									width={600}
									height={900}
								/>
							</div>

							<GameAssetDisplay
								url={assetData.header}
								name="Header Capsule"
								width={920}
								height={430}
							/>
						</div>
						<GameAssetDisplay
							url={assetData.library_hero}
							name="Library Hero"
							width={3840}
							height={1240}
						/>
						<div className="flex flex-row gap-4">
							<GameAssetDisplay
								url={assetData.page_background}
								name="Page Background"
								width={1438}
								height={810}
							/>
							<div className="flex flex-col gap-4">
								<GameAssetDisplay
									url={assetData.logo}
									name="Library Logo"
									width={1280}
									height={720}
									size={200}
								/>
								<GameAssetDisplay
									url={assetData.community_icon}
									name="Community Icon"
									width={256}
									height={256}
									size={15}
								/>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default GameAssets;
