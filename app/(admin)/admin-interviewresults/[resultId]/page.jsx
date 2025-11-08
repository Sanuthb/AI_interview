"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/services/superbaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, User, Clock, MessageSquare, Bot } from "lucide-react";
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

            {/* AI Summary Card */}
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-xl text-green-600">AI Performance Summary</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{report.summary || "No structured summary was captured for this interview."}</p>
                </CardContent>
            </Card>

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