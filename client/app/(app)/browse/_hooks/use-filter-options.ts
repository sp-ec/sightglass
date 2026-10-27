"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { FilterOption } from "@/components/charts/chart-types";

type filterOptionsState = {
	tagOptions: FilterOption[];
	languageOptions: FilterOption[];
	error: string | null;
};

export const useFilterOptions = (): filterOptionsState => {
	const [tagOptions, setTagOptions] = React.useState<FilterOption[]>([]);
	const [languageOptions, setLanguageOptions] = React.useState<
		FilterOption[]
	>([]);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			try {
				const [tagResponse, languageResponse] = await Promise.all([
					apiFetch("/games/tags", { signal: controller.signal }),
					apiFetch("/games/languages", { signal: controller.signal }),
				]);

				if (!tagResponse.ok || !languageResponse.ok) {
					throw new Error("Failed to load filter options");
				}

				setTagOptions((await tagResponse.json()) as FilterOption[]);
				setLanguageOptions((await languageResponse.json()) as FilterOption[]);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError("Failed to load filter options");
				}
			}
		};

		void load();

		return () => {
			controller.abort();
		};
	}, []);

	return { tagOptions, languageOptions, error };
};
