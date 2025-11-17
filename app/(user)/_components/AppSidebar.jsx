"use client"; // Required for usePathname and Link component

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
import { LayoutDashboard } from "lucide-react"; // Import LayoutDashboard icon
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx"; // For conditional class names

const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-center items-center">
          <Image
            src={"/college_logo.png"}
            alt={"College Logo"}
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/dashboard"
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  pathname === "/dashboard"
                    ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "hover:bg-muted"
                )}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;