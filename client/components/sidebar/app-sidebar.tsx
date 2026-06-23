import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { Gamepad2, CloudSync, LibraryBig } from "lucide-react";
import { NavData } from "./nav-data";

const data = {
	navData: [
		{
			name: "Sync Steam Data",
			url: "sync",
			icon: CloudSync,
		},
		{
			name: "Browse Games",
			url: "browse",
			icon: LibraryBig,
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
                  <Gamepad2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Steam Analyzer</span>
                  <span className="text-xs opacity-50">v0.0.1</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavData sections={data.navData} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}