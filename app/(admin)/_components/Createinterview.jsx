"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Video, Plus, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/superbaseClient";

const CreateInterview = () => {
  const router = useRouter();
  const [recentData, setRecentData] = useState([]);

  const fetchRecentInterview = async () => {
    try {
      const { data, error } = await supabase
        .from("Interviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      setRecentData(data || []);
    } catch (err) {
      console.error("Error fetching recent interviews:", err);
    }
  };

  useEffect(() => {
    fetchRecentInterview();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recently Created Interviews</h1>
        <Button
          onClick={() => router.push("/admin-dashboard/create-interview")}
          className="flex items-center gap-2 bg-[var(--primary)] text-white"
        >
          <Plus /> Create New Interview
        </Button>
      </div>

      {recentData.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center gap-5 py-10">
            <Video className="text-[var(--primary)] w-14 h-14" />
            <h2 className="text-xl font-semibold">No Interviews Created Yet</h2>
            <p className="text-gray-500">
              Start creating interviews to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentData.map((interview) => (
            <Card key={interview.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="flex flex-col justify-between h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-[var(--primary)] text-white">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{interview.jobPosition}</h2>
                    <p className="text-sm text-gray-500">
                      {interview.interviewDuration}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  {interview.jobDescription.length > 100
                    ? `${interview.jobDescription.slice(0, 100)}...`
                    : interview.jobDescription}
                </p>

                <div className="mt-auto flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    {new Date(interview.created_at).toLocaleDateString()} • {new Date(interview.created_at).toLocaleTimeString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin-dashboard/interview/${interview.id}`)
                    }
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <FileOutput className="w-4 h-4" /> View Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateInterview;
