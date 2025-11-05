import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { School } from "lucide-react";
const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-bold flex items-center justify-center gap-2 capitalize ">
          <School className="text-blue-500" />
          Recruiter process
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;
