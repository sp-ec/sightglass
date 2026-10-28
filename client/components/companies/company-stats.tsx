"use client";

import { StatTile } from "@/components/util/stat-tile";
import { formatCents, formatCount } from "@/lib/utils";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import type { CompanySummary } from "./company-detail-types";

const cents = (value: number | null) => (value == null ? "—" : formatCents(value));

export function CompanyStats({
	kind,
	company,
}: {
	kind: CompanyKind;
	company: CompanySummary;
}) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile
				label={COMPANY_KINDS[kind].gamesLabel}
				value={
					company.games_published == null
						? "—"
						: formatCount(company.games_published)
				}
				tooltip="Demos are not counted."
			/>
			<StatTile
				label="Lifetime Est. Revenue"
				value={cents(company.total_revenue_in_cents)}
				tooltip="Sum of each game's estimated gross revenue. Demos are left out."
			/>
			<StatTile
				label="Average Revenue"
				value={cents(company.average_revenue_in_cents)}
				tooltip="Mean estimated gross revenue per game. Demos are left out."
			/>
			<StatTile
				label="Median Revenue"
				value={cents(company.median_revenue_in_cents)}
				tooltip="Median estimated gross revenue per game. Demos are left out."
			/>
		</div>
	);
}
