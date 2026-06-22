"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { AppSidebar } from "./sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

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

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* <header className="border-b bg-card/20 flex">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/queries" className="text-lg font-semibold tracking-tight">
              Steam Analyzer
            </Link>
            <nav className="flex items-center gap-2">
              {navigation.map((item) => {
                const active = pathname === item.href;

                return (
                  <Button key={item.href} asChild variant={active ? "default" : "ghost"} size="lg">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                );
              })}
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header> */}
			<SidebarProvider >
				<AppSidebar />
				<main className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
					<SidebarTrigger />
					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}
