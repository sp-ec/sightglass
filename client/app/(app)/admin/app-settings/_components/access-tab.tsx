"use client";

import * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { accessSchema } from "../app-settings-schema";
import { useAppSettingsSection } from "../_hooks/use-app-settings-section";
import type {
	accessSettings,
	appSettingsView,
} from "../app-settings-types";

interface Props {
	initial: accessSettings | null;
	onSaved: (saved: appSettingsView) => void;
}

const toPayload = (value: accessSettings) => value;

export function AccessTab({ initial, onSaved }: Props) {
	const section = useAppSettingsSection({
		section: "access",
		initial,
		schema: accessSchema,
		toPayload,
		onSaved,
	});

	const { value, update, dirty, formError, saving, saved, save } = section;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Access</CardTitle>
				<CardDescription>
					Controls who can create an account. The one-time admin setup is
					unaffected.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between gap-4 rounded-md border p-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">Registration enabled</p>
						<p className="text-sm text-muted-foreground">
							When off, the sign-up page is hidden and the server rejects new
							registrations.
						</p>
					</div>
					<Switch
						checked={value?.registrationEnabled ?? false}
						disabled={value === null}
						aria-label="Registration enabled"
						onCheckedChange={(checked) =>
							update((current) => ({ ...current, registrationEnabled: checked }))
						}
					/>
				</div>
			</CardContent>
			<CardFooter className="flex items-center gap-3">
				<Button onClick={() => void save()} disabled={!dirty || saving}>
					{saving && <Spinner />}
					{saving ? "Saving..." : "Save"}
				</Button>
				{saved && <span className="text-sm text-muted-foreground">Saved</span>}
				{formError && (
					<span role="alert" className="text-sm text-destructive">
						{formError}
					</span>
				)}
			</CardFooter>
		</Card>
	);
}
