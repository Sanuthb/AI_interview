"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InterviewType } from "@/uitls/InterviewType";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FormContainer = ({ onhandleInputChange,goToNext }) => {
  const [InterviewTypeSelected, setInterviewTypeSelected] = React.useState([]);

  useEffect(() => {
    if (InterviewTypeSelected.length > 0) {
      onhandleInputChange("interviewType", InterviewTypeSelected);
    }
  }, [InterviewTypeSelected]);

  return (
    <Card className="p-5 bg-white">
      <CardContent>
        {/* Job Position */}
        <div className="mt-5">
          <h2 className="text-sm">Job Position</h2>
          <Input
            placeholder="eg- fullstack developer"
            className="mt-2"
            onChange={(e) =>
              onhandleInputChange("jobPosition", e.target.value)
            }
          />
        </div>

        {/* Job Description */}
        <div className="mt-5">
          <h1 className="text-sm">Job Description</h1>
          <Textarea
            placeholder="Describe the job position"
            className="h-[200px] mt-2"
            onChange={(e) =>
              onhandleInputChange("jobDescription", e.target.value)
            }
          />
        </div>

        {/* Interview Duration */}
        <div className="mt-5">
          <h1 className="text-sm">Interview Duration</h1>
          <Select
            onValueChange={(value) =>
              onhandleInputChange("interviewDuration", value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2 Min">2 Min</SelectItem>
              <SelectItem value="5 Min">5 Min</SelectItem>
              <SelectItem value="15 Min">15 Min</SelectItem>
              <SelectItem value="30 Min">30 Min</SelectItem>
              <SelectItem value="60 Min">60 Min</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interview Type */}
        <div className="mt-5">
          <h1 className="text-sm">Interview Type</h1>
          <div className="flex gap-3 flex-wrap">
            {InterviewType.map((type) => {
              const isSelected = InterviewTypeSelected.includes(type.value);
              return (
                <div
                  key={type.value}
                  onClick={() =>
                    setInterviewTypeSelected((prev) =>
                      prev.includes(type.value)
                        ? prev.filter((val) => val !== type.value) // toggle off
                        : [...prev, type.value] // toggle on
                    )
                  }
                  className={`cursor-pointer transition-all duration-75 flex items-center gap-3 mt-2 w-fit rounded shadow-md p-2
                    ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    }`}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-7 flex justify-end">
          <Button onClick={goToNext}>
            Generate Question <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormContainer;
