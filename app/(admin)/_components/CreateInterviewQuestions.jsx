"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/services/superbaseClient";
import { Button } from "@/components/ui/button";

const CreateInterviewQuestions = ({ formData, goToPrevious,setStep,setinterviewid}) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (formData) {
      generateQuestionList();
    }
  }, [formData]);

  const generateQuestionList = async () => {
    try {
      setLoading(true);
      const result = await axios.post("/api/ai-model", formData);

      if (result?.data?.interviewQuestions) {
        setQuestions(result.data.interviewQuestions);
        toast.success("Interview Questions Generated Successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async () => {
    try {
      const { data, error } = await supabase
        .from("Interviews")
        .insert([
          {
            jobPosition: formData.jobPosition,
            interviewType: formData.interviewType,
            interviewDuration:formData.interviewDuration,
            jobDescription:formData.jobDescription,
            questionlist:questions,
          },
        ])
        .select();
      if (data?.[0]?.id) {
        toast.success("Interview Created Successfully");
        setinterviewid(data[0].id);
        setStep(prev=>prev+1);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save interview");
    }
  };

  return (
    <div className="mt-5 space-y-5">
      {loading && (
        <Card>
          <CardContent>
            <div className="flex flex-col gap-3 justify-center items-center">
              <Loader2Icon className="animate-spin text-primary" />
              <div className="text-center">
                <h2 className="font-semibold">
                  Generating Interview Questions
                </h2>
                <p>
                  AI is crafting personalized questions based on your job
                  position
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Questions */}
      {!loading && questions.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-bold text-lg">Generated Interview Questions</h2>
            <ul className="space-y-2">
              {questions.map((q, index) => (
                <li key={index} className="p-2 border rounded">
                  <span className="font-semibold">{q.type}: </span>
                  {q.question}
                </li>
              ))}
            </ul>
            <div className="flex justify-between p-2">
              <Button className="cursor-pointer" onClick={goToPrevious}>
                prev
              </Button>
              <Button className="cursor-pointer" onClick={onFinish}>
                Save Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateInterviewQuestions;
