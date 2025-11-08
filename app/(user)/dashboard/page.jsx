"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/services/superbaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Briefcase, Play, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardPage = () => {
  const router = useRouter();
  const [assignedInterviews, setAssignedInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUSN, setUserUSN] = useState(null);

  useEffect(() => {
    // 1. Get USN from localStorage (set during login)
    const usn = localStorage.getItem('userUSN');
    if (!usn) {
      toast.error("User session expired. Please log in.");
      router.push('/auth');
      return;
    }
    setUserUSN(usn);

    // 2. Fetch assigned interviews
    const fetchAssignedInterviews = async () => {
      try {
        // Fetch interview IDs assigned to the current user
        const { data: assignments, error: assignmentError } = await supabase
          .from("interview_candidates")
          .select("interviewid")
          .eq("USN", usn);

        if (assignmentError) throw assignmentError;

        const interviewIds = assignments.map(a => a.interviewid);

        if (interviewIds.length === 0) { // FIX: Handle empty array explicitly
          setAssignedInterviews([]);
          setLoading(false);
          return;
        }

        // Fetch details for those interviews
        const { data: interviewsData, error: interviewsError } = await supabase
          .from("Interviews")
          .select("id, jobPosition, interviewDuration, jobDescription")
          .in("id", interviewIds);
        
        if (interviewsError) throw interviewsError;

        // Fetch results to filter out completed interviews
        const { data: results, error: resultsError } = await supabase
            .from("interview_results")
            .select("interviewid")
            .in("interviewid", interviewIds)
            .eq("username", usn);

        if (resultsError) throw resultsError;
        
        // Filter out interviews that are already in the results table
        const completedIds = new Set(results.map(r => r.interviewid));
        const pendingInterviews = interviewsData.filter(i => !completedIds.has(i.id));

        setAssignedInterviews(pendingInterviews);
      } catch (err) {
        // FIX: Improved error logging to capture the full error details
        console.error("Error fetching interviews:", JSON.stringify(err, null, 2));
        toast.error("Failed to fetch assigned interviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedInterviews();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Welcome, {userUSN || 'Candidate'}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  
  const welcomeText = userUSN ? `Welcome, ${userUSN}` : "Welcome to your Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{welcomeText}</h1>

      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
        <Briefcase className='w-6 h-6'/> Pending Interviews
      </h2>

      {assignedInterviews.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 text-lg">
              You currently have no pending interviews assigned.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedInterviews.map((interview) => (
            <Card key={interview.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{interview.jobPosition}</CardTitle>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {interview.interviewDuration}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <p className="text-gray-600 mb-4 flex-1">
                  {interview.jobDescription.length > 100
                    ? `${interview.jobDescription.slice(0, 100)}...`
                    : interview.jobDescription}
                </p>
                <Button 
                  onClick={() => router.push(`/interview/${interview.id}`)}
                  className="mt-auto"
                >
                  <Play className="w-4 h-4 mr-2" /> Start Interview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;