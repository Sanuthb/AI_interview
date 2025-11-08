"use client";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewContext } from "@/context/InterviewContext";
import React, { useContext, useEffect, useRef, useState } from "react";
import { BotMessageSquare, Mic, Phone, Timer } from "lucide-react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import { toast } from "sonner";
import { supabase } from "@/services/superbaseClient";
import { useParams, useRouter } from "next/navigation";
import axios from "axios"; // Added for fetching AI feedback

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

// Utility function to format milliseconds to MM:SS
const formatTime = (ms) => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Page = () => {
  const { interviewdata } = useContext(InterviewContext);
  const videoRef = useRef(null);
  // Vapi instance is initialized outside of state/effect
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY); 
  const { interview_id } = useParams();
  const router = useRouter();

  const [callActive, setCallActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [remainingTime, setRemainingTime] = useState(0); // State for the countdown timer

  // Function to save results and call AI for feedback
  const saveResults = async (jobPosition, finalTranscript) => {
    // 1. Prepare conversation string for AI
    const conversation = finalTranscript.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');

    // 2. Call AI for structured feedback
    let feedback = {};
    try {
      const aiResponse = await axios.post("/api/ai-model", {
        context: "feedback",
        conversation: conversation,
        jobPosition: jobPosition
      });
      feedback = aiResponse.data;
      toast.success("AI feedback generated.");
    } catch (e) {
      console.error("AI Feedback Generation Error:", e);
      toast.error("Failed to generate AI feedback. Using fallback data.");
      // Fallback structure for safety
      feedback = {
        feedback: {
          rating: { technicalSkills: 0, communication: 0, problemSolving: 0, experince: 0 },
          summary: "AI analysis unavailable.",
          Recommendation: "Not Recommended",
          RecommendationMsg: "Analysis failed, cannot provide a full recommendation."
        }
      };
    }

    // 3. Save to Supabase
    try {
      const finalSummary = feedback.feedback.summary || "AI summary not explicitly captured. See full transcript.";
      const { data, error } = await supabase
        .from("interview_results")
        .insert([
          {
            interviewid: Number(interview_id),
            username: interviewdata?.Username,
            jobposition: jobPosition,
            transcript: finalTranscript,
            summary: finalSummary,
            feedback: feedback.feedback, // Save the entire structured feedback object
          },
        ])
        .select();

      if (error) throw error;

      // Provide user feedback
      toast.success("Interview finished and results saved!");
      toast.info(`Summary: ${finalSummary.substring(0, 100)}...`);

    } catch (err) {
      console.error("Error saving interview results:", err);
      toast.error("Failed to save interview results.");
    }
  };

  // Vapi Event Handlers
  const handleVapiEvents = (event) => {
    // CRITICAL FIX: Check if event is defined to prevent "Cannot read properties of undefined" error
    if (!event) { 
        console.warn("Received undefined Vapi event. Skipping processing.");
        return;
    }
    
    if (event.type === "call-end") {
      toast.info("Interview finished. Saving results...");
      setCallActive(false);

      // --- CLOSING THE FEEDBACK LOOP ---
      saveResults(interviewdata?.jobposition, transcript);

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
After ${questions.length} questions, wrap up the interview smoothly by summarizing their performance. Example:
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

    // Prevent re-starting a call if one is active or starting
    if (vapi.currentCall?.status === 'active' || vapi.currentCall?.status === 'starting') {
        console.warn("Vapi call is already active or starting. Skipping new call initiation.");
        setCallActive(true);
        return;
    }

    vapi.start(assistantOptions);
    setCallActive(true);
  };


  // Vapi Lifecycle and Timer Handler
  useEffect(() => {
    let timerInterval;

    const startVapiAndTimer = () => {
        if (!interviewdata || callActive) return;

        startCall();
        vapi.on("message", handleVapiEvents);
        vapi.on("call-end", handleVapiEvents);

        // --- SETUP AUTO-STOP TIMER AND UI COUNTDOWN ---
        const durationMs = durationToMilliseconds(interviewdata.interviewDuration);
        setRemainingTime(durationMs);

        if (durationMs > 0) {
            toast.info(`Interview will automatically end in ${interviewdata.interviewDuration}.`);

            const endTime = Date.now() + durationMs;

            timerInterval = setInterval(() => {
                const now = Date.now();
                const timeLeft = endTime - now;

                if (timeLeft <= 1000) {
                    clearInterval(timerInterval);
                    setRemainingTime(0);

                    // Auto-stop logic (only if still active to avoid double-stop)
                    if (vapi.currentCall?.status === 'active') {
                        toast.warning(`Time's up! Interview is automatically ending.`);
                        stopInterview();
                    }
                } else {
                    setRemainingTime(timeLeft);
                }
            }, 1000);
        }
    };

    startVapiAndTimer();

    // Clean up function runs on unmount or when dependencies change
    return () => {
        clearInterval(timerInterval);
        vapi.off("message", handleVapiEvents);
        vapi.off("call-end", handleVapiEvents);

        // **CRITICAL FIX for unhandled errors/multiple instances:**
        // Check if the current call object exists and its status is not 'ended' or 'error'
        if (vapi.currentCall && vapi.currentCall.status !== 'ended' && vapi.currentCall.status !== 'error') {
            console.log(`Cleaning up Vapi call with status: ${vapi.currentCall.status}`);
            vapi.stop(); // Manually stop the call if it's still running
        }
    };
  }, [interviewdata, interview_id, router]); // Dependency array: vapi is stable outside of state

  // Enable user camera (logic remains the same)
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
        // Inform user if media access fails
        toast.error("Microphone/Camera access denied or failed. Please check permissions.");
      }
    };
    enableMedia();
  }, []);

  return (
    <div className="bg-black w-full h-full flex flex-col items-center justify-between overflow-hidden">
        {/* Interview Timer */}
        {interviewdata?.interviewDuration && durationToMilliseconds(interviewdata.interviewDuration) > 0 && (
             <div className="absolute top-4 right-4 bg-primary/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10">
                <Timer className="w-5 h-5" />
                <span className="font-bold text-lg">
                    {formatTime(remainingTime)}
                </span>
            </div>
        )}
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