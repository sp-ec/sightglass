"use client";

import {
	ArrowDownWideNarrow,
	ArrowUpDown,
	ArrowUpNarrowWide,
	ChevronDown,
	SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RangeField } from "@/components/filters/filter-fields";
import type { SortOrder } from "@/app/(app)/browse/games-list-types";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import {
	companyListSorts,
	type CompanyFilters,
	type CompanyListSort,
} from "./company-list-types";

interface Props {
	kind: CompanyKind;
	filters: CompanyFilters;
	activeFilterCount: number;
	sort: CompanyListSort;
	order: SortOrder;
	onFilterChange: <Key extends keyof CompanyFilters>(
		key: Key,
		value: CompanyFilters[Key],
	) => void;
	onReset: () => void;
	onSortChange: (sort: CompanyListSort) => void;
	onOrderChange: (order: SortOrder) => void;
}

export function CompaniesFilterPanel({
	kind,
	filters,
	activeFilterCount,
	sort,
	order,
	onFilterChange,
	onReset,
	onSortChange,
	onOrderChange,
}: Props) {
	const sorts = companyListSorts(kind);
	const sortLabel = sorts.find((option) => option.value === sort)?.label ?? "";
	const OrderIcon = order === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;

	return (
		<Collapsible className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<CollapsibleTrigger asChild>
						<Button variant="outline" size="sm" className="group">
							<SlidersHorizontal />
							Filters
							{activeFilterCount > 0 && (
								<Badge variant="secondary">{activeFilterCount}</Badge>
							)}
							<ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
						</Button>
					</CollapsibleTrigger>
					{activeFilterCount > 0 && (
						<Button variant="ghost" size="sm" onClick={onReset}>
							Reset
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<ArrowUpDown />
								Sort: {sortLabel}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-48">
							<DropdownMenuRadioGroup
								value={sort}
								onValueChange={(value) => {
									const next = sorts.find((option) => option.value === value);
									if (next) onSortChange(next.value);
								}}
							>
								{sorts.map((option) => (
									<DropdownMenuRadioItem key={option.value} value={option.value}>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label={order === "asc" ? "Sort ascending" : "Sort descending"}
						title={order === "asc" ? "Ascending" : "Descending"}
						onClick={() => onOrderChange(order === "asc" ? "desc" : "asc")}
					>
						<OrderIcon />
					</Button>
				</div>
			</div>

			<CollapsibleContent>
				<Card>
					<CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
						<RangeField
							label="Total Revenue"
							type="number"
							min={0}
							step={1}
							tooltip="Estimated total revenue in dollars."
							value={filters.revenue}
							onChange={(value) => onFilterChange("revenue", value)}
						/>
						<RangeField
							label={COMPANY_KINDS[kind].gamesLabel}
							type="number"
							min={0}
							step={1}
							tooltip="Demos are not counted."
							value={filters.games}
							onChange={(value) => onFilterChange("games", value)}
						/>
					</CardContent>
				</Card>
			</CollapsibleContent>
		</Collapsible>
	);
}
