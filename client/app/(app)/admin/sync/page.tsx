"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LucideRefreshCcw, Square } from "lucide-react";
import { formatAssetUrl } from "@/lib/utils";
import { readErrorMessage } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type SyncStatus = "running" | "stopped" | null;

type SyncInfo = {
	status: SyncStatus;
	fetched: number;
	total: number;
	oldestGameDate: Date | null;
	newestGame: any | null;
};

export default function SyncPage() {
	const [syncInfo, setSyncInfo] = useState<SyncInfo | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const loadStatus = async () => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/sync/status`,
		);
		const data = (await response.json()) as SyncInfo;

		setSyncInfo(data);
	};

	useEffect(() => {
		let active = true;

		void loadStatus();
		const interval = window.setInterval(() => {
			if (active) {
				void loadStatus();
			}
		}, 10000);

		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, []);

	const buttonLabel = useMemo(() => {
		if (syncInfo?.status === "running") {
			return "Stop Sync";
		}

		if (syncInfo && syncInfo.fetched > 0 && syncInfo.fetched < syncInfo.total) {
			return "Resume Sync";
		}

		return "Start Sync";
	}, [syncInfo]);

	const showCompleted =
		syncInfo?.status === "stopped" &&
		syncInfo.fetched > 0 &&
		syncInfo.fetched === syncInfo.total;

	const handleSyncAction = async () => {
		setIsSubmitting(true);
		setActionError(null);

		try {
			if (syncInfo?.status === "running") {
				await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/stop`, {
					method: "POST",
				});
				await loadStatus();
				return;
			}

			const startAt =
				syncInfo && syncInfo.fetched > 0 && syncInfo.fetched < syncInfo.total
					? syncInfo.fetched
					: 0;

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/sync/start`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ startAt }),
				},
			);

			// A missing Steam API key comes back as a 400 and would otherwise look
			// like a sync that started and then did nothing
			if (!response.ok) {
				setActionError(
					await readErrorMessage(response, "Failed to start the sync"),
				);
			}
		} finally {
			await loadStatus();
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-16 flex flex-col place-items-center justify-center">
			{actionError && (
				<div
					role="alert"
					className="w-full max-w-lg rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
				>
					{actionError}
				</div>
			)}
			{showCompleted ? (
				<div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 max-w-lg w-full">
					Sync Completed at{" "}
					{new Date(syncInfo?.newestGame.last_updated).toLocaleString()}
				</div>
			) : (
				<>
					{syncInfo?.newestGame && (
						<Card className="w-full max-w-lg">
							<CardContent>
								<Link
									href={`https://store.steampowered.com/${syncInfo?.newestGame?.store_url_path}`}
									rel="noopener noreferrer"
									target="_blank"
									className="block"
								>
									<Image
										src={`${formatAssetUrl(syncInfo?.newestGame?.asset_url_format || "", syncInfo?.newestGame?.main_capsule || "")}`}
										alt=""
										width={500}
										height={300}
										className="rounded-md"
									/>
								</Link>
							</CardContent>
							<CardFooter>
								<p className="overflow-hidden text-ellipsis whitespace-nowrap">
									{syncInfo?.newestGame?.name}{" "}
									<span className="text-muted-foreground">
										({syncInfo?.newestGame?.app_id})
									</span>
								</p>
							</CardFooter>
						</Card>
					)}
				</>
			)}

			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Sync Steam Data</CardTitle>
					<CardDescription>
						Fetch games, reviews, tags and other data from Steam.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{syncInfo?.total == 0 ? (
						<p>Games never synced, please start a sync to fetch game data.</p>
					) : (
						<>
							<Field className="w-full">
								<FieldLabel htmlFor="sync-progress">
									<span>
										{syncInfo ? (
											<span className="text-sm text-muted-foreground">
												{Intl.NumberFormat("en-US").format(syncInfo.fetched)} of{" "}
												{Intl.NumberFormat("en-US").format(syncInfo.total)}{" "}
												games synced
											</span>
										) : (
											<span>No sync data available</span>
										)}
									</span>
									<span className="ml-auto">
										{syncInfo ? (
											<span className="text-sm text-muted-foreground">
												{Math.round(
													((syncInfo.fetched || 0) / (syncInfo.total || 1)) *
														100,
												)}
												%
											</span>
										) : null}
									</span>
								</FieldLabel>
								<Progress
									value={
										((syncInfo?.fetched || 0) / (syncInfo?.total || 1)) * 100
									}
									id="sync-progress"
								/>
							</Field>
							<div className="w-full space-y-2 mt-4 flex flex-col place-items-end text-xs text-muted-foreground opacity-50">
								{syncInfo?.oldestGameDate && (
									<p>
										Oldest fetched game:{" "}
										{new Date(syncInfo.oldestGameDate).toLocaleString()}
									</p>
								)}
								{syncInfo?.newestGame && (
									<p>
										Newest fetched game:{" "}
										{new Date(
											syncInfo.newestGame.last_updated,
										).toLocaleString()}
									</p>
								)}
							</div>
						</>
					)}
				</CardContent>
				<CardFooter>
					<Button
						size="lg"
						onClick={() => void handleSyncAction()}
						disabled={isSubmitting}
						variant={syncInfo?.status === "running" ? "destructive" : "default"}
						className="w-full"
					>
						{syncInfo?.status === "running" ? (
							<Square className="size-4" />
						) : (
							<LucideRefreshCcw
								className={`size-4 ${isSubmitting ? "animate-spin" : ""}`}
							/>
						)}

						{isSubmitting ? "Working..." : buttonLabel}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
