"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { supabase } from "@/services/superbaseClient";
import { useRouter } from "next/navigation";

const page = () => {
  const [USN, setUSN] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let { data, error } = await supabase.from("Users").select("*").eq('USN', USN).eq('password', password).single();

    if (error) {
      toast("Error logging in ");
    } else {
      // MODIFICATION: Save USN to localStorage
      localStorage.setItem('userUSN', data.USN); 
      toast(`${data.USN} logged in`);
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen  bg-gray-50">
      <Card className="w-96 shadow-xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl text-blue-600 text-center font-bold flex items-center justify-center gap-2">
            <User />
            Student Login
          </h1>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input
                id="usn"
                type="text"
                placeholder="1NH24MC119"
                value={USN}
                onChange={(e) => setUSN(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
