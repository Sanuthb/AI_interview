"use client";

import { createContext, useState } from "react";

export const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  const [conversation, setConversation] = useState([]);

  const appendMessage = (msg) => {
    setConversation(prev => [...prev, msg]);
  };

  const replaceConversation = (fullConv) => {
    setConversation(fullConv);
  };

  const clearConversation = () => setConversation([]);

  return (
    <ConversationContext.Provider value={{
      conversation,
      appendMessage,
      replaceConversation,
      clearConversation
    }}>
      {children}
    </ConversationContext.Provider>
  );
}
