import { API_ENDPOINTS } from '@/constants/config';

export interface AIIntent {
  type: "schedule_meeting" | "convert_currency" | "analyze_expense" | "general";
  entities: Record<string, any>;
  response: string;
}

async function callBackendAPI(message: string): Promise<{ response: string; provider: string }> {
  try {
    console.log('Calling backend API:', API_ENDPOINTS.CHAT);
    
    const response = await fetch(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      response: data.response,
      provider: data.provider || 'Backend',
    };
  } catch (error) {
    console.error('Backend API error:', error);
    throw error;
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
  
  try {
    const { response, provider } = await callBackendAPI(input);
    console.log(`Response from ${provider} provider`);

    return {
      type: intentType,
      entities: {},
      response,
    };
  } catch (error) {
    console.error('Failed to get AI response from backend:', error);
    return {
      type: intentType,
      entities: {},
      response: "I'm having trouble connecting to my AI service right now. Please try again in a moment.",
    };
  }
}
