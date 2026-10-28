"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompaniesPagination } from "./companies-pagination";
import { CompanyGamesTable } from "./company-games-table";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import { CompanyStats } from "./company-stats";
import { CompanyTags } from "./company-tags";
import { useCompanyDetail } from "./use-company-detail";

export function CompanyDetailPage({
	kind,
	companyId,
}: {
	kind: CompanyKind;
	companyId: string | undefined;
}) {
	const { path, singular, plural } = COMPANY_KINDS[kind];
	const { data, loading, error, page, totalPages, pagedGames, setPage } =
		useCompanyDetail(kind, companyId);

	const changePage = (next: number) => {
		setPage(next);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<Button variant="ghost" size="sm" className="self-start" asChild>
				<Link href={path}>
					<ArrowLeft />
					Back to {plural}
				</Link>
			</Button>

			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{loading && (
				<div className="flex flex-col gap-6">
					<Skeleton className="h-9 w-72" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-[60vh] w-full" />
				</div>
			)}

			{!loading && data && (
				<>
					<h2 className="text-3xl font-semibold tracking-tight">
						{data.company.name}
					</h2>

					<CompanyStats kind={kind} company={data.company} />

					<CompanyTags kind={kind} tags={data.tags} />

					{data.games.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No games recorded for this {singular}.
						</p>
					) : (
						<>
							<Card className="p-2">
								<CompanyGamesTable games={pagedGames} />
							</Card>

							<CompaniesPagination
								page={page}
								totalPages={totalPages}
								total={data.games.length}
								disabled={false}
								onPageChange={changePage}
								noun={["game", "games"]}
							/>
						</>
					)}
				</>
			)}
		</div>
	);
}
