"use client";

import Link from "next/link";
import { ChartPie, CloudSync, Gamepad2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const shortcuts = [
	{
		href: "/chart",
		title: "Chart Creator",
		description: "Aggregate the catalog into charts across tags, prices and reviews.",
		icon: ChartPie,
	},
	{
		href: "/browse",
		title: "Games List",
		description: "Search the database and inspect an individual game.",
		icon: Gamepad2,
	},
];

const adminShortcut = {
	href: "/sync",
	title: "Sync Steam Data",
	description: "Pull the latest Steam catalog into the database.",
	icon: CloudSync,
};

export default function DashboardPage() {
	const { user, status } = useAuth();

	const tiles =
		user?.role === "admin" ? [...shortcuts, adminShortcut] : shortcuts;

	return (
		<div className="w-full space-y-6">
			<div className="space-y-1">
				{status === "loading" ? (
					<Skeleton className="h-8 w-64" />
				) : (
					<h2 className="text-2xl font-semibold">
						Welcome back, {user?.username}
					</h2>
				)}
				<p className="text-sm text-muted-foreground">
					Pick up where you left off.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{tiles.map((tile) => (
					<Link key={tile.href} href={tile.href} className="block">
						<Card className="h-full transition-colors hover:border-primary">
							<CardHeader>
								<tile.icon className="size-5 text-muted-foreground" />
								<CardTitle>{tile.title}</CardTitle>
								<CardDescription>{tile.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
