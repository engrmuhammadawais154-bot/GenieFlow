import { logger } from '../utils/logger';

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateResponse(input: string): Promise<string>;
}

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

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000);
        const jitter = Math.random() * 0.3 * delay;
        logger.debug(`Retry attempt ${attempt + 1}/${maxAttempts} after ${Math.round(delay + jitter)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

class GeminiProvider implements AIProvider {
  name = 'Gemini';

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateResponse(input: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    return aiResponse.trim();
  }
}

class OpenAIProvider implements AIProvider {
  name = 'OpenAI';

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateResponse(input: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: FINANCIAL_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return aiResponse.trim();
  }
}

class LocalFallbackProvider implements AIProvider {
  name = 'Local';

  isAvailable(): boolean {
    return true;
  }

  async generateResponse(input: string): Promise<string> {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('budget')) {
      return 'Creating a budget is essential for financial health! Track your income and expenses in the Finances tab. I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.';
    }

    if (lowerInput.includes('save') || lowerInput.includes('saving')) {
      return 'Great question about savings! Start by setting aside at least 20% of your income. Build an emergency fund covering 3-6 months of expenses.';
    }

    if (lowerInput.includes('expense') || lowerInput.includes('spend')) {
      return 'Track your expenses to see where your money goes. Categorizing transactions helps identify areas where you can cut back.';
    }

    if (lowerInput.includes('invest')) {
      return 'Investing is important for long-term wealth building. Consider low-cost index funds, diversify your portfolio, and think long-term.';
    }

    return 'I can help you with budgeting, expense tracking, currency conversion, savings advice, and investment monitoring. What specific financial question do you have?';
  }
}

const providers: AIProvider[] = [
  new GeminiProvider(),
  new OpenAIProvider(),
  new LocalFallbackProvider(),
];

export async function processAIMessage(message: string): Promise<{ response: string; provider: string }> {
  for (const provider of providers) {
    if (!provider.isAvailable()) {
      logger.debug(`${provider.name} provider not available`);
      continue;
    }

    try {
      logger.info(`Trying ${provider.name} provider...`);

      const response = await retryWithBackoff(() => provider.generateResponse(message));

      logger.info(`✓ ${provider.name} provider succeeded`);
      return {
        response,
        provider: provider.name,
      };
    } catch (error) {
      logger.error(`${provider.name} provider failed:`, error);
    }
  }

  return {
    response: "I'm having trouble connecting right now. Please try again in a moment.",
    provider: 'Error',
  };
}
