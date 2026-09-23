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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { putJson, readErrorMessage } from "@/lib/api";
import { apiSchema } from "../app-settings-schema";
import { useAppSettingsSection } from "../_hooks/use-app-settings-section";
import type {
	apiForm,
	apiSettingsView,
	appSettingsView,
} from "../app-settings-types";

interface Props {
	current: apiSettingsView | null;
	onSaved: (saved: appSettingsView) => void;
}

const EMPTY_FORM: apiForm = { steamApiKey: "" };

const toPayload = (value: apiForm) => ({ steamApiKey: value.steamApiKey });

// The stored key is write-only, so this tab's form can never mirror server
// state. Its baseline is the empty string: dirty means "a new key was typed".
export function ApiTab({ current, onSaved }: Props) {
	const [removing, setRemoving] = React.useState(false);
	const [removeError, setRemoveError] = React.useState<string | null>(null);

	const initial = current === null ? null : EMPTY_FORM;

	const section = useAppSettingsSection({
		section: "api",
		initial,
		schema: apiSchema,
		toPayload,
		onSaved,
		afterSave: () => EMPTY_FORM,
	});

	const { value, update, dirty, errors, formError, saving, saved, save } =
		section;

	const removeKey = async () => {
		setRemoveError(null);
		setRemoving(true);

		try {
			const response = await putJson("/app-settings", {
				section: "api",
				value: { clearSteamApiKey: true },
			});

			if (!response.ok) {
				setRemoveError(await readErrorMessage(response, "Failed to remove key"));
				return;
			}

			onSaved((await response.json()) as appSettingsView);
		} catch {
			setRemoveError("Failed to remove key");
		} finally {
			setRemoving(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>API</CardTitle>
				<CardDescription>
					One Steam API key is used for the whole app. It is stored in the
					database and never sent back to the browser.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-sm font-medium">Steam API key</p>
				<Input
					type="text"
					autoComplete="off"
					spellCheck={false}
					placeholder={
						current?.hasKey ? current.maskedKey : "No key configured"
					}
					value={value?.steamApiKey ?? ""}
					disabled={value === null}
					aria-invalid={Boolean(errors.steamApiKey)}
					onChange={(e) => update(() => ({ steamApiKey: e.target.value }))}
				/>
				<p className="text-sm text-muted-foreground">
					{current?.hasKey
						? "A key is stored. Leave this blank to keep it, or enter a new key to replace it."
						: "Sync cannot run until a key is saved."}{" "}
					Information on how to obtain a Steam API key can be found in the{" "}
					<a
						href="https://steamcommunity.com/dev"
						target="_blank"
						rel="noopener noreferrer"
					>
						Steam API documentation
					</a>
					.
				</p>
				{errors.steamApiKey && (
					<p className="text-xs text-destructive">{errors.steamApiKey}</p>
				)}
			</CardContent>
			<CardFooter className="flex items-center gap-3">
				<Button onClick={() => void save()} disabled={!dirty || saving}>
					{saving && <Spinner />}
					{saving ? "Saving..." : "Save"}
				</Button>
				{current?.hasKey && (
					<Button
						variant="outline"
						onClick={() => void removeKey()}
						disabled={removing}
					>
						{removing && <Spinner />}
						Remove key
					</Button>
				)}
				{saved && <span className="text-sm text-muted-foreground">Saved</span>}
				{(formError || removeError) && (
					<span role="alert" className="text-sm text-destructive">
						{formError ?? removeError}
					</span>
				)}
			</CardFooter>
		</Card>
	);
}
