import PROMPT from "@/uitls/QuestionPrompt";
import { GoogleGenAI } from "@google/genai";
import { ResponseStream } from "openai/lib/responses/ResponseStream";

export async function POST(request) {
  const { jobPosition, interviewType, interviewDuration, jobDescription } =
    await request.json();

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
    const fomarted_response = response.text.replace(/```json|```/g, "").trim();
    return new Response(fomarted_response, { status: 200 });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
