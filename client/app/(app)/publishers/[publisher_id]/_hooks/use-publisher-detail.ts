"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import {
	PUBLISHER_GAMES_PAGE_SIZE,
	type PublisherDetail,
	type PublisherGame,
} from "../publisher-detail-types";

type publisherDetailState = {
	data: PublisherDetail | null;
	loading: boolean;
	error: string | null;
	page: number;
	totalPages: number;
	pagedGames: PublisherGame[];
	setPage: (page: number) => void;
};

// Every game arrives in one response, so the table pages on the client
export const usePublisherDetail = (
	publisherId: string | undefined,
): publisherDetailState => {
	const [data, setData] = React.useState<PublisherDetail | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [page, setPage] = React.useState(1);

	React.useEffect(() => {
		if (!publisherId) {
			return;
		}

		const controller = new AbortController();

		const load = async () => {
			// Cleared so a failed load never shows the previous publisher
			setData(null);
			setLoading(true);
			setError(null);
			setPage(1);

			try {
				const response = await apiFetch(`/publishers/${publisherId}`, {
					signal: controller.signal,
				});

				if (response.status === 404) {
					throw new Error("That publisher could not be found");
				}
				if (!response.ok) {
					throw new Error("Failed to load this publisher");
				}

				setData((await response.json()) as PublisherDetail);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load this publisher");
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
	}, [publisherId]);

	const totalPages = Math.max(
		1,
		Math.ceil((data?.games.length ?? 0) / PUBLISHER_GAMES_PAGE_SIZE),
	);
	const pagedGames = React.useMemo(
		() =>
			(data?.games ?? []).slice(
				(page - 1) * PUBLISHER_GAMES_PAGE_SIZE,
				page * PUBLISHER_GAMES_PAGE_SIZE,
			),
		[data, page],
	);

	return { data, loading, error, page, totalPages, pagedGames, setPage };
};
