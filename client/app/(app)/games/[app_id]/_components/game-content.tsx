"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatCount } from "@/lib/utils";
import type { GameLanguage, GameTag } from "../game-detail-types";

const check = (value: boolean | null) =>
	value ? <span aria-label="yes">✓</span> : <span className="opacity-30">—</span>;

interface Props {
	shortDescription: string | null;
	tags: GameTag[] | null;
}

export function GameContent({ shortDescription, tags }: Props) {
	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>About</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm leading-relaxed">
						{shortDescription || "No description available."}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tags</CardTitle>
					<CardDescription>
						{tags?.length
							? `${formatCount(tags.length)} tags, ordered by how many players applied each`
							: "No tags recorded"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{tags?.length ? (
						<div className="flex flex-wrap gap-2">
							{tags.map((tag) => (
								<span
									key={tag.id}
									className="rounded-md border border-sky-500/70 px-2 py-1 text-sm text-foreground"
								>
									{tag.name}
									{tag.weight > 1 && (
										<span className="ml-1 text-muted-foreground">
											{formatCount(tag.weight)}
										</span>
									)}
								</span>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No tags recorded for this app.
						</p>
					)}
				</CardContent>
			</Card>

		</div>
	);
}

// Full width of its own: the table runs from one row to thirty depending on
// the game, which would otherwise leave a void beside whichever column is shorter
export function GameLanguagesCard({
	languages,
}: {
	languages: GameLanguage[] | null;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Supported Languages</CardTitle>
				<CardDescription>
					{languages?.length
						? `${formatCount(languages.length)} languages`
						: "No language data recorded"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{languages?.length ? (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="py-2 pr-4 font-medium">Language</th>
										<th className="py-2 pr-4 font-medium">Code</th>
										<th className="py-2 pr-4 text-center font-medium">
											Supported
										</th>
										<th className="py-2 pr-4 text-center font-medium">
											Full Audio
										</th>
										<th className="py-2 text-center font-medium">Subtitles</th>
									</tr>
								</thead>
								<tbody>
									{languages.map((language) => (
										<tr
											key={language.code ?? language.name}
											className="border-b last:border-b-0"
										>
											<td className="py-2 pr-4">{language.name}</td>
											<td className="py-2 pr-4 text-muted-foreground">
												{language.code}
											</td>
											<td className="py-2 pr-4 text-center">
												{check(language.supported)}
											</td>
											<td className="py-2 pr-4 text-center">
												{check(language.full_audio)}
											</td>
											<td className="py-2 text-center">
												{check(language.subtitles)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
				) : (
					<p className="text-sm text-muted-foreground">
						No language data recorded for this app.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
