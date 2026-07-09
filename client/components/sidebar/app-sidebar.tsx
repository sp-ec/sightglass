import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
	Gamepad2,
	CloudSync,
	LibraryBig,
	SquarePlus,
	ChartPie,
	LayoutDashboard,
	BriefcaseBusiness,
	Tag,
	Telescope,
} from "lucide-react";
import { NavSection } from "./nav-section";

const data = {
	analytics: [
		{
			name: "Dashboard",
			url: "query",
			icon: LayoutDashboard,
		},
		{
			name: "Chart Creator",
			url: "chart",
			icon: ChartPie,
		},
	],
	market: [
		{
			name: "Games List",
			url: "browse",
			icon: Gamepad2,
		},
		{
			name: "Developers & Publishers",
			url: "browse",
			icon: BriefcaseBusiness,
		},
		{
			name: "Tags & Genres",
			url: "browse",
			icon: Tag,
		},
	],
	administration: [
		{
			name: "Sync Steam Data",
			url: "sync",
			icon: CloudSync,
		},
	],
};

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Telescope className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">SteamScope</span>
									<span className="truncate text-xs text-muted-foreground">
										v0.0.1
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavSection title="Workspace & Analytics" sections={data.analytics} />
				<NavSection title="Market Database" sections={data.market} />
				<NavSection title="Administration" sections={data.administration} />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
