"use client";
import { InterviewContext } from "@/context/InterviewContext";
import React, { useContext, useEffect, useState, useRef } from "react";
import { BotMessageSquare, Mic, Phone, User } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import axios from "axios";

const Page = () => {
  const { interviewdata } = useContext(InterviewContext);

  const vapiRef = useRef(null);

  // store handlers in refs to remove safely
  const handlersRef = useRef({
    message: null,
    speechStart: null,
    speechEnd: null,
    callStart: null,
    callEnd: null,
  });

  const [activeUser, setActiveUser] = useState(false);
  const [messages, setMessages] = useState([]);
  const [callActive, setCallActive] = useState(false);

  // init Vapi
  useEffect(() => {
    vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
  }, []);

  // SAFE CLEANUP — no undefined listeners
  const cleanupListeners = () => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const h = handlersRef.current;

    if (h.message) vapi.off("message", h.message);
    if (h.speechStart) vapi.off("speech-start", h.speechStart);
    if (h.speechEnd) vapi.off("speech-end", h.speechEnd);
    if (h.callStart) vapi.off("call-start", h.callStart);
    if (h.callEnd) vapi.off("call-end", h.callEnd);

    // reset handler refs
    handlersRef.current = {
      message: null,
      speechStart: null,
      speechEnd: null,
      callStart: null,
      callEnd: null,
    };
  };

  // start call
  const startCall = async () => {
    if (!interviewdata || !vapiRef.current) return;

    setMessages([]);
    setCallActive(true);

    const questions = interviewdata.questionlist.map((q) => q.question);
    const jobPosition = interviewdata.jobposition || "Software Developer";

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewdata?.Username}, ready for your interview on ${jobPosition}?`,
      transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
      voice: { provider: "playht", voiceId: "jennifer" },
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
Ask questions one by one.
Questions: ${questions.join("\n")}

End with:
INTERVIEW_SUMMARY: <summary here>
        `.trim(),
          },
        ],
      },
    };

    vapiRef.current.start(assistantOptions);
  };

  // end call
  const endCall = () => {
    const vapi = vapiRef.current;
    cleanupListeners(); // safe

    setCallActive(false);

    try {
      if (vapi?.isConnected()) vapi.stop();
    } catch (err) {
      console.log("Call already ended.");
    }
  };

  // send transcript to feedback API
  const generateFeedback = async () => {
    if (messages.length === 0) return toast.error("No conversation captured.");

    try {
      const res = await axios.post("/api/ai_feedback", {
        conversation: JSON.stringify(messages),
      });

      toast.success("Feedback generated!");
      console.log(res.data);
    } catch (err) {
      toast.error("Feedback generation failed.");
      console.error(err);
    }
  };

  // REGISTER VAPI EVENTS SAFELY
  useEffect(() => {
    if (!vapiRef.current) return;
    const vapi = vapiRef.current;

    const handleMessage = (msg) => {
      if (!callActive) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleSpeechStart = () => setActiveUser(false);
    const handleSpeechEnd = () => setActiveUser(true);

    const handleCallStart = () => toast.success("Interview Started");

    const handleCallEnd = () => {
      toast.success("Interview Ended");
      cleanupListeners();
      setCallActive(false);
      generateFeedback();
    };

    // store handlers so cleanup works
    handlersRef.current.message = handleMessage;
    handlersRef.current.speechStart = handleSpeechStart;
    handlersRef.current.speechEnd = handleSpeechEnd;
    handlersRef.current.callStart = handleCallStart;
    handlersRef.current.callEnd = handleCallEnd;

    // attach safely
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);

    return cleanupListeners;
  }, [callActive]);

  useEffect(() => {
    if (interviewdata) startCall();
  }, [interviewdata]);

  return (
    <div className="p-20 lg:px-48 xl:px-56 bg-amber-100 h-full w-full">
      <h2 className="font-bold text-xl">AI Interview Session</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full h-full">
        <div className="flex bg-white items-center justify-center w-full h-2/3 rounded-2xl flex-col gap-2">
          <div className="relative">
            {!activeUser && (
              <span className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-75" />
            )}
            <BotMessageSquare size={50} />
          </div>
          <h2>Interviewer</h2>
        </div>

        <div className="flex-col gap-2 flex bg-white items-center justify-center w-full h-2/3 rounded-2xl">
          <div className="relative">
            {activeUser && (
              <span className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-75" />
            )}
            <User size={50} />
          </div>
          <h2>{interviewdata?.Username || "User"}</h2>
        </div>
      </div>

      <div className="w-full flex items-center justify-center gap-3">
        <button className="bg-red-500 rounded-full p-2 w-10 h-10">
          <Mic />
        </button>

        <button onClick={endCall} className="bg-red-500 rounded-full p-2 w-10 h-10">
          <Phone />
        </button>
      </div>
    </div>
  );
};

export default Page;
