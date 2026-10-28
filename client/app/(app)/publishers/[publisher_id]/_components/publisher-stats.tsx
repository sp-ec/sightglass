"use client";

import { StatTile } from "@/components/util/stat-tile";
import { formatCents, formatCount } from "@/lib/utils";
import type { PublisherSummary } from "../publisher-detail-types";

const cents = (value: number | null) => (value == null ? "—" : formatCents(value));

export function PublisherStats({ publisher }: { publisher: PublisherSummary }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile
				label="Games Published"
				value={
					publisher.games_published == null
						? "—"
						: formatCount(publisher.games_published)
				}
				tooltip="Demos are not counted."
			/>
			<StatTile
				label="Lifetime Est. Revenue"
				value={cents(publisher.total_revenue_in_cents)}
				tooltip="Sum of each game's estimated gross revenue. Demos are left out."
			/>
			<StatTile
				label="Average Revenue"
				value={cents(publisher.average_revenue_in_cents)}
				tooltip="Mean estimated gross revenue per game. Demos are left out."
			/>
			<StatTile
				label="Median Revenue"
				value={cents(publisher.median_revenue_in_cents)}
				tooltip="Median estimated gross revenue per game. Demos are left out."
			/>
		</div>
	);
}
