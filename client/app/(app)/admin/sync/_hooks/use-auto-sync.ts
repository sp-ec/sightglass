"use client";

import * as React from "react";
import { putJson, readErrorMessage } from "@/lib/api";
import {
	autoSyncView,
	MAX_INTERVAL_HOURS,
	MIN_INTERVAL_HOURS,
} from "../sync-types";

type autoSyncState = {
	enabled: boolean;
	hours: string;
	setHours: (hours: string) => void;
	toggle: (enabled: boolean) => void;
	dirty: boolean;
	error: string | null;
	saving: boolean;
	save: () => Promise<void>;
};

const parseHours = (hours: string): number | null => {
	const value = Number(hours);
	if (
		hours.trim() === "" ||
		!Number.isInteger(value) ||
		value < MIN_INTERVAL_HOURS ||
		value > MAX_INTERVAL_HOURS
	) {
		return null;
	}
	return value;
};

export const useAutoSync = (
	current: autoSyncView | null,
	onSaved: (saved: autoSyncView) => void,
): autoSyncState => {
	const [enabled, setEnabled] = React.useState(false);
	const [hours, setHours] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [saving, setSaving] = React.useState(false);
	const [previousInterval, setPreviousInterval] = React.useState<
		number | null | undefined
	>(undefined);

	// Adopt the server's interval during render when it changes, so the form
	// starts from the saved value without an effect
	const serverInterval = current?.intervalHours;
	if (serverInterval !== previousInterval) {
		setPreviousInterval(serverInterval);
		setEnabled(serverInterval != null);
		setHours(serverInterval != null ? String(serverInterval) : "");
	}

	const submit = async (intervalHours: number | null) => {
		setError(null);
		setSaving(true);

		try {
			const response = await putJson("/sync/schedule", { intervalHours });
			if (!response.ok) {
				setError(await readErrorMessage(response, "Failed to save schedule"));
				return;
			}
			onSaved((await response.json()) as autoSyncView);
		} catch {
			setError("Failed to save schedule");
		} finally {
			setSaving(false);
		}
	};

	const save = async () => {
		const value = parseHours(hours);
		if (value === null) {
			setError(
				`Enter a whole number of hours between ${MIN_INTERVAL_HOURS} and ${MAX_INTERVAL_HOURS}`,
			);
			return;
		}
		await submit(value);
	};

	// Turning it off takes effect immediately; turning it on waits for an interval
	const toggle = (next: boolean) => {
		setEnabled(next);
		setError(null);
		if (!next && serverInterval != null) {
			void submit(null);
		}
	};

	const dirty = enabled && hours !== String(serverInterval ?? "");

	return { enabled, hours, setHours, toggle, dirty, error, saving, save };
};
