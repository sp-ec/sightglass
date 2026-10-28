"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatCount } from "@/lib/utils";
import type { PublisherTagCount } from "../publisher-detail-types";

const COLLAPSED_TAG_COUNT = 30;

export function PublisherTags({ tags }: { tags: PublisherTagCount[] }) {
	const [expanded, setExpanded] = React.useState(false);
	const visibleTags = expanded ? tags : tags.slice(0, COLLAPSED_TAG_COUNT);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tags</CardTitle>
				<CardDescription>
					{tags.length
						? `${formatCount(tags.length)} tags, ordered by how many of this publisher's games carry each`
						: "No tags recorded"}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-start gap-3">
				{tags.length ? (
					<div className="flex flex-wrap gap-2">
						{visibleTags.map((tag) => (
							<span
								key={tag.id}
								className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sm text-foreground"
							>
								{tag.name}
								<span className="ml-1 text-muted-foreground">
									{formatCount(tag.game_count)}
								</span>
							</span>
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						No tags recorded for this publisher&apos;s games.
					</p>
				)}

				{tags.length > COLLAPSED_TAG_COUNT && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setExpanded((current) => !current)}
					>
						{expanded ? "Show fewer" : `Show all ${formatCount(tags.length)}`}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
