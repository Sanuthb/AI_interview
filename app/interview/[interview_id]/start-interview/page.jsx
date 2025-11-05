"use client";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewContext } from "@/context/InterviewContext";
import React, { useContext, useEffect, useRef } from "react";
import { BotMessageSquare, Mic, Phone } from "lucide-react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";

const Page = () => {
  const { interviewdata } = useContext(InterviewContext);
  const videoRef = useRef(null);
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

  // Handle interview questions
  useEffect(() => {
    if (interviewdata) {
      startCall();
    }
  }, [interviewdata]);

  const startCall = () => {
    let questions = [];
    interviewdata?.questionlist.forEach((q) => {
      questions.push(q.question);
    });
    console.log("Interview Questions:", questions.join(", "));

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewdata?.Username}, how are you? Ready for your interview on ${interviewdata?.jobposition}?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ${interviewdata?.jobposition} interview, let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below are the questions: {{questionList}}
Questions: ${questions}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"What do you think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"

Key guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React`.trim(),
          },
        ],
      },
    };
    vapi.start(assistantOptions);
  };
  // Enable user camera
  useEffect(() => {
    const enableMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true, // ✅ enable mic
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    enableMedia();
  }, []);
  return (
    <div className="bg-black w-full h-full flex flex-col items-center justify-between overflow-hidden">
      {/* Main video section */}
      <div className="flex items-center justify-center gap-8 w-full max-w-6xl flex-1">
        {/* Interviewer card */}
        <Card className="w-1/2 aspect-video rounded-2xl shadow-lg overflow-hidden relative bg-amber-200">
          <CardContent className="flex items-center justify-center w-full h-full p-0">
            <div className="flex flex-col items-center justify-center">
              <div className="shadow-md shadow-primary p-4 rounded-full bg-primary text-white flex items-center justify-center">
                <BotMessageSquare size={50} />
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              Interviewer
            </div>
          </CardContent>
        </Card>

        {/* User card */}
        <Card className="w-1/2 aspect-video rounded-2xl shadow-lg overflow-hidden relative bg-white">
          <CardContent className="p-0 w-full h-full relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-2xl"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              {interviewdata?.Username || "user001"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-6 py-4">
        <Mic className="cursor-not-allowed h-12 w-12 p-2 rounded-full bg-gray-300 shadow-md" />
        <AlertConfirmation
          stopinterview={() => {
            vapi.stop();
          }}
        >
          <Phone className=" cursor-pointer h-12 w-12 p-2 rounded-full bg-red-500  shadow-md" />
        </AlertConfirmation>
      </div>
    </div>
  );
};

export default Page;