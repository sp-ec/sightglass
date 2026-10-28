"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import {
	COMPANY_GAMES_PAGE_SIZE,
	type CompanyDetail,
	type CompanyGame,
} from "./company-detail-types";

type companyDetailState = {
	data: CompanyDetail | null;
	loading: boolean;
	error: string | null;
	page: number;
	totalPages: number;
	pagedGames: CompanyGame[];
	setPage: (page: number) => void;
};

// Every game arrives in one response, so the table pages on the client
export const useCompanyDetail = (
	kind: CompanyKind,
	companyId: string | undefined,
): companyDetailState => {
	const { path, singular } = COMPANY_KINDS[kind];

	const [data, setData] = React.useState<CompanyDetail | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [page, setPage] = React.useState(1);

	React.useEffect(() => {
		if (!companyId) {
			return;
		}

		const controller = new AbortController();

		const load = async () => {
			// Cleared so a failed load never shows the previous company
			setData(null);
			setLoading(true);
			setError(null);
			setPage(1);

			try {
				const response = await apiFetch(`${path}/${companyId}`, {
					signal: controller.signal,
				});

				if (response.status === 404) {
					throw new Error(`That ${singular} could not be found`);
				}
				if (!response.ok) {
					throw new Error(`Failed to load this ${singular}`);
				}

				setData((await response.json()) as CompanyDetail);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || `Failed to load this ${singular}`);
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
	}, [path, singular, companyId]);

	const totalPages = Math.max(
		1,
		Math.ceil((data?.games.length ?? 0) / COMPANY_GAMES_PAGE_SIZE),
	);
	const pagedGames = React.useMemo(
		() =>
			(data?.games ?? []).slice(
				(page - 1) * COMPANY_GAMES_PAGE_SIZE,
				page * COMPANY_GAMES_PAGE_SIZE,
			),
		[data, page],
	);

	return { data, loading, error, page, totalPages, pagedGames, setPage };
};
