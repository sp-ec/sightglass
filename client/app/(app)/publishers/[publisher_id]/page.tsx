"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublishersPagination } from "../_components/publishers-pagination";
import { PublisherGamesTable } from "./_components/publisher-games-table";
import { PublisherStats } from "./_components/publisher-stats";
import { PublisherTags } from "./_components/publisher-tags";
import { usePublisherDetail } from "./_hooks/use-publisher-detail";

export default function PublisherDetailPage() {
	const params = useParams<{ publisher_id: string }>();
	const { data, loading, error, page, totalPages, pagedGames, setPage } =
		usePublisherDetail(params.publisher_id);

	const changePage = (next: number) => {
		setPage(next);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<Button variant="ghost" size="sm" className="self-start" asChild>
				<Link href="/publishers">
					<ArrowLeft />
					Back to publishers
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
						{data.publisher.name}
					</h2>

					<PublisherStats publisher={data.publisher} />

					<PublisherTags tags={data.tags} />

					{data.games.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No games recorded for this publisher.
						</p>
					) : (
						<>
							<Card className="p-2">
								<PublisherGamesTable games={pagedGames} />
							</Card>

							<PublishersPagination
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
