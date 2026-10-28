"use client";

import Link from "next/link";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCents, formatCount } from "@/lib/utils";
import type { PublisherListEntry } from "../publishers-list-types";

export function PublishersTable({
	publishers,
}: {
	publishers: PublisherListEntry[];
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Total Revenue</TableHead>
					<TableHead className="text-right">Median Revenue</TableHead>
					<TableHead className="text-right">Average Revenue</TableHead>
					<TableHead className="text-right">Games Published</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{publishers.map((publisher) => (
					<TableRow key={publisher.id}>
						<TableCell className="max-w-80 truncate font-medium">
							<Link
								href={`/publishers/${publisher.id}`}
								className="hover:text-sky-500 hover:underline"
								title={publisher.name}
							>
								{publisher.name}
							</Link>
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(publisher.total_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(publisher.median_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(publisher.average_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCount(publisher.games_published)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
