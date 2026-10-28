"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CompaniesFilterPanel } from "./companies-filter-panel";
import { CompaniesPagination } from "./companies-pagination";
import { CompaniesTable } from "./companies-table";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import { useCompanyList } from "./use-company-list";

export function CompanyListPage({ kind }: { kind: CompanyKind }) {
	const { singular, plural } = COMPANY_KINDS[kind];
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
	} = useCompanyList(kind);

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
					placeholder={`Search ${plural}`}
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<CompaniesFilterPanel
				kind={kind}
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
			) : data && data.companies.length === 0 ? (
				<p className="py-12 text-center text-sm text-muted-foreground">
					{search.trim()
						? `No ${plural} match “${search.trim()}”${activeFilterCount > 0 ? " with these filters" : ""}.`
						: `No ${plural} match these filters.`}
				</p>
			) : (
				<Card
					className={`p-2 ${loading ? "opacity-60" : ""}`}
					aria-busy={loading}
				>
					<CompaniesTable kind={kind} companies={data?.companies ?? []} />
				</Card>
			)}

			{data && data.companies.length > 0 && (
				<CompaniesPagination
					page={data.page}
					totalPages={data.total_pages}
					total={data.total}
					disabled={loading}
					onPageChange={changePage}
					noun={[singular, plural]}
				/>
			)}
		</div>
	);
}
