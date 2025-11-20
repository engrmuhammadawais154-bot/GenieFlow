export interface AIIntent {
  type: "schedule_meeting" | "convert_currency" | "analyze_expense" | "general";
  entities: Record<string, any>;
  response: string;
}

// SECURITY NOTE: This implementation calls AI APIs directly from the client.
// For production use, move this to a backend server to protect the API keys.
// The API keys in process.env will be bundled into the JavaScript, making them
// accessible to anyone who inspects the app bundle or network traffic.

// ============================================================================
// Financial Domain Guard
// ============================================================================
// Ensures all AI interactions stay within financial context

const FINANCIAL_SYSTEM_PROMPT = `You are a financial AI assistant for a personal finance management app. You ONLY help with:
- Expense tracking and budgeting
- Currency conversion and exchange rates
- Financial planning and savings advice
- Transaction categorization
- Investment tracking and portfolio analysis
- Banking and financial questions
- Scheduling finance-related meetings

If the user asks about topics outside of personal finance, politely redirect them by saying: "I'm a financial assistant and can only help with money, budgeting, expenses, investments, and finance-related topics. How can I assist with your finances today?"

Keep responses concise, friendly, and focused on helping users manage their money better.`;

function isFinancialQuery(input: string): boolean {
  const lowerInput = input.toLowerCase();
  const financialKeywords = [
    'money', 'expense', 'budget', 'finance', 'currency', 'convert', 'transaction',
    'spend', 'save', 'invest', 'stock', 'price', 'cost', 'payment', 'bank',
    'account', 'balance', 'income', 'revenue', 'profit', 'loss', 'tax',
    'financial', 'dollar', 'euro', 'yen', 'pound', 'exchange', 'rate'
  ];
  
  return financialKeywords.some(keyword => lowerInput.includes(keyword));
}

function enforceFinancialContext(input: string): string {
  // Add financial context prefix to guide the AI
  return `${input}\n\n(Remember: Only provide finance-related assistance)`;
}

function validateFinancialResponse(response: string, originalInput: string): string {
  // If response seems to be refusing non-financial queries, it's good
  const refusalPhrases = [
    "financial assistant",
    "only help with",
    "finance-related",
    "money",
    "budgeting"
  ];
  
  const isRefusal = refusalPhrases.some(phrase => 
    response.toLowerCase().includes(phrase)
  );
  
  // If it's a refusal or the query was financial, allow the response
  if (isRefusal || isFinancialQuery(originalInput)) {
    return response;
  }
  
  // Otherwise, add a gentle redirect
  return "I'm a financial assistant and can only help with money, budgeting, expenses, investments, and finance-related topics. How can I assist with your finances today?";
}

// ============================================================================
// Retry Utility with Exponential Backoff
// ============================================================================

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  factor: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    factor: 2,
  }
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < options.maxAttempts - 1) {
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(
          options.baseDelay * Math.pow(options.factor, attempt),
          options.maxDelay
        );
        const jitter = Math.random() * 0.3 * exponentialDelay;
        const delay = exponentialDelay + jitter;
        
        console.log(`Retry attempt ${attempt + 1}/${options.maxAttempts} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Retry failed");
}

// ============================================================================
// AI Provider Interface
// ============================================================================

interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateResponse(input: string): Promise<string>;
}

// ============================================================================
// Gemini Provider
// ============================================================================

class GeminiProvider implements AIProvider {
  name = "Gemini";
  
  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
  
  async generateResponse(input: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

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
                  text: `${FINANCIAL_SYSTEM_PROMPT}\n\nUser: ${input}`,
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
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error("No response from Gemini");
    }

    return aiResponse.trim();
  }
}

// ============================================================================
// OpenAI Provider
// ============================================================================

class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
  
  async generateResponse(input: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: FINANCIAL_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: input,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    return aiResponse.trim();
  }
}

// ============================================================================
// Local Finance Fallback
// ============================================================================

class LocalFinanceFallback implements AIProvider {
  name = "Local";
  
  isAvailable(): boolean {
    return true; // Always available
  }
  
  async generateResponse(input: string): Promise<string> {
    const lowerInput = input.toLowerCase();
    
    // Check if query is finance-related
    if (!isFinancialQuery(input)) {
      return "I'm a financial assistant and can only help with money, budgeting, expenses, investments, and finance-related topics. How can I assist with your finances today?";
    }
    
    // Provide basic financial guidance based on keywords
    if (lowerInput.includes("budget")) {
      return "Creating a budget is essential for financial health! Track your income and expenses in the Finances tab. I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.";
    }
    
    if (lowerInput.includes("save") || lowerInput.includes("saving")) {
      return "Great question about savings! Start by setting aside at least 20% of your income. Build an emergency fund covering 3-6 months of expenses, then focus on long-term goals. Use the Finances tab to track your progress.";
    }
    
    if (lowerInput.includes("expense") || lowerInput.includes("spend")) {
      return "Track your expenses in the Finances tab to see where your money goes. Categorizing transactions helps identify areas where you can cut back. Small daily expenses often add up more than you think!";
    }
    
    if (lowerInput.includes("invest")) {
      return "Investing is important for long-term wealth building. Consider starting with low-cost index funds, diversify your portfolio, and think long-term. Track your investments in the Finances tab. Always research before investing!";
    }
    
    if (lowerInput.includes("currency") || lowerInput.includes("convert")) {
      return "You can convert currencies in the Finances tab! I'll help you get real-time exchange rates for accurate conversions between different currencies.";
    }
    
    // Default financial response
    return "I can help you with budgeting, expense tracking, currency conversion, savings advice, and investment monitoring. Check out the Finances tab to manage your transactions and see detailed insights. What specific financial question do you have?";
  }
}

// ============================================================================
// AI Orchestrator
// ============================================================================

const providers: AIProvider[] = [
  new GeminiProvider(),
  new OpenAIProvider(),
  new LocalFinanceFallback(),
];

async function callAIWithFallback(input: string): Promise<{ response: string; provider: string }> {
  // Apply financial context guard
  const contextualInput = enforceFinancialContext(input);
  
  // Try each provider in sequence
  for (const provider of providers) {
    if (!provider.isAvailable()) {
      console.log(`${provider.name} provider not available, skipping...`);
      continue;
    }
    
    try {
      console.log(`Trying ${provider.name} provider...`);
      
      const response = await retryWithBackoff(
        () => provider.generateResponse(contextualInput),
        {
          maxAttempts: 3,
          baseDelay: 500,
          maxDelay: 5000,
          factor: 2,
        }
      );
      
      // Validate response is finance-focused
      const validatedResponse = validateFinancialResponse(response, input);
      
      console.log(`✓ ${provider.name} provider succeeded`);
      return {
        response: validatedResponse,
        provider: provider.name,
      };
    } catch (error) {
      console.error(`${provider.name} provider failed:`, error);
      // Continue to next provider
    }
  }
  
  // This should never happen since LocalFinanceFallback is always available
  return {
    response: "I'm having trouble connecting right now. Please try again in a moment.",
    provider: "Error",
  };
}

// ============================================================================
// Intent Detection
// ============================================================================

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

// ============================================================================
// Public API
// ============================================================================

export async function processUserInput(input: string): Promise<AIIntent> {
  const intentType = detectIntent(input);
  const { response, provider } = await callAIWithFallback(input);

  // Log which provider was used (helpful for debugging)
  console.log(`Response from ${provider} provider`);

  return {
    type: intentType,
    entities: {},
    response,
  };
}
