"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

import { AppSidebar } from "./sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
	"/dashboard": "Dashboard",
	"/browse": "Games List",
	"/publishers": "Publisher List",
	"/settings": "Settings",
	"/chart": "Chart Creator",
	"/admin/sync": "Sync Steam Data",
	"/admin/app-settings": "App Settings",
	"/admin/users": "Users",
};

// Dynamic routes cannot be matched exactly, so they fall back to a prefix
const routeTitlePrefixes: [string, string][] = [
	["/games/", "Game Details"],
	["/publishers/", "Publisher Details"],
];

const titleForPath = (pathname: string): string => {
	if (routeTitles[pathname]) {
		return routeTitles[pathname];
	}

	const prefix = routeTitlePrefixes.find(([path]) => pathname.startsWith(path));
	return prefix ? prefix[1] : "Page Title";
};

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="min-h-screen text-foreground">
			<SidebarProvider>
				<AppSidebar />
				<main className="mx-auto w-full min-w-0 min-h-screen">
					<header className="glass sticky top-3 z-10 mx-4 mt-3 flex items-center gap-3 rounded-xl px-3 py-2 md:mx-6">
						<SidebarTrigger className="size-10 cursor-pointer" />
						<Separator orientation="vertical" className="my-2" />
						<h1 className="text-lg font-semibold tracking-tight">
							{titleForPath(pathname)}
						</h1>
						<div className="ml-auto">
							<ThemeToggle />
						</div>
					</header>
					<div className="mt-6 mx-auto w-full flex flex-col justify-center min-h-[88vh] p-8">
						{children}
					</div>
				</main>
			</SidebarProvider>
		</div>
	);
}
