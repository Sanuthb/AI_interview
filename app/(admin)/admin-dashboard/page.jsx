import React from "react";
import WelcomeComponent from "../_components/WelcomeComponent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Video,Plus } from "lucide-react";
import Createinterview from "../_components/Createinterview";
const Page = () => {
  return (
    <div className="bg-gray-100 w-full max-w-full min-h-screen p-4 space-y-6">
      <WelcomeComponent />

      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <Card className="shadow-md">
        <CardHeader>
          <div className="bg-[var(--primary)]/20 text-[var(--primary)] w-fit p-2 rounded-lg"><Video /></div>
          <CardTitle>Create New Interview</CardTitle>
          <CardDescription>
           Create AI powered interviews and schedule them with candidates.
          </CardDescription>
        </CardHeader>
        
      </Card>
      <div>
        <Createinterview/>
      </div>
    </div>
  );
};

export default Page;
