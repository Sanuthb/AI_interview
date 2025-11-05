"use client";
import { Children, createContext, useState } from "react";

export const InterviewContext = createContext();

export default function InterviewProvider({ children }) {
  const [interviewdata, setinterviewdata] = useState({
    Username:"",
    jobposition:"",
    questionlist: []
  });
  const contextvalue = { interviewdata, setinterviewdata };
  return (
    <InterviewContext.Provider value={contextvalue}>
      {children}
    </InterviewContext.Provider>
  );
}
