"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { FaGithub } from "react-icons/fa";

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
			size="icon-xs"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle dark mode"
		>
			<Sun className="size-4 dark:hidden" />
			<Moon className="hidden size-4 dark:block" />
		</Button>
	);
}

function GithubLink() {
	return (
		<Button variant="ghost" size="icon-xs" asChild>
			<a
				href="https://github.com/sp-ec/sightglass"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="View source on GitHub"
			>
				<FaGithub className="size-4" />
			</a>
		</Button>
	);
}

const routeTitles: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/browse": "Games List",
	"/publishers": "Publisher List",
	"/developers": "Developer List",
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
	["/developers/", "Developer Details"],
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
					<header className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b border-sidebar-border bg-sidebar px-2 backdrop-blur-xl">
						<SidebarTrigger className="size-7 cursor-pointer" />
						<Separator orientation="vertical" className="my-2.5" />
						<h1 className="text-sm font-semibold tracking-tight">
							{titleForPath(pathname)}
						</h1>
						<div className="ml-auto flex items-center gap-1">
							<GithubLink />
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
