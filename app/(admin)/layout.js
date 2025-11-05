import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/app/(admin)/_components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut  } from "lucide-react";

export default function Layout({ children }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-h-screen bg-gray-50">
          <div className="bg-white flex items-center justify-between p-2 ">
            <SidebarTrigger />
            <Button variant="default" className="bg-red-400"><LogOut />Logout</Button>
          </div>
          {children}
        </main>
      </SidebarProvider>
    </>
  );
}
