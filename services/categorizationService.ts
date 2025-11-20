export interface CategoryResult {
  category: string;
  confidence: number;
  subcategory?: string;
}

export interface TransactionCategories {
  income: string[];
  expense: string[];
}

export const categories: TransactionCategories = {
  income: [
    "Salary",
    "Freelance",
    "Investment Returns",
    "Rental Income",
    "Business Income",
    "Refunds",
    "Gifts",
    "Other Income"
  ],
  expense: [
    "Food & Dining",
    "Groceries",
    "Transportation",
    "Utilities",
    "Housing",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Insurance",
    "Travel",
    "Personal Care",
    "Subscriptions",
    "Taxes",
    "Other Expenses"
  ]
};

export async function categorizeTransaction(
  description: string,
  amount: number,
  type: "income" | "expense"
): Promise<CategoryResult> {
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
            content: `You are a financial transaction categorization expert. Analyze transaction descriptions and assign the most appropriate category with a confidence score.

Available ${type} categories:
${type === "income" ? categories.income.join(", ") : categories.expense.join(", ")}

Rules:
- Analyze the transaction description carefully
- Consider common merchant names, keywords, and patterns
- Return a confidence score between 0 and 1 (1 = very confident)
- Be specific: "Food & Dining" for restaurants, "Groceries" for supermarkets
- Default to "Other ${type === "income" ? "Income" : "Expenses"}" if uncertain

Respond with JSON in this exact format:
{
  "category": "selected category from the list",
  "confidence": 0.95,
  "subcategory": "optional specific detail"
}`,
          },
          {
            role: "user",
            content: `Categorize this ${type} transaction:
Description: ${description}
Amount: $${amount}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("AI categorization failed");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const parsed = JSON.parse(content);

    return {
      category: parsed.category || (type === "income" ? "Other Income" : "Other Expenses"),
      confidence: parsed.confidence || 0.5,
      subcategory: parsed.subcategory,
    };
  } catch (error) {
    console.error("Transaction categorization error:", error);
    
    const fallbackCategory = inferBasicCategory(description, type);
    return {
      category: fallbackCategory,
      confidence: 0.4,
    };
  }
}

function inferBasicCategory(description: string, type: "income" | "expense"): string {
  const lowerDesc = description.toLowerCase();
  
  if (type === "income") {
    if (lowerDesc.includes("salary") || lowerDesc.includes("payroll") || lowerDesc.includes("wages")) {
      return "Salary";
    }
    if (lowerDesc.includes("freelance") || lowerDesc.includes("contract")) {
      return "Freelance";
    }
    if (lowerDesc.includes("dividend") || lowerDesc.includes("interest") || lowerDesc.includes("investment")) {
      return "Investment Returns";
    }
    if (lowerDesc.includes("refund")) {
      return "Refunds";
    }
    return "Other Income";
  } else {
    if (lowerDesc.includes("restaurant") || lowerDesc.includes("cafe") || lowerDesc.includes("food")) {
      return "Food & Dining";
    }
    if (lowerDesc.includes("grocery") || lowerDesc.includes("supermarket") || lowerDesc.includes("market")) {
      return "Groceries";
    }
    if (lowerDesc.includes("uber") || lowerDesc.includes("lyft") || lowerDesc.includes("gas") || lowerDesc.includes("fuel")) {
      return "Transportation";
    }
    if (lowerDesc.includes("electric") || lowerDesc.includes("water") || lowerDesc.includes("internet") || lowerDesc.includes("phone")) {
      return "Utilities";
    }
    if (lowerDesc.includes("rent") || lowerDesc.includes("mortgage")) {
      return "Housing";
    }
    if (lowerDesc.includes("netflix") || lowerDesc.includes("spotify") || lowerDesc.includes("subscription")) {
      return "Subscriptions";
    }
    if (lowerDesc.includes("insurance")) {
      return "Insurance";
    }
    if (lowerDesc.includes("doctor") || lowerDesc.includes("hospital") || lowerDesc.includes("pharmacy")) {
      return "Healthcare";
    }
    return "Other Expenses";
  }
}

export async function recategorizeAllTransactions(transactions: any[]): Promise<any[]> {
  const recategorized = [];
  
  for (const transaction of transactions) {
    const result = await categorizeTransaction(
      transaction.description,
      transaction.amount,
      transaction.type
    );
    
    recategorized.push({
      ...transaction,
      category: result.category,
      categoryConfidence: result.confidence,
      subcategory: result.subcategory,
    });
  }
  
  return recategorized;
}
