"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/services/superbaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, User, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
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


const Page = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Fetch all interview results
                const { data, error } = await supabase
                    .from("interview_results")
                    .select("id, username, jobposition, created_at") 
                    .order("created_at", { ascending: false });
                
                if (error) throw error;
                
                setResults(data || []);
            } catch (err) {
                console.error("Error fetching interview results:", err);
                toast.error("Failed to fetch interview results.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="bg-gray-100 w-full max-w-full min-h-screen p-4 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <ListChecks className="w-7 h-7 text-primary" /> Completed Interview Results
            </h1>

            {results.length === 0 ? (
                <Card className="shadow-md">
                    <CardContent className="py-8 text-center">
                        <p className="text-gray-500 text-lg">
                            No interviews have been completed yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result) => (
                        <Card key={result.id} className="shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl">{result.jobposition}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <User className="w-4 h-4" /> Candidate: {result.username}
                                </CardDescription>
                                <CardDescription className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Date: {new Date(result.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* MODIFICATION: Link to the new detailed report page */}
                                <Button 
                                    onClick={() => router.push(`/admin-interviewresults/${result.id}`)} 
                                    className="w-full"
                                >
                                    <FileText className="w-4 h-4 mr-2" /> View Detailed Report
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Page;