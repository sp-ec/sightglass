"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PublishersFilterPanel } from "./_components/publishers-filter-panel";
import { PublishersPagination } from "./_components/publishers-pagination";
import { PublishersTable } from "./_components/publishers-table";
import { usePublishersList } from "./_hooks/use-publishers-list";

export default function PublishersPage() {
	const {
		data,
		loading,
		error,
		search,
		filters,
		activeFilterCount,
		sort,
		order,
		setSearch,
		setPage,
		setFilter,
		resetFilters,
		setSort,
		setOrder,
	} = usePublishersList();

	const changePage = (next: number) => {
		setPage(next);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="relative">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search publishers"
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<PublishersFilterPanel
				filters={filters}
				activeFilterCount={activeFilterCount}
				sort={sort}
				order={order}
				onFilterChange={setFilter}
				onReset={resetFilters}
				onSortChange={setSort}
				onOrderChange={setOrder}
			/>

			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{/* Only the first load shows a skeleton; later loads keep the old rows
			    on screen so the table does not flash on every keystroke */}
			{loading && !data ? (
				<Skeleton className="h-[60vh] w-full" />
			) : data && data.publishers.length === 0 ? (
				<p className="py-12 text-center text-sm text-muted-foreground">
					{search.trim()
						? `No publishers match “${search.trim()}”${activeFilterCount > 0 ? " with these filters" : ""}.`
						: "No publishers match these filters."}
				</p>
			) : (
				<Card
					className={`p-2 ${loading ? "opacity-60" : ""}`}
					aria-busy={loading}
				>
					<PublishersTable publishers={data?.publishers ?? []} />
				</Card>
			)}

			{data && data.publishers.length > 0 && (
				<PublishersPagination
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
