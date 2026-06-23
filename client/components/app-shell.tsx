"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

import { AppSidebar } from "./sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@/components/ui/separator";

const navigation = [
	{ href: "/queries", label: "Queries" },
	{ href: "/settings", label: "Settings" },
];

function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle dark mode"
		>
			<Sun className="size-4 dark:hidden" />
			<Moon className="hidden size-4 dark:block" />
		</Button>
	);
}

const routeTitles: Record<string, string> = {
	"/sync": "Sync Steam Data",
	"/browse": "Browse Games",
};

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SidebarProvider>
				<AppSidebar />
				<main className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
					<header className="flex items-center gap-4">
						<SidebarTrigger className="cursor-pointer" />
						<Separator orientation="vertical" />
						<h1 className="text-sm font-semibold">
							{routeTitles[pathname] || "Page Title"}
						</h1>
					</header>

					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}
