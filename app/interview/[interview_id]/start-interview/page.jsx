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
import axios from "axios"; // Added for fetching AI feedback

const Page = () => {
  const { interviewdata } = useContext(InterviewContext);
  const videoRef = useRef(null);
  // Stable Vapi instance
  const vapiRef = useRef(null);
  const { interview_id } = useParams();
  const router = useRouter();

  const [callActive, setCallActive] = useState(false);
  // transcript now holds objects like: { role: 'user', content: 'hello' }
  const [transcript, setTranscript] = useState([]); 
  // Guards to avoid duplicate starts/saves and prevent restart after end
  const hasStartedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const hasSavedRef = useRef(false);
  const transcriptRef = useRef([]); // Ref for final saving

  // Close user's camera/mic
  const closeCamera = () => {
    try {
      const stream = videoRef.current?.srcObject;
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn("Failed to close camera:", e);
    }
  };

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
      // Store student display name inside feedback for admin display
      try {
        if (feedback && feedback.feedback) {
          feedback.feedback.candidateName = interviewdata?.Username || "";
        }
      } catch (_) {}

      // Use USN for username field so user dashboard filters work
      const userUSN = (typeof window !== 'undefined') ? localStorage.getItem('userUSN') : null;
      const usernameForDB = userUSN || interviewdata?.Username || "";
      const payload = {
        interviewid: Number(interview_id),
        username: usernameForDB,
        jobposition: jobPosition,
        transcript: finalTranscript,
        summary: finalSummary,
        feedback: feedback.feedback, // Save the entire structured feedback object
      };

      // Avoid .select() after insert to prevent RLS select permission issues
      const { error } = await supabase
        .from("interview_results")
        .insert([payload]);

      if (error) throw error;

      // Provide user feedback
      toast.success("Interview finished and results saved!");
      toast.info(`Summary: ${finalSummary.substring(0, 100)}...`);

    } catch (err) {
      console.error("Error saving interview results:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
      });
      toast.error("Failed to save interview results.");
    }
  };

  // Vapi Event Handlers
  const handleVapiEvents = (event) => {
    // CRITICAL FIX: Guard clause for TypeError: Cannot read properties of undefined
    if (!event) { 
        console.warn("Received undefined Vapi event. Skipping processing.");
        return;
    }
    // TEMP DEBUG: Observe raw events to validate payload shapes
    try { console.debug("[Vapi] Event:", JSON.parse(JSON.stringify(event))); } catch (_) { console.debug("[Vapi] Event:", event); }
    
    if (event.type === "call-end") {
      hasEndedRef.current = true;
      toast.info("Interview finished. Saving results...");
      setCallActive(false);

      // --- CLOSING THE FEEDBACK LOOP ---
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        // Ensure only final transcripts are used for saving
        saveResults(interviewdata?.jobposition, transcriptRef.current.filter(t => t.content && t.content.trim().length > 0));
      }
      // Close camera and go to end screen
      closeCamera();
      router.push('/interview/ended');
    }

    // =================================================================
    // 🎤 RELIABLE TRANSCRIPTION CAPTURE using 'speech-update' (User and AI speech)
    // =================================================================
    if (event.type === "speech-update" && event.transcript) {
        // Vapi event uses 'speaker', we map it to 'role'
        const role = (event.transcript.speaker === "user") ? "user" : "assistant";
        const text = event.transcript.text;
        
        if (text && text.trim().length > 0) {
            setTranscript((prev) => {
                const last = prev[prev.length - 1];
                
                // If the last message was from the same speaker AND is a partial update,
                // update the last entry to prevent a long list of partial updates.
                if (last && last.role === role && !event.transcript.final) {
                    const updatedTranscript = [...prev.slice(0, -1), { role, content: text }];
                    transcriptRef.current = updatedTranscript;
                    return updatedTranscript;
                }
                
                // Otherwise (new speaker or final thought), add a new message.
                const next = [...prev, { role, content: text }];
                transcriptRef.current = next;
                return next;
            });
        }
    }
    
    // =================================================================
    // 💬 Fallback/Final Message Capture for model outputs
    // This catches responses that might not be audio-only (e.g., tool calls, text)
    // =================================================================
    else if (event.type === "message" && event.message) {
      const role = event.message.role || "assistant";
      const rawContent = event.message.content;

      // Normalize content: handle string or array/object payloads
      let text = "";
      if (typeof rawContent === "string") {
        text = rawContent;
      } else if (typeof rawContent === "object" && rawContent !== null) {
        // Simple extraction for text/content fields
        text = rawContent.text || rawContent.content || "";
      }

      if (text && text.trim().length > 0) {
        setTranscript((prev) => {
          // Check if speech-update already captured this final text (to avoid duplicates)
          const last = prev[prev.length - 1];
          if (last && last.role === role && last.content.includes(text.substring(0, Math.min(text.length, 20)))) return prev;
          
          const next = [...prev, { role, content: text }];
          transcriptRef.current = next;
          return next;
        });
      }
    }
  };
  
  const stopInterview = () => {
    if (callActive) {
      vapiRef.current?.stop(); // This should trigger the "call-end" event handler
      setCallActive(false);
      toast.info("Manually ending interview...");
      hasEndedRef.current = true;
      // Save and navigate immediately as a reliable manual flow (guarded to run once)
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        saveResults(interviewdata?.jobposition, transcriptRef.current.filter(t => t.content && t.content.trim().length > 0));
      }
      closeCamera();
      router.push('/interview/ended');
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
    if (vapiRef.current?.currentCall?.status === 'active' || vapiRef.current?.currentCall?.status === 'starting') {
        console.warn("Vapi call is already active or starting. Skipping new call initiation.");
        setCallActive(true);
        return;
    }

    vapiRef.current.start(assistantOptions);
    setCallActive(true);
  };

  // Vapi Lifecycle (no timer)
  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
    }
    
    // CRITICAL: Attach ALL necessary listeners here
    vapiRef.current.on("message", handleVapiEvents);
    vapiRef.current.on("call-end", handleVapiEvents);
    vapiRef.current.on("speech-update", handleVapiEvents); // <-- The reliable transcription listener

    const startVapi = () => {
      if (!interviewdata) return;
      if (hasEndedRef.current) return; // do not auto-start after end
      if (hasStartedRef.current) return; // already started once
      hasStartedRef.current = true;
      startCall();
    };

    startVapi();

    // Clean up function runs on unmount or when dependencies change
    return () => {
      if (!vapiRef.current) return;
      vapiRef.current.off("message", handleVapiEvents);
      vapiRef.current.off("call-end", handleVapiEvents);
      vapiRef.current.off("speech-update", handleVapiEvents); // <-- Remove listener on cleanup

      if (vapiRef.current.currentCall && vapiRef.current.currentCall.status !== 'ended' && vapiRef.current.currentCall.status !== 'error') {
        console.log(`Cleaning up Vapi call with status: ${vapiRef.current.currentCall.status}`);
        vapiRef.current.stop();
      }
    };
  }, [interviewdata, interview_id, router]);

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
      
      {/* Live Transcript Display - Shows all conversation for debugging/UX */}
      <div className="bg-white/10 text-white p-4 w-full max-w-6xl overflow-y-scroll max-h-40 rounded-lg my-4">
        <h3 className="text-sm font-bold mb-2">Live Transcript:</h3>
        {transcript.length === 0 ? (
          <p className="text-xs text-gray-400">Waiting for conversation to begin...</p>
        ) : (
          transcript.map((msg, index) => (
            <p key={index} className={`text-xs ${msg.role === 'user' ? 'text-green-300' : 'text-amber-300'}`}>
              <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong> {msg.content}
            </p>
          ))
        )}
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