"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";

interface Props {
	page: number;
	totalPages: number;
	total: number;
	disabled: boolean;
	onPageChange: (page: number) => void;
}

export function GamesPagination({
	page,
	totalPages,
	total,
	disabled,
	onPageChange,
}: Props) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<p className="text-sm text-muted-foreground">
				Page {formatCount(page)} of {formatCount(totalPages)} ·{" "}
				{formatCount(total)} {total === 1 ? "game" : "games"}
			</p>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={disabled || page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					<ChevronLeft />
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled || page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Next
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}
