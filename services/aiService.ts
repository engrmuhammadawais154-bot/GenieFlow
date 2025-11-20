export interface AIIntent {
  type: "schedule_meeting" | "convert_currency" | "analyze_expense" | "general";
  entities: Record<string, any>;
  response: string;
}

// SECURITY NOTE: This implementation calls Gemini API directly from the client.
// For production use, move this to a backend server to protect the API key.
// The API key in process.env will be bundled into the JavaScript, making it
// accessible to anyone who inspects the app bundle or network traffic.
async function callGeminiAPI(input: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const systemPrompt = `You are a helpful AI assistant integrated into a mobile app. The app has three main features:
1. Schedule - for creating calendar events and reminders
2. Finances - for tracking expenses, currency conversion, and financial analysis
3. Chat - where you interact with users

When users ask about scheduling, meetings, or events, encourage them to check the Schedule tab.
When users ask about money, expenses, currency conversion, or finances, mention the Finances tab.
Be concise, friendly, and helpful. Keep responses brief and conversational.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser: ${input}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error("No response from Gemini");
    }

    return aiResponse.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

function detectIntent(input: string): AIIntent["type"] {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("schedule") || lowerInput.includes("meeting") || lowerInput.includes("event") || lowerInput.includes("remind") || lowerInput.includes("calendar")) {
    return "schedule_meeting";
  }
  
  if (lowerInput.includes("convert") || lowerInput.includes("currency") || /\d+\s*(usd|eur|gbp|jpy|cad|aud)/i.test(input)) {
    return "convert_currency";
  }
  
  if (lowerInput.includes("expense") || lowerInput.includes("spend") || lowerInput.includes("transaction") || lowerInput.includes("budget") || lowerInput.includes("finance") || lowerInput.includes("money")) {
    return "analyze_expense";
  }
  
  return "general";
}

export async function processUserInput(input: string): Promise<AIIntent> {
  const intentType = detectIntent(input);
  const geminiResponse = await callGeminiAPI(input);

  return {
    type: intentType,
    entities: {},
    response: geminiResponse,
  };
}
