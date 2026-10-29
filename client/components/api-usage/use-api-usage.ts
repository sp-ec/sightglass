"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { apiUsage } from "./api-usage-types";

type apiUsageState = {
	usage: apiUsage | null;
	error: string | null;
};

export const useApiUsage = (): apiUsageState => {
	const [usage, setUsage] = React.useState<apiUsage | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			try {
				const response = await apiFetch("/api-usage", {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error("Failed to load API usage");
				}
				setUsage((await response.json()) as apiUsage);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load API usage");
				}
			}
		};

		void load();

		return () => {
			controller.abort();
		};
	}, []);

	return { usage, error };
};
