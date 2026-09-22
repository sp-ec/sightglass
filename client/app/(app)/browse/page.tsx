"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GameListRow } from "./_components/game-list-row";
import { GamesPagination } from "./_components/games-pagination";
import { useGamesList } from "./_hooks/use-games-list";

export default function BrowsePage() {
	const { data, loading, error, search, page, setSearch, setPage } =
		useGamesList();

	const changePage = (next: number) => {
		setPage(next);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<div className="relative">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search games and demos"
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{/* Only the first load shows skeletons; later loads keep the old rows
			    on screen so the list does not flash on every keystroke */}
			{loading && !data ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 10 }).map((_, i) => (
						<Skeleton key={i} className="h-29.75 w-full" />
					))}
				</div>
			) : data && data.games.length === 0 ? (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No games match “{search}”.
				</p>
			) : (
				<div
					className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}
					aria-busy={loading}
				>
					{data?.games.map((game) => (
						<GameListRow key={game.app_id} game={game} />
					))}
				</div>
			)}

			{data && data.games.length > 0 && (
				<GamesPagination
					page={data.page}
					totalPages={data.total_pages}
					total={data.total}
					disabled={loading}
					onPageChange={changePage}
				/>
			)}
		</div>
	);
}
