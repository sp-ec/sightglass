"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type {
	appSettingsView,
	tagOption,
} from "../app-settings-types";

type appSettingsState = {
	appSettings: appSettingsView | null;
	tagOptions: tagOption[];
	loading: boolean;
	error: string | null;
	applySaved: (saved: appSettingsView) => void;
};

export const useAppSettings = (): appSettingsState => {
	const [appSettings, setAppSettings] = React.useState<appSettingsView | null>(
		null,
	);
	const [tagOptions, setTagOptions] = React.useState<tagOption[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const [settingsResponse, tagsResponse] = await Promise.all([
					apiFetch("/app-settings", { signal: controller.signal }),
					apiFetch("/games/tags", { signal: controller.signal }),
				]);

				if (!settingsResponse.ok) {
					throw new Error("Failed to load app settings");
				}

				if (!tagsResponse.ok) {
					throw new Error("Failed to load tags");
				}

				setAppSettings((await settingsResponse.json()) as appSettingsView);
				setTagOptions((await tagsResponse.json()) as tagOption[]);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load app settings");
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			controller.abort();
		};
	}, []);

	// A save returns the whole view, so the other tabs stay in step without refetching
	const applySaved = React.useCallback((saved: appSettingsView) => {
		setAppSettings(saved);
	}, []);

	return { appSettings, tagOptions, loading, error, applySaved };
};
