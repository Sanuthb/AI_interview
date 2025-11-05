"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { supabase } from "@/services/superbaseClient";
import { useParams } from "next/navigation";
import { Clock, LoaderIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InterviewContext } from "@/context/InterviewContext";
import { useRouter } from "next/navigation";
const page = () => {
  const [interviewdetails, setinterviewdetails] = useState(null);
  const [username,setusername] = useState("");
  const [loading,setloading]=useState(false);
  const { interview_id } = useParams();
  const {interviewdata,setinterviewdata} = useContext(InterviewContext);
  const router = useRouter();
const fetchInterviewDetails = async () => {
  try {
    const { data, error } = await supabase
      .from("Interviews")
      .select("jobPosition,interviewDuration")
      .eq("id", Number(interview_id))
      .single();

    if (error) throw error;

    setinterviewdetails(data);
  } catch (err) {
    console.error("Error fetching interview details:", err);
  }
};

const takeinterview = async()=>{
  setloading(true)
  try{
    const {data,error} = await supabase
    .from("Interviews")
    .select("*")
    .eq("id",Number(interview_id))
    .single()
    if(error) throw error;
    setinterviewdata({
      Username:username,
      jobposition:data.jobPosition,
      questionlist:data.questionlist
    })
    router.push(`/interview/${interview_id}/start-interview`)
  }catch(err){
    console.error(err);
  }
  finally{
    setloading(false);
  }
}



  useEffect(() => {
    fetchInterviewDetails();
  }, []);
  return (
    <Card className="w-fit h-[calc(75% - 8px)] shadow-md">
      <CardContent className="flex items-center justify-center gap-4 flex-col">
        <Image
          src="/interview.png"
          alt="interviewimg"
          width={300}
          height={200}
        />
        <div className="w-full flex items-center justify-center flex-col gap-3">
          {/* <h1 className="text-xl font-bold">{interviewdetails?.jobPosition}</h1>
          <span className="text-lg"><Clock size={20}/>{interviewdetails?.interviewDuration}</span> */}
          <h1 className="text-xl font-bold">FULL STACK DEVELOPMENT</h1>
          <span className="text-xs font-medium flex gap-2 items-center justify-center"><Clock size={15}/>15 MIN</span>
        </div>
        <div className="w-full gap-3 flex justify-start flex-col">
          <Label>Enter your Name:</Label>
          <Input placeholder="your name" className="w-full" value={username} onChange={(e)=>setusername(e.target.value)}/>
        </div>
        <div className="bg-primary/20 p-3 rounded-xl flex gap-2 flex-col">
        <h1 className="text-lg font-semibold">Before you begin</h1>
            <ul className="pl-10 list-disc text-sm">
              <li>Ensure you have a stable internet connection</li>
              <li>Test your camera and microphone</li>
              <li>Enable fullscreen</li>
              <li>Find a quite place for the interview</li>
            </ul>
        </div>
        <div>
          <Button onClick={()=>takeinterview()}>{loading?<LoaderIcon className="animate-spin"/>:<Play/>}Start Interview</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default page;
