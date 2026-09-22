import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RelatedApp = { app_id: number; name: string } | null;

type Props = {
	isDemo: boolean;
	parentApp: RelatedApp;
	demoApp: RelatedApp;
};

// A demo points back at its parent game; a full game points at its demo
function GameRelatedApps({ isDemo, parentApp, demoApp }: Props) {
	const related = isDemo ? parentApp : demoApp;
	if (!related) {
		return <></>;
	}

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>{isDemo ? "Full Game" : "Demo"}</CardTitle>
			</CardHeader>
			<CardContent>
				<Link
					href={`/games/${related.app_id}`}
					className="flex flex-row items-center gap-1 underline underline-offset-4"
				>
					{related.name}
					<ArrowUpRight className="size-4" />
				</Link>
			</CardContent>
		</Card>
	);
}

export default GameRelatedApps;
