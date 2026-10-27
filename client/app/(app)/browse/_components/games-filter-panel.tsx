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
import {
	DemoFilterField,
	PercentPositiveField,
	RangeField,
} from "@/components/filters/filter-fields";
import { ChartFilterChipSelect } from "@/app/(app)/chart/_components/chart-filter-chip-select";
import type { ChartFilters, FilterOption } from "@/components/charts/chart-types";
import {
	GAME_LIST_SORTS,
	type GameListSort,
	type SortOrder,
} from "../games-list-types";

interface Props {
	filters: ChartFilters;
	activeFilterCount: number;
	tagOptions: FilterOption[];
	languageOptions: FilterOption[];
	sort: GameListSort;
	order: SortOrder;
	onFilterChange: <Key extends keyof ChartFilters>(
		key: Key,
		value: ChartFilters[Key],
	) => void;
	onReset: () => void;
	onSortChange: (sort: GameListSort) => void;
	onOrderChange: (order: SortOrder) => void;
}

export function GamesFilterPanel({
	filters,
	activeFilterCount,
	tagOptions,
	languageOptions,
	sort,
	order,
	onFilterChange,
	onReset,
	onSortChange,
	onOrderChange,
}: Props) {
	const sortLabel =
		GAME_LIST_SORTS.find((option) => option.value === sort)?.label ?? "";
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
									const next = GAME_LIST_SORTS.find(
										(option) => option.value === value,
									);
									if (next) onSortChange(next.value);
								}}
							>
								{GAME_LIST_SORTS.map((option) => (
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
							label="Release Date"
							type="date"
							value={filters.releaseDate}
							onChange={(value) => onFilterChange("releaseDate", value)}
						/>
						<RangeField
							label="Price"
							type="number"
							min={0}
							step={1}
							tooltip="Price in dollars."
							value={filters.price}
							onChange={(value) => onFilterChange("price", value)}
						/>
						<RangeField
							label="Review Count"
							type="number"
							min={0}
							step={1}
							value={filters.reviewCount}
							onChange={(value) => onFilterChange("reviewCount", value)}
						/>
						<PercentPositiveField
							value={filters.percentPositive}
							onChange={(value) => onFilterChange("percentPositive", value)}
						/>
						<ChartFilterChipSelect
							label="Tags"
							placeholder="Select tags"
							options={tagOptions}
							selectedIds={filters.tags}
							mode={filters.tagsMode}
							onSelectionChange={(ids) => onFilterChange("tags", ids)}
							onModeChange={(mode) => onFilterChange("tagsMode", mode)}
						/>
						<ChartFilterChipSelect
							label="Supported Languages"
							placeholder="Select languages"
							options={languageOptions}
							selectedIds={filters.languages}
							mode={filters.languagesMode}
							onSelectionChange={(ids) => onFilterChange("languages", ids)}
							onModeChange={(mode) => onFilterChange("languagesMode", mode)}
						/>
						<DemoFilterField
							value={filters.isDemo}
							onChange={(value) => onFilterChange("isDemo", value)}
						/>
					</CardContent>
				</Card>
			</CollapsibleContent>
		</Collapsible>
	);
}
