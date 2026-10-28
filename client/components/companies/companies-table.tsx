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
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import type { CompanyListEntry } from "./company-list-types";

export function CompaniesTable({
	kind,
	companies,
}: {
	kind: CompanyKind;
	companies: CompanyListEntry[];
}) {
	const { path, gamesLabel } = COMPANY_KINDS[kind];

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Total Revenue</TableHead>
					<TableHead className="text-right">Median Revenue</TableHead>
					<TableHead className="text-right">Average Revenue</TableHead>
					<TableHead className="text-right">{gamesLabel}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{companies.map((company) => (
					<TableRow key={company.id}>
						<TableCell className="max-w-80 truncate font-medium">
							<Link
								href={`${path}/${company.id}`}
								className="hover:text-sky-500 hover:underline"
								title={company.name}
							>
								{company.name}
							</Link>
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(company.total_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(company.median_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCents(company.average_revenue_in_cents)}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{formatCount(company.games_published)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
