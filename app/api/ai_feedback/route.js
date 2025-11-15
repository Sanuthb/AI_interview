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
`


export async function POST(request) {
    const {conversation} = await request.json();
    console.log("Received conversation for feedback:", conversation);
    const final_prompt = FEEDBACK_PROMPT_TEMPLATE.replace("{{conversation}}",conversation)
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: final_prompt }] }],
    });
    
    // Enhanced JSON Extraction/Parsing
    let responseText = response.text.trim();
    // Use a regex to find and extract the JSON block
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i);
    
    let jsonString = jsonMatch ? jsonMatch[1].trim() : responseText;
    
    try {
        const json_data = JSON.parse(jsonString);
        return new Response(JSON.stringify(json_data), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (parseError) {
        console.error("JSON Parsing Error:", parseError);
        // Log the raw text that failed to parse for debugging
        console.error("Raw response text:", responseText); 
        return new Response(JSON.stringify({ error: "Failed to parse AI feedback JSON" }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' } 
        });
    }
    } catch (error) {
      console.error("Gemini API Feedback Error:", error);
      return new Response(JSON.stringify({ error: "Failed to generate AI feedback" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      });
    }
}