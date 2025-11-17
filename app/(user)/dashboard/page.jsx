"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/services/superbaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Briefcase, Play, Loader2Icon, CheckCircle2, AlertCircle, LogOut, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// --- Custom Components/Data Fetching ---

const TABS = {
  PENDING: 'pending',
  COMPLETED: 'completed'
};

const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
            <Card key={index} className="shadow-md">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
            </Card>
        ))}
    </div>
);

// --- Main Dashboard Page ---

const DashboardPage = () => {
  const router = useRouter();
  const [pendingInterviews, setPendingInterviews] = useState([]);
  const [completedInterviews, setCompletedInterviews] = useState([]); // New state for completed
  const [loading, setLoading] = useState(true);
  const [userUSN, setUserUSN] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PENDING);

  // Helper to determine score color for UI
  const getRatingColor = (score) => {
    if (score > 8) return 'text-green-600 bg-green-50';
    if (score > 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  // LOGOUT HANDLER
  const handleLogout = () => {
      localStorage.removeItem('userUSN');
      toast.info("Logged out successfully.");
      router.push('/auth');
  }

  // DATA FETCHING LOGIC
  const fetchInterviews = useCallback(async (usn) => {
    try {
      // 1. Fetch all assigned interview IDs for the user
      const { data: assignments, error: assignmentError } = await supabase
        .from("interview_candidates")
        .select("interviewid")
        .eq("USN", usn);

      if (assignmentError) throw assignmentError;
      const interviewIds = assignments.map(a => a.interviewid);

      if (interviewIds.length === 0) {
        setPendingInterviews([]);
        setCompletedInterviews([]);
        return;
      }

      // 2. Fetch all details for those interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from("Interviews")
        .select("id, jobPosition, interviewDuration, jobDescription")
        .in("id", interviewIds);
      
      if (interviewsError) throw interviewsError;

      // 3. Fetch all results for these interviews
      const { data: results, error: resultsError } = await supabase
          .from("interview_results")
          .select("id, interviewid, jobposition, created_at, feedback")
          .in("interviewid", interviewIds)
          .eq("username", usn);

      if (resultsError) throw resultsError;
      
      const completedIds = new Set(results.map(r => r.interviewid));
      
      // Separate lists
      const pending = interviewsData.filter(i => !completedIds.has(i.id));
      const completed = interviewsData
        .filter(i => completedIds.has(i.id))
        .map(i => {
            const result = results.find(r => r.interviewid === i.id);
            return {
                ...i,
                resultId: result?.id,
                feedback: result?.feedback || null,
                completed_at: result?.created_at,
            };
        });

      setPendingInterviews(pending);
      setCompletedInterviews(completed);
    } catch (err) {
      console.error("Error fetching interviews:", JSON.stringify(err, null, 2));
      toast.error("Failed to fetch assigned interviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const usn = localStorage.getItem('userUSN');
    if (!usn) {
      toast.error("User session expired. Please log in.");
      router.push('/auth');
      return;
    }
    setUserUSN(usn);
    fetchInterviews(usn);
  }, [router, fetchInterviews]);

  if (loading) {
    // FIX HYDRATION ERROR: Revert to the simpler, consistent SSR class name 
    // and make the welcome message static during loading to prevent mismatch.
    return (
      <div className="p-6 space-y-4"> 
        <div className='flex justify-between items-center'>
            {/* Generic Welcome text */}
            <h1 className="text-3xl font-bold">Welcome, Candidate</h1>
            <Skeleton className="h-10 w-24" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }
  
  const welcomeText = userUSN ? `Welcome, ${userUSN}` : "Welcome to your Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header and Logout */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{welcomeText}</h1>
        <Button onClick={handleLogout} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab(TABS.PENDING)}
          className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
            activeTab === TABS.PENDING
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Interviews ({pendingInterviews.length})
        </button>
        <button
          onClick={() => setActiveTab(TABS.COMPLETED)}
          className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
            activeTab === TABS.COMPLETED
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed Interviews ({completedInterviews.length})
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === TABS.PENDING && (
          <PendingInterviewsList 
            interviews={pendingInterviews} 
            router={router} 
          />
        )}
        {activeTab === TABS.COMPLETED && (
          <CompletedInterviewsList 
            interviews={completedInterviews} 
            getRatingColor={getRatingColor} 
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;


// --- Sub-components for Clarity ---

const PendingInterviewsList = ({ interviews, router }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary">
                <Briefcase className='w-6 h-6'/> Interviews To Take
            </h2>
            {interviews.length === 0 ? (
                <Card className="shadow-md border-2 border-dashed border-gray-300">
                    <CardContent className="py-8 text-center">
                        <p className="text-gray-500 text-lg">
                            You currently have no pending interviews assigned. Great job!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interviews.map((interview) => (
                        <Card key={interview.id} className="shadow-lg hover:shadow-xl transition-all border-l-4 border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl">{interview.jobPosition}</CardTitle>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Expected Duration: {interview.interviewDuration}
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col h-full space-y-4">
                                <p className="text-gray-600 flex-1 text-sm">
                                    {interview.jobDescription.length > 100
                                        ? `${interview.jobDescription.slice(0, 100)}...`
                                        : interview.jobDescription}
                                </p>
                                <Button 
                                    onClick={() => router.push(`/interview/${interview.id}`)}
                                    className="mt-auto w-full bg-primary hover:bg-primary/90 transition-colors"
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

const CompletedInterviewsList = ({ interviews, getRatingColor }) => {
    const router = useRouter();

    const getOverallScore = (feedback) => {
        if (!feedback?.rating) return 0;
        const scores = Object.values(feedback.rating);
        const sum = scores.reduce((acc, curr) => acc + curr, 0);
        return Math.round(sum / scores.length); // Average score out of 10
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString();
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-green-600">
                <CheckCircle2 className='w-6 h-6'/> Past Interviews
            </h2>
            {interviews.length === 0 ? (
                <Card className="shadow-md border-2 border-dashed border-gray-300">
                    <CardContent className="py-8 text-center">
                        <p className="text-gray-500 text-lg">
                            No completed interviews found yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {interviews.map((interview) => {
                        const score = getOverallScore(interview.feedback);
                        const recommendation = interview.feedback?.Recommendation || 'Analysis Pending';

                        return (
                            <Card 
                                key={interview.id} 
                                className="shadow-lg transition-all border-l-4 border-green-500 w-80"
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{interview.jobPosition}</CardTitle>
                                        <div className={`px-3 py-1 rounded-full font-bold text-xs ${getRatingColor(score)}`}>
                                            {score}/10
                                        </div>
                                    </div>
                                    <CardDescription className="flex items-center gap-1 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        Completed: {formatTimestamp(interview.completed_at)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        {recommendation === 'Recommended' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <span className={`font-semibold ${recommendation === 'Recommended' ? 'text-green-700' : 'text-red-700'}`}>
                                            {recommendation}
                                        </span>
                                    </div>
                                    <Separator />
                                    <Button 
                                        onClick={() => router.push(`/admin-interviewresults/${interview.resultId}`)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" /> View Feedback
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};