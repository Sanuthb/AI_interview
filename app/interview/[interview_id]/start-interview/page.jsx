"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { InterviewContext } from "@/context/InterviewContext";
import { supabase } from "@/services/superbaseClient";
import { useParams, useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import axios from "axios";

import { Phone, Video, VideoOff, Mic, MicOff, BotMessageSquare } from "lucide-react";
import AlertConfirmation from "./_components/AlertConfirmation";

export default function Page() {
  const { interviewdata } = useContext(InterviewContext);

  const videoRef = useRef(null);
  const vapiRef = useRef(null);
  const handlersRef = useRef({});

  const transcriptRef = useRef([]);
  const hasEndedRef = useRef(false);
  const hasSavedRef = useRef(false);

  const { interview_id } = useParams();
  const router = useRouter();

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [transcriptDump, setTranscriptDump] = useState([]);

  // -------------------------------------------
  // 💡 Enable Camera + Mic (like Google Meet)
  // -------------------------------------------
const enableMedia = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoRef.current) videoRef.current.srcObject = stream;

    setCameraEnabled(true);
    setMicEnabled(true);

    return true;
  } catch (err) {
    console.error("Media permission error:", err);
    toast.error("Please enable camera and microphone to start the interview.");
    return false;
  }
};

  // Disable stream
const disableMedia = () => {
  try {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    setCameraEnabled(false);
    setMicEnabled(false);
  } catch (err) {
    console.log("Failed to disable camera/mic:", err);
  }
};


  // -------------------------------------------
  // 💬 Vapi Event Handler (merged + stable)
  // -------------------------------------------
  const handleVapiEvent = (event) => {
    if (!event) return;

    // When call ends…
    if (event.type === "call-end") {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;

      toast.info("Call ended, saving interview results...");
      endAndSave();
    }

    // Real-time transcript (speech endpoint)
    if (event.type === "speech-update" && event.transcript) {
      const role = event.transcript.speaker === "user" ? "user" : "assistant";
      const text = event.transcript.text;

      if (!text.trim()) return;

      setTranscriptDump((prev) => [...prev, { role, content: text }]);
      transcriptRef.current.push({ role, content: text });
    }

    // Fallback for final assistant messages
    if (event.type === "message" && event.message?.content) {
      const content = event.message.content;
      const text = typeof content === "string" ? content : content.text;

      if (!text?.trim()) return;

      setTranscriptDump((prev) => [...prev, { role: "assistant", content: text }]);
      transcriptRef.current.push({ role: "assistant", content: text });
    }
  };

  // -------------------------------------------
  // Save to Supabase & Redirect
  // -------------------------------------------
  const endAndSave = async () => {
    if (!hasSavedRef.current) {
      hasSavedRef.current = true;

      disableMedia();

      try {
        const finalTranscript = transcriptRef.current;
        const conversation = finalTranscript
          .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
          .join("\n");

        // AI Feedback
        const aiRes = await axios.post("/api/ai-model", {
          context: "feedback",
          conversation,
          jobPosition: interviewdata?.jobposition,
        });

        const summary = aiRes.data.feedback.summary;

        const payload = {
          interviewid: Number(interview_id),
          username: interviewdata.Username,
          jobposition: interviewdata.jobposition,
          transcript: finalTranscript,
          summary,
          feedback: aiRes.data.feedback,
        };

        await supabase.from("interview_results").insert([payload]);

        toast.success("Interview Saved!");
      } catch (err) {
        console.error("Save error:", err);
        toast.error("Failed to save interview");
      }
    }

    router.push("/interview/ended");
  };

  // -------------------------------------------
  // Start Call
  // -------------------------------------------
 const startCall = async () => {
  const mediaAllowed = await enableMedia();

  if (!mediaAllowed) {
    toast.error("Camera & Mic are required to start the interview.");
    return;
  }

  const questions = interviewdata.questionlist.map((q) => q.question);

  const assistantOptions = {
    name: "AI Recruiter",
    firstMessage: `Hi ${interviewdata?.Username}, ready to begin?`,
    transcriber: { provider: "deepgram", model: "nova-2" },
    voice: { provider: "playht", voiceId: "jennifer" },
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Ask questions one at a time.
Questions: ${questions.join("\n")}
End with: INTERVIEW_SUMMARY: <final summary>
        `.trim(),
        },
      ],
    },
  };

  vapiRef.current.start(assistantOptions);
  setCallActive(true);
};

  // -------------------------------------------
  // Manual End Call
  // -------------------------------------------
  const endCall = () => {
    toast.info("Ending the call...");
    try {
      vapiRef.current?.stop();
    } catch {}
    endAndSave();
  };

  // -------------------------------------------
  // Attach Vapi Events on Load
  // -------------------------------------------
  useEffect(() => {
    vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

    const vapi = vapiRef.current;
    handlersRef.current.all = handleVapiEvent;

    vapi.on("message", handleVapiEvent);
    vapi.on("speech-update", handleVapiEvent);
    vapi.on("call-end", handleVapiEvent);

  //   (async () => {
  // const allowed = await enableMedia();
  // if (allowed) startCall();
  // })();


    return () => {
      vapi.off("message", handleVapiEvent);
      vapi.off("speech-update", handleVapiEvent);
      vapi.off("call-end", handleVapiEvent);
      disableMedia();
    };
  }, []);

  // -------------------------------------------
  // UI (Google Meet / Zoom Style)
  // -------------------------------------------
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      {/* TOP BAR */}
      <div className="h-14 bg-black/40 flex items-center justify-between px-6 shadow-lg">
        <h2 className="text-xl font-semibold">AI Interview for {interviewdata?.jobposition}</h2>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6">
        {/* AI PANEL */}
        <div className="relative bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
          <div className="bg-gray-900 p-6 rounded-full shadow-xl">
            <BotMessageSquare size={90} className="text-amber-400" />
          </div>
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            AI Interviewer
          </span>
        </div>

        {/* VIDEO PANEL */}
        <div className="relative bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            {interviewdata?.Username}
          </span>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-20 bg-black/40 flex items-center justify-center gap-6">
        
        {/* MIC TOGGLE */}
        <button
          className={`p-4 rounded-full ${micEnabled ? "bg-gray-700" : "bg-red-600"}`}
          onClick={() => {
            setMicEnabled(!micEnabled);
            enableMedia();
          }}
        >
          {micEnabled ? <Mic /> : <MicOff />}
        </button>

        {/* CAMERA TOGGLE */}
        <button
          className={`p-4 rounded-full ${cameraEnabled ? "bg-gray-700" : "bg-red-600"}`}
          onClick={() => {
            setCameraEnabled(!cameraEnabled);
            enableMedia();
          }}
        >
          {cameraEnabled ? <Video /> : <VideoOff />}
        </button>

        {/* END CALL */}
        <AlertConfirmation stopinterview={endCall}>
          <div className="p-4 rounded-full bg-red-600 hover:bg-red-700">
            <Phone />
          </div>
        </AlertConfirmation>
      </div>
    </div>
  );
}
