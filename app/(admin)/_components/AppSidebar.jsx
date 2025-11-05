"use client";

import { Button } from "@/components/ui/button";
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
import { Plus, School, FileText, ClipboardCheck,LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const AppSidebar = () => {
  const pathname = usePathname();
  const router =useRouter()

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col gap-4 mt-5">
        <h1 className="text-lg font-bold flex items-center justify-center gap-2 capitalize ">
          <School className="text-[var(--primary)]" />
          Recruiter process
        </h1>
        <Button onClick={()=>{router.push("/admin-dashboard/create-interview")}} className="w-full cursor-pointer" variant="default">
          <Plus />
          Create Interview
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-10">
        <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/admin-dashboard"
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  pathname === "/admin-dashboard"
                    ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "hover:bg-muted"
                )}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/admin-analyzeresume"
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  pathname === "/admin-analyzeresume"
                    ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "hover:bg-muted"
                )}
              >
                <FileText size={18} />
                Analyze Resume
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/admin-interviewresults"
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  pathname === "/admin-interviewresults"
                    ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "hover:bg-muted"
                )}
              >
                <ClipboardCheck size={18} />
                Interview Results
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;
