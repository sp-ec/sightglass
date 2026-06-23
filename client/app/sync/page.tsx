"use client";

import { Button } from "@/components/ui/button";
import { LucideRefreshCcw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";

type SyncStatus = "running" | "stopped" | null;

type SyncInfo = {
	status: SyncStatus;
	fetched: number;
	total: number;
};

export default function SyncPage() {
	const [syncInfo, setSyncInfo] = useState<SyncInfo | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/start`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ startAt }),
			});
		} finally {
			await loadStatus();
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4 flex flex-col place-items-center">
			<div className="w-full max-w-sm space-y-4 flex flex-col place-items-end">
				<Field className="w-full max-w-sm">
					<FieldLabel htmlFor="sync-progress">
						<span>
							{syncInfo ? (
								<span className="text-sm text-muted-foreground">
									{Intl.NumberFormat("en-US").format(syncInfo.fetched)} of{" "}
									{Intl.NumberFormat("en-US").format(syncInfo.total)} games
									synced
								</span>
							) : (
								<span>No sync data available</span>
							)}
						</span>
						<span className="ml-auto">
							{syncInfo ? (
								<span className="text-sm text-muted-foreground">
									{Math.round(
										((syncInfo.fetched || 0) / (syncInfo.total || 1)) * 100,
									)}
									%
								</span>
							) : null}
						</span>
					</FieldLabel>
					<Progress
						value={((syncInfo?.fetched || 0) / (syncInfo?.total || 1)) * 100}
						id="sync-progress"
					/>
				</Field>
				<Button
					size="lg"
					onClick={() => void handleSyncAction()}
					disabled={isSubmitting}
					variant={syncInfo?.status === "running" ? "destructive" : "default"}
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
			</div>

			{showCompleted ? (
				<div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700">
					Sync Completed
				</div>
			) : null}
		</div>
	);
}
