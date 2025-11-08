import PROMPT from "@/uitls/QuestionPrompt";
import { GoogleGenAI } from "@google/genai";
import { ResponseStream } from "openai/lib/responses/ResponseStream";

// New prompt constant for feedback
const FEEDBACK_PROMPT_TEMPLATE = `
Depends on this interview Conversation between assistant and user,
Give me feedback for user interview. Give me rating out of 10 for technicalSkills,
communication, problemSolving, experince. Also give me summery in 3 lines
about the interview and one line to let me know whether is recommanded
for hire or not with msg. Give me response in JSON format
{
    "feedback": {
        "rating": {
            "technicalSkills": [number 0-10],
            "communication": [number 0-10],
            "problemSolving": [number 0-10],
            "experince": [number 0-10]
        },
        "summary": "in 3 line summary",
        "Recommendation": "Recommended" | "Not Recommended",
        "RecommendationMsg": "One line message."
    }
}
Conversation: 
{{conversation}}
Job Position: {{jobPosition}}
`

export async function POST(request) {
  const data = await request.json();
  const { context, jobPosition, conversation } = data;

  if (context === "feedback") {
    // --- New Feedback Logic ---
    const FINAL_PROMPT = FEEDBACK_PROMPT_TEMPLATE
      .replace("{{conversation}}", conversation)
      .replace("{{jobPosition}}", jobPosition)
      + "\n\nReturn the result strictly as valid JSON.";

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: FINAL_PROMPT }] }],
      });
      const formatted_response = response.text.replace(/```json|```/g, "").trim();
      
      // Attempt to parse to ensure it's valid JSON before sending
      const json_data = JSON.parse(formatted_response);
      return new Response(JSON.stringify(json_data), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
      console.error("Gemini API Feedback Error:", error);
      // Return a 500 status code with a JSON error response
      return new Response(JSON.stringify({ error: "Failed to generate AI feedback" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } else {
    // --- Existing Question Generation Logic ---
    const { interviewType, interviewDuration, jobDescription } = data;
    
    const FINAL_PROMPT = PROMPT.replace("{{jobTitle}}", jobPosition)
      .replace("{{type}}", interviewType)
      .replace("{{duration}}", interviewDuration)
      .replace("{{jobDescription}}", jobDescription)
      + "\n\nReturn the result strictly as valid JSON.";

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: FINAL_PROMPT }] }],
      });
      const formatted_response = response.text.replace(/```json|```/g, "").trim();
      
      return new Response(formatted_response, { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error("Gemini API Question Error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }
}