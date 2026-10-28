"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toneForScore } from "@/components/util/review-tone";
import {
	formatCents,
	formatCount,
	formatPrice,
	formatReleaseDate,
} from "@/lib/utils";
import type { NamedEntity } from "@/app/(app)/games/[app_id]/game-detail-types";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import type { CompanyGame } from "./company-detail-types";

// Steam does not ship every capsule, so a missing or broken small capsule
// falls back to the header before the placeholder
function GameCapsule({ game }: { game: CompanyGame }) {
	const [failedSrcs, setFailedSrcs] = React.useState<string[]>([]);
	const capsule =
		[game.small_capsule, game.header].find(
			(src): src is string => !!src && !failedSrcs.includes(src),
		) ?? null;

	return (
		<div className="relative h-[45px] w-[120px] overflow-hidden rounded bg-muted">
			{capsule ? (
				<Image
					key={capsule}
					src={capsule}
					alt=""
					fill
					sizes="120px"
					className="object-cover"
					onError={() => setFailedSrcs((current) => [...current, capsule])}
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center text-muted-foreground">
					<ImageOff className="size-4" />
				</div>
			)}
		</div>
	);
}

function CompanyLinks({
	kind,
	companies,
}: {
	kind: CompanyKind;
	companies: NamedEntity[];
}) {
	if (!companies.length) {
		return "—";
	}

	return companies.map((company, index) => (
		<React.Fragment key={company.id}>
			{index > 0 && ", "}
			<Link
				href={`${COMPANY_KINDS[kind].path}/${company.id}`}
				className="hover:text-sky-500 hover:underline"
			>
				{company.name}
			</Link>
		</React.Fragment>
	));
}

function GameRow({ game }: { game: CompanyGame }) {
	const tone = toneForScore(game.review_score);
	const hasReviews = (game.review_count ?? 0) > 0;

	return (
		<TableRow>
			<TableCell>
				<Link href={`/games/${game.app_id}`}>
					<GameCapsule game={game} />
				</Link>
			</TableCell>
			<TableCell className="max-w-56 truncate font-medium">
				<Link
					href={`/games/${game.app_id}`}
					className="hover:text-sky-500 hover:underline"
					title={game.name}
				>
					{game.name}
				</Link>
			</TableCell>
			<TableCell className="text-right tabular-nums">
				<div className="font-medium">
					{game.estimated_revenue_in_cents == null
						? "—"
						: formatCents(game.estimated_revenue_in_cents)}
				</div>
				<div className="text-muted-foreground">
					{game.estimated_units == null
						? "—"
						: `${formatCount(game.estimated_units)} copies`}
				</div>
			</TableCell>
			<TableCell className="text-right tabular-nums">
				{game.price_in_cents == null
					? "—"
					: game.price_in_cents > 0
						? formatPrice(game.price_in_cents)
						: "Free"}
			</TableCell>
			<TableCell className="text-muted-foreground">
				{game.steam_release_date
					? formatReleaseDate(game.steam_release_date)
					: "Unknown"}
			</TableCell>
			<TableCell className={`text-right tabular-nums ${tone.text}`}>
				{hasReviews && game.percent_positive != null
					? `${game.percent_positive}%`
					: "—"}
			</TableCell>
			<TableCell className="max-w-40 whitespace-normal">
				<CompanyLinks kind="developer" companies={game.developers} />
			</TableCell>
			<TableCell className="max-w-40 whitespace-normal">
				<CompanyLinks kind="publisher" companies={game.publishers} />
			</TableCell>
			<TableCell className="min-w-56 whitespace-normal">
				<div className="flex flex-wrap gap-1">
					{game.tags.map((tag) => (
						<Badge key={tag} variant="outline">
							{tag}
						</Badge>
					))}
				</div>
			</TableCell>
		</TableRow>
	);
}

export function CompanyGamesTable({ games }: { games: CompanyGame[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						<span className="sr-only">Capsule</span>
					</TableHead>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Est. Revenue / Copies</TableHead>
					<TableHead className="text-right">Price</TableHead>
					<TableHead>Release Date</TableHead>
					<TableHead className="text-right">Positive</TableHead>
					<TableHead>Developer</TableHead>
					<TableHead>Publisher</TableHead>
					<TableHead>Top Tags</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{games.map((game) => (
					<GameRow key={game.app_id} game={game} />
				))}
			</TableBody>
		</Table>
	);
}
