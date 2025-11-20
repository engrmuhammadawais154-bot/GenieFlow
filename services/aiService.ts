export interface AIIntent {
  type: "schedule_meeting" | "convert_currency" | "analyze_expense" | "general";
  entities: Record<string, any>;
  response: string;
}

export async function processUserInput(input: string): Promise<AIIntent> {
  try {
    const response = await fetch("https://api.replit.com/ai/integrations/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REPL_IDENTITY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users with scheduling, financial tasks, and currency conversion. 
            
Analyze the user's input and determine the intent:
- "schedule_meeting": User wants to create a calendar event (extract: title, dateTime, description)
- "convert_currency": User wants to convert currency (extract: amount, fromCurrency, toCurrency)
- "analyze_expense": User wants expense analysis or categorization
- "general": General conversation

Respond with JSON in this format:
{
  "intent": "schedule_meeting" | "convert_currency" | "analyze_expense" | "general",
  "entities": { extracted entities },
  "response": "friendly message to user"
}

For dates, convert relative dates like "tomorrow", "next week" to actual ISO timestamps.
Today is ${new Date().toISOString()}.`,
          },
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const parsed = JSON.parse(content);

    return {
      type: parsed.intent,
      entities: parsed.entities || {},
      response: parsed.response,
    };
  } catch (error) {
    console.error("AI processing error:", error);
    return {
      type: "general",
      entities: {},
      response: "I'm here to help you with scheduling, finances, and currency conversion. What can I do for you?",
    };
  }
}
