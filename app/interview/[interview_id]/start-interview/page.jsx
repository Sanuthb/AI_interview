"use client";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewContext } from "@/context/InterviewContext";
import React, { useContext, useEffect, useRef, useState } from "react";
import { BotMessageSquare, Mic, Phone } from "lucide-react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import { toast } from "sonner";
import { supabase } from "@/services/superbaseClient";
import { useParams, useRouter } from "next/navigation";

// Utility function to convert duration string (e.g., "15 Min") to milliseconds
const durationToMilliseconds = (durationStr) => {
  if (!durationStr) return 0;
  const [value, unit] = durationStr.split(' ');
  const minutes = parseInt(value, 10);
  if (unit === 'Min') {
    return minutes * 60 * 1000;
  }
  return 0; // Default to 0 if format is unknown
};


const Page = () => {
  const { interviewdata } = useContext(InterviewContext);
  const videoRef = useRef(null);
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
  const { interview_id } = useParams();
  const router = useRouter();
  
  const [callActive, setCallActive] = useState(false);
  const [transcript, setTranscript] = useState([]);

  // Function to save results to Supabase
  const saveResults = async (jobPosition, finalTranscript) => {
    // Attempt to extract the last message as a summary (a simplification)
    // The system prompt advises the AI to wrap up with a summary, so we look for it.
    const summaryMessage = finalTranscript.find(m => m.role === 'assistant' && m.content.length > 200) || 
                           finalTranscript[finalTranscript.length - 1];

    const finalSummary = summaryMessage?.content || "AI summary not explicitly captured. See full transcript.";

    try {
      const { data, error } = await supabase
        .from("interview_results")
        .insert([
          {
            interviewid: Number(interview_id),
            username: interviewdata?.Username,
            jobposition: jobPosition,
            transcript: finalTranscript,
            summary: finalSummary,
          },
        ])
        .select();

      if (error) throw error;
      
      // Provide user feedback with the summary
      toast.success("Interview finished and results saved!");
      toast.info(`Summary: ${finalSummary.substring(0, 100)}...`); 

    } catch (err) {
      console.error("Error saving interview results:", err);
      toast.error("Failed to save interview results.");
    }
  };

  // Vapi Event Handlers
  const handleVapiEvents = (event) => {
    if (event.type === "call-end") {
        toast.info("Interview finished. Saving results...");
        
        // --- CLOSING THE FEEDBACK LOOP ---
        saveResults(interviewdata?.jobposition, transcript);
        
        setCallActive(false);

        // Redirect after saving
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
    }
    
    // Capture and update transcript
    if (event.type === "message" && event.message.content) {
        setTranscript(prev => [...prev, { 
            role: event.message.role, 
            content: event.message.content 
        }]);
    }
  };
  
  const stopInterview = () => {
    if (callActive) {
      vapi.stop(); // This should trigger the "call-end" event handler
      setCallActive(false); 
      toast.info("Manually ending interview...");
    }
  };

  // Setup Vapi Call
  const startCall = () => {
    let questions = [];
    interviewdata?.questionlist.forEach((q) => {
      questions.push(q.question);
    });
    const jobPosition = interviewdata?.jobposition || "Software Developer";

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewdata?.Username}, how are you? Ready for your interview on ${jobPosition}?`,
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
"Hey there! Welcome to your ${jobPosition} interview, let's get started with a few questions!"
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
✅ Ensure the interview remains focused on ${jobPosition}`.trim(),
          },
        ],
      },
    };
    vapi.start(assistantOptions);
    setCallActive(true);
  };
  
  // Handle interview questions, setup Vapi listeners, and set auto-stop timer
  useEffect(() => {
    let timerId;

    if (interviewdata && !callActive) {
      startCall();
      vapi.on("message", handleVapiEvents);
      vapi.on("call-end", handleVapiEvents);

      // --- IMPLEMENT AUTOMATIC CALL TERMINATION ---
      const durationMs = durationToMilliseconds(interviewdata.interviewDuration);
      if (durationMs > 0) {
        toast.info(`Interview will automatically end in ${interviewdata.interviewDuration}.`);
        timerId = setTimeout(() => {
          if (callActive) { // Check again before stopping
            toast.warning(`Time's up! Interview is automatically ending.`);
            stopInterview();
          }
        }, durationMs);
      }

      // Clean up listeners and timer on component unmount
      return () => {
        vapi.off("message", handleVapiEvents);
        vapi.off("call-end", handleVapiEvents);
        clearTimeout(timerId); // Clear timer
        if (callActive) stopInterview();
      };
    }
  }, [interviewdata, callActive]); // Added callActive to dependency array for reliable timer logic

  // Enable user camera
  useEffect(() => {
    const enableMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true, 
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
              autoPlay
              muted
            />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              {interviewdata?.Username || "Candidate"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-6 py-4">
        <Mic className="cursor-not-allowed h-12 w-12 p-2 rounded-full bg-gray-300 shadow-md" />
        <AlertConfirmation
          stopinterview={stopInterview} // Manual stop button calls this
        >
          <Phone className=" cursor-pointer h-12 w-12 p-2 rounded-full bg-red-500  shadow-md" />
        </AlertConfirmation>
      </div>
    </div>
  );
};

export default Page;