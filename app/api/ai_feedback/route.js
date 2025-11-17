import { GoogleGenAI } from "@google/genai";

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
`;

export async function POST(request) {
  const { conversation } = await request.json();
  const final_prompt = FEEDBACK_PROMPT_TEMPLATE.replace("{{conversation}}", conversation);

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // ⚡ More stable than 2.5
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: final_prompt }] }],
    });

    let responseText = response.text.trim();

    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i);
    let jsonString = jsonMatch ? jsonMatch[1].trim() : responseText;

    try {
      const json_data = JSON.parse(jsonString);
      return new Response(JSON.stringify(json_data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Feedback generated but parsing failed",
          raw: responseText,
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Gemini Feedback Error:", error);

    // ⚠️ Fallback to avoid losing interview results
    return new Response(
      JSON.stringify({
        feedback: {
          rating: {
            technicalSkills: 0,
            communication: 0,
            problemSolving: 0,
            experince: 0,
          },
          summary: "Unable to generate feedback at the moment.",
          Recommendation: "Not Available",
          RecommendationMsg: "AI feedback service was temporarily unavailable.",
        },
      }),
      { status: 200 }
    );
  }
}
