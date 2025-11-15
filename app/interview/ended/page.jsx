"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Interview Ended</CardTitle>
          <CardDescription className="text-base">
            Your interview has ended. The transcript and AI feedback have been sent to the HR team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Button onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
