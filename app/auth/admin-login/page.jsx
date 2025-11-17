"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input"; 
import Image from "next/image";
import { toast } from "sonner";
import { supabase } from "@/services/superbaseClient";
import { useRouter } from "next/navigation";
import { User } from "lucide-react"; 

const AdminLoginPage = () => {
  const [USN, setUSN] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    router.push("/admin-dashboard")
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Card className="w-96 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center">
            <Image 
              src={"/college_logo.png"} 
              alt={"College Logo"} 
              width={200} 
              height={200} 
              className="mx-auto" 
            />
          </div>
          
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="text-[#192f59]"/>
            Admin Login
          </CardTitle>
          <CardDescription>
            Enter your Name and Password to access your assigned interviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="eg:admin"
                value={USN}
                onChange={(e) => setUSN(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;