import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaWindows, FaApple, FaLinux } from "react-icons/fa";

type BasicGameInfoProps = {
  gameInfo: any,
  gameDevelopers: any,
  gamePublishers: any,
  gamePlatforms: any
};

function BasicGameInfo({ gameInfo, gameDevelopers, gamePublishers, gamePlatforms }: BasicGameInfoProps) {

	if (!gameInfo) {
		return <></>;
	}

	return (
		
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-row justify-between gap-4">
				<div className="w-1/2 flex flex-col justify-between overflow-y-scroll min-h-full h-58">
					<div className="flex flex-col gap-1">
						<p>Name: {gameInfo.name}</p>
						<p>App ID: {gameInfo.app_id}</p>
						<p>
							Developer(s):{" "}
							{gameDevelopers.map((dev: any) => dev.name).join(", ")}
						</p>
						<p>
							Publisher(s):{" "}
							{gamePublishers.map((pub: any) => pub.name).join(", ")}
						</p>
						<p>
							Release Date:{" "}
							{new Date(gameInfo.steam_release_date).toLocaleString()}
						</p>
						<p>
							Price:{" "}
							{gameInfo.price_in_cents > 0
								? `$${gameInfo.price_in_cents / 100}`
								: "Free"}
						</p>

						<div className="flex flex-row gap-2 text-lg mt-4">
							{gamePlatforms.windows && <FaWindows />}
							{gamePlatforms.mac && <FaApple />}
							{gamePlatforms.steamos_linux && <FaLinux />}
						</div>
					</div>

					<Button
						className="mt-4"
						onClick={() =>
							window.open(
								`https://store.steampowered.com/app/${gameInfo.app_id}`,
								"_blank",
							)
						}
					>
						View Store Page
					</Button>
				</div>
				<div className="w-1/2 bg-muted text-foreground rounded-md p-4 max-h-58 overflow-y-scroll ">
					<p>
						{gameInfo.short_description
							? gameInfo.short_description
							: "No description available."}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export default BasicGameInfo;
