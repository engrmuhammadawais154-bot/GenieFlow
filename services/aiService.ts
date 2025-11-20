export interface AIIntent {
  type: "schedule_meeting" | "convert_currency" | "analyze_expense" | "general";
  entities: Record<string, any>;
  response: string;
}

function analyzeIntent(input: string): AIIntent {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("schedule") || lowerInput.includes("meeting") || lowerInput.includes("event") || lowerInput.includes("remind")) {
    const titleMatch = input.match(/(?:schedule|create|add|set up)\s+(?:a\s+)?(?:meeting|event|reminder)?\s*(?:for\s+)?["']?([^"']+?)["']?(?:\s+(?:on|at|for|tomorrow|today|next))/i);
    const title = titleMatch ? titleMatch[1].trim() : input.replace(/schedule|meeting|event|create|add|set up|remind/gi, '').trim();
    
    return {
      type: "schedule_meeting",
      entities: {
        title: title || "New Event",
        dateTime: new Date(Date.now() + 86400000).toISOString(),
      },
      response: `I'll help you schedule "${title || "your event"}". Please check the Schedule tab to complete the details.`,
    };
  }
  
  if (lowerInput.includes("convert") || lowerInput.includes("currency") || /\d+\s*(usd|eur|gbp|jpy|cad|aud)/i.test(input)) {
    const amountMatch = input.match(/(\d+(?:\.\d+)?)/);
    const fromMatch = input.match(/(?:from\s+)?(\w{3})(?:\s+to)/i) || input.match(/(\d+(?:\.\d+)?)\s*(\w{3})/i);
    const toMatch = input.match(/to\s+(\w{3})/i);
    
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
    const fromCurrency = fromMatch ? fromMatch[fromMatch.length === 3 ? 2 : 1].toUpperCase() : "USD";
    const toCurrency = toMatch ? toMatch[1].toUpperCase() : "EUR";
    
    return {
      type: "convert_currency",
      entities: {
        amount,
        fromCurrency,
        toCurrency,
      },
      response: `Converting ${amount} ${fromCurrency} to ${toCurrency}. Check the Finances tab for the conversion.`,
    };
  }
  
  if (lowerInput.includes("expense") || lowerInput.includes("spend") || lowerInput.includes("transaction") || lowerInput.includes("budget")) {
    return {
      type: "analyze_expense",
      entities: {},
      response: "I can help you analyze your expenses. Check the Finances tab to view your transactions and spending patterns.",
    };
  }
  
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"];
  if (greetings.some(g => lowerInput.includes(g))) {
    return {
      type: "general",
      entities: {},
      response: "Hello! I'm your AI assistant. I can help you:\n• Schedule meetings and events\n• Convert currencies\n• Analyze expenses and finances\n\nWhat would you like to do?",
    };
  }
  
  const questions = ["how are you", "what can you do", "help", "what do you do"];
  if (questions.some(q => lowerInput.includes(q))) {
    return {
      type: "general",
      entities: {},
      response: "I'm here to assist you with:\n\n📅 Scheduling: Create calendar events and reminders\n💱 Currency: Convert between different currencies\n💰 Finances: Track and analyze your expenses\n\nJust tell me what you need!",
    };
  }
  
  return {
    type: "general",
    entities: {},
    response: `I understand you said: "${input}"\n\nI can help you with:\n• Scheduling meetings (try: "schedule a meeting for tomorrow")\n• Converting currency (try: "convert 100 USD to EUR")\n• Analyzing finances (try: "show my expenses")\n\nWhat would you like me to do?`,
  };
}

export async function processUserInput(input: string): Promise<AIIntent> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(analyzeIntent(input));
    }, 500);
  });
}
