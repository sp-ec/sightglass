"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAutoSync } from "../_hooks/use-auto-sync";
import { formatCountdown, useCountdown } from "../_hooks/use-countdown";
import {
	autoSyncView,
	MAX_INTERVAL_HOURS,
	MIN_INTERVAL_HOURS,
} from "../sync-types";

interface Props {
	current: autoSyncView | null;
	onSaved: (saved: autoSyncView) => void;
}

const HOUR_MS = 3_600_000;

export function AutoSyncCard({ current, onSaved }: Props) {
	const { enabled, hours, setHours, toggle, dirty, error, saving, save } =
		useAutoSync(current, onSaved);
	const remaining = useCountdown(current?.nextSyncAt ?? null);
	const intervalMs = (current?.intervalHours ?? 0) * HOUR_MS;

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Automatic Sync</CardTitle>
				<CardDescription>
					Re-sync every game from Steam on a fixed interval.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="glass-subtle flex items-center justify-between gap-4 rounded-lg p-4">
					<p className="text-sm font-medium">Enabled</p>
					<Switch
						checked={enabled}
						disabled={current === null || saving}
						aria-label="Automatic sync enabled"
						onCheckedChange={toggle}
					/>
				</div>

				<Field>
					<FieldLabel htmlFor="auto-sync-hours">Interval (hours)</FieldLabel>
					<Input
						id="auto-sync-hours"
						type="number"
						inputMode="numeric"
						min={MIN_INTERVAL_HOURS}
						max={MAX_INTERVAL_HOURS}
						step={1}
						placeholder={`${MIN_INTERVAL_HOURS}–${MAX_INTERVAL_HOURS}`}
						value={hours}
						disabled={!enabled || saving}
						aria-invalid={Boolean(error)}
						onChange={(e) => setHours(e.target.value)}
					/>
				</Field>

				{remaining !== null && intervalMs > 0 && (
					<Field>
						<FieldLabel htmlFor="auto-sync-countdown">
							<span className="text-sm text-muted-foreground">Next sync in</span>
							<span className="ml-auto font-mono text-sm tabular-nums">
								{remaining > 0 ? formatCountdown(remaining) : "Syncing..."}
							</span>
						</FieldLabel>
						<Progress
							id="auto-sync-countdown"
							value={Math.min(remaining / intervalMs, 1) * 100}
						/>
					</Field>
				)}
			</CardContent>
			<CardFooter className="flex items-center gap-3">
				<Button onClick={() => void save()} disabled={!dirty || saving}>
					{saving && <Spinner />}
					{saving ? "Saving..." : "Save"}
				</Button>
				{error && (
					<span role="alert" className="text-sm text-destructive">
						{error}
					</span>
				)}
			</CardFooter>
		</Card>
	);
}
