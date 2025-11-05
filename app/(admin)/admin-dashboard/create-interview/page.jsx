"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Progress } from "@/components/ui/Progress";
import FormContainer from "../../_components/FormContainer";
import CreateInterviewQuestions from "../../_components/CreateInterviewQuestions";
import { toast } from "sonner";
import AssignInterview from "../../_components/AssignInterview";

const page = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fromData, setFormData] = useState();
  const [interviewid, setinterviewid] = useState();
  const onhandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const goToNext = () => {
    if (
      !fromData?.jobPosition ||
      !fromData?.interviewType ||
      !fromData?.interviewDuration ||
      !fromData?.jobDescription
    ) {
      toast.error("Please fill all the fields");
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <div className="mt-5 lg:px-10">
      <div className="flex gap-2 items-center ">
        <ArrowLeft onClick={() => router.back()} className="cursor-pointer" />
        <h2 className="font-bold text-xl">Create new Interview</h2>
      </div>
      <Progress value={step * 33.33} className="mt-5" />
      {step == 1 ? (
        <FormContainer
          onhandleInputChange={onhandleInputChange}
          goToNext={goToNext}
        />
      ) : step == 2 ? (
        <CreateInterviewQuestions
          formData={fromData}
          goToPrevious={goToPrevious}
          setStep={setStep}
          setinterviewid={setinterviewid}
        />
      ) : (
        <AssignInterview goToPrevious={goToPrevious} interviewId={interviewid}/>
      )}
    </div>
  );
};

export default page;
