"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/services/superbaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, User, Clock, MessageSquare, Bot, Star, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const DetailedReportPage = () => {
    const { resultId } = useParams();
    const router = useRouter();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!resultId) return;

            try {
                // Fetch a single, complete interview result
                const { data, error } = await supabase
                    .from("interview_results")
                    .select("*") 
                    .eq("id", Number(resultId))
                    .single();
                
                if (error) throw error;
                
                setReport(data);
            } catch (err) {
                console.error("Error fetching detailed report:", err);
                toast.error("Failed to load interview report.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [resultId]);

    if (loading) {
        return <div className="p-6 text-center"><p>Loading Interview Report...</p></div>;
    }

    if (!report) {
        return <div className="p-6 text-center"><p>Report not found for ID: {resultId}</p></div>;
    }

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
    }
    
    // Safely access feedback data
    const feedbackData = report.feedback || {};
    const rating = feedbackData.rating || {};
    const isRecommended = feedbackData.Recommendation === 'Recommended';

    const getRatingColor = (score) => {
        if (score > 8) return 'text-green-600';
        if (score > 5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-gray-100 w-full min-h-screen p-4 space-y-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        <CardTitle className="text-3xl">Interview Report: {report.jobposition}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> Candidate: {report.username}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Date: {formatTimestamp(report.created_at)}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* AI Feedback Card - NEW SECTION */}
            {feedbackData.rating ? (
                <Card className="shadow-md border-2" style={{ borderColor: isRecommended ? '#10B981' : '#EF4444' }}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className={`w-5 h-5 ${isRecommended ? 'text-green-600' : 'text-red-600'}`} />
                                <CardTitle className="text-xl">AI Feedback & Rating</CardTitle>
                            </div>
                            <div className={`px-3 py-1 rounded-full font-bold text-white ${isRecommended ? 'bg-green-500' : 'bg-red-500'}`}>
                                {feedbackData.Recommendation}
                            </div>
                        </div>
                        <CardDescription>{feedbackData.RecommendationMsg}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Star className="w-4 h-4" /> Performance Breakdown (Out of 10)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Object.entries(rating).map(([key, value]) => (
                                <div key={key} className="p-3 bg-gray-50 rounded-lg text-center">
                                    <p className="text-sm font-medium capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                    <p className={`text-2xl font-bold ${getRatingColor(value)}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Bot className="w-4 h-4" /> Summary</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{feedbackData.summary}</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-md">
                     <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-gray-500" />
                            <CardTitle className="text-xl text-gray-500">AI Performance Summary</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <p className="whitespace-pre-wrap">{report.summary || "No structured summary or feedback was captured for this interview."}</p>
                    </CardContent>
                </Card>
            )}

            {/* Transcript Card */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">Full Transcript</CardTitle>
                    <CardDescription>A detailed record of the conversation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.isArray(report.transcript) && report.transcript.map((msg, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className={`font-bold uppercase flex-shrink-0 w-20 text-right ${msg.role === 'assistant' ? 'text-primary' : 'text-gray-700'}`}>
                                {msg.role}:
                            </div>
                            <div className={`flex-1 p-2 rounded-lg ${msg.role === 'assistant' ? 'bg-primary/10' : 'bg-gray-50'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {!Array.isArray(report.transcript) && <p>Transcript data is corrupted or empty.</p>}
                </CardContent>
            </Card>
        </div>
    );
};

export default DetailedReportPage;