"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
	Gamepad2,
	CloudSync,
	ChartPie,
	LayoutDashboard,
	BriefcaseBusiness,
	Tag,
	Telescope,
	Settings2,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { NavSection } from "./nav-section";
import { NavUser } from "./nav-user";

const data = {
	analytics: [
		// {
		// 	name: "Dashboard",
		// 	url: "/dashboard",
		// 	icon: LayoutDashboard,
		// },
		{
			name: "Chart Creator",
			url: "/chart",
			icon: ChartPie,
		},
	],
	market: [
		{
			name: "Games List",
			url: "/browse",
			icon: Gamepad2,
		},
		// {
		// 	name: "Developers & Publishers",
		// 	url: "/browse",
		// 	icon: BriefcaseBusiness,
		// },
		// {
		// 	name: "Tags & Genres",
		// 	url: "/browse",
		// 	icon: Tag,
		// },
	],
	administration: [
		{
			name: "Sync Steam Data",
			url: "/admin/sync",
			icon: CloudSync,
		},
		{
			name: "Users",
			url: "/admin/users",
			icon: Users,
		},
		{
			name: "App Settings",
			url: "/admin/app-settings",
			icon: Settings2,
		},
	],
};

export function AppSidebar() {
	const { user } = useAuth();

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Telescope className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">Sightglass</span>
									<span className="truncate text-xs text-muted-foreground">
										v0.0.1
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavSection title="Workspace & Analytics" sections={data.analytics} />
				<NavSection title="Market Database" sections={data.market} />
				{/* Hidden for normal users; the API enforces the same rule with
				    requireAdmin, so this is presentation only */}
				{user?.role === "admin" && (
					<NavSection title="Administration" sections={data.administration} />
				)}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
