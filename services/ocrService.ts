import * as FileSystem from "expo-file-system";
import { Transaction } from "@/types";
import { categorizeTransaction } from "./categorizationService";

export interface BankStatementFormat {
  name: string;
  pattern: RegExp;
  extractTransactions: (text: string) => ParsedTransaction[];
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export interface OCRResult {
  transactions: Transaction[];
  bankName: string;
  format: string;
  confidence: number;
}

const bankFormats: BankStatementFormat[] = [
  {
    name: "Chase",
    pattern: /chase|jpmorgan/i,
    extractTransactions: (text: string) => {
      const transactions: ParsedTransaction[] = [];
      const lines = text.split("\n");
      
      for (const line of lines) {
        const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/);
        if (match) {
          const [, date, description, amountStr] = match;
          const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
          transactions.push({
            date,
            description: description.trim(),
            amount: Math.abs(amount),
            type: amount < 0 ? "expense" : "income",
          });
        }
      }
      
      return transactions;
    },
  },
  {
    name: "Bank of America",
    pattern: /bank of america|boa/i,
    extractTransactions: (text: string) => {
      const transactions: ParsedTransaction[] = [];
      const lines = text.split("\n");
      
      for (const line of lines) {
        const match = line.match(/(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/);
        if (match) {
          const [, date, description, amountStr] = match;
          const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
          const currentYear = new Date().getFullYear();
          transactions.push({
            date: `${date}/${currentYear}`,
            description: description.trim(),
            amount: Math.abs(amount),
            type: amount < 0 ? "expense" : "income",
          });
        }
      }
      
      return transactions;
    },
  },
  {
    name: "Wells Fargo",
    pattern: /wells fargo/i,
    extractTransactions: (text: string) => {
      const transactions: ParsedTransaction[] = [];
      const lines = text.split("\n");
      
      for (const line of lines) {
        const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/);
        if (match) {
          const [, date, description, amountStr] = match;
          const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
          transactions.push({
            date,
            description: description.trim(),
            amount: Math.abs(amount),
            type: amount < 0 ? "expense" : "income",
          });
        }
      }
      
      return transactions;
    },
  },
  {
    name: "Generic CSV",
    pattern: /date.*description.*amount/i,
    extractTransactions: (text: string) => {
      const transactions: ParsedTransaction[] = [];
      const lines = text.split("\n");
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[,\t]/);
        if (parts.length >= 3) {
          const date = parts[0].trim();
          const description = parts[1].trim();
          const amountStr = parts[2].trim();
          const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
          
          if (!isNaN(amount) && date && description) {
            transactions.push({
              date,
              description,
              amount: Math.abs(amount),
              type: amount < 0 ? "expense" : "income",
            });
          }
        }
      }
      
      return transactions;
    },
  },
];

function detectBankFormat(text: string): BankStatementFormat {
  for (const format of bankFormats) {
    if (format.pattern.test(text)) {
      return format;
    }
  }
  
  return bankFormats[bankFormats.length - 1];
}

function parseDate(dateStr: string): Date {
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\/(\d{1,2})/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        const [, month, day, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (format === formats[1]) {
        const [, month, day, year] = match;
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        return new Date(fullYear, parseInt(month) - 1, parseInt(day));
      } else if (format === formats[2]) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        const [, month, day] = match;
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, parseInt(month) - 1, parseInt(day));
      }
    }
  }
  
  return new Date();
}

async function extractTextFromPDF(fileUri: string): Promise<string> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }
    
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
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
            content: `You are a bank statement OCR expert. Extract all transaction data from this document.

For each transaction, extract:
- Date (format: MM/DD/YYYY)
- Description (merchant/payee name)
- Amount (positive number)
- Type (income or expense)

Return JSON array in this format:
[
  {
    "date": "01/15/2024",
    "description": "Grocery Store",
    "amount": 125.50,
    "type": "expense"
  }
]

If you can identify the bank name, include it as the first line before the JSON array.
Example:
Bank: Chase
[...]`,
          },
          {
            role: "user",
            content: `Extract transactions from this bank statement image/PDF (base64): ${base64.substring(0, 1000)}...`,
          },
        ],
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      throw new Error("OCR API failed");
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw error;
  }
}

async function extractTextFromImage(fileUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
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
            content: `You are a bank statement OCR expert. Extract all visible transaction data from this image.

For each transaction you can read, extract:
- Date
- Description (merchant name)
- Amount
- Type (income or expense based on context)

Return a JSON array of transactions. Be accurate and only extract data you can clearly read.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all transactions from this bank statement image:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Image OCR failed");
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Image OCR error:", error);
    throw error;
  }
}

export async function processStatementDocument(fileUri: string, mimeType: string): Promise<OCRResult> {
  try {
    let extractedText = "";
    
    if (mimeType === "application/pdf") {
      extractedText = await extractTextFromPDF(fileUri);
    } else if (mimeType.startsWith("image/")) {
      extractedText = await extractTextFromImage(fileUri);
    } else {
      throw new Error("Unsupported file type");
    }
    
    let bankName = "Unknown Bank";
    const bankMatch = extractedText.match(/Bank:\s*(.+)/i);
    if (bankMatch) {
      bankName = bankMatch[1].trim();
      extractedText = extractedText.replace(bankMatch[0], "");
    }
    
    let parsedTransactions: ParsedTransaction[] = [];
    
    try {
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedTransactions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      const format = detectBankFormat(extractedText);
      parsedTransactions = format.extractTransactions(extractedText);
      bankName = format.name;
    }
    
    const transactions: Transaction[] = [];
    
    for (const parsed of parsedTransactions) {
      const category = await categorizeTransaction(
        parsed.description,
        parsed.amount,
        parsed.type
      );
      
      transactions.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: parseDate(parsed.date),
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        category: category.category,
        categoryConfidence: category.confidence,
        subcategory: category.subcategory,
        bankName,
      });
    }
    
    return {
      transactions,
      bankName,
      format: detectBankFormat(extractedText).name,
      confidence: transactions.length > 0 ? 0.85 : 0.3,
    };
  } catch (error) {
    console.error("Statement processing error:", error);
    throw error;
  }
}

export function getSupportedBanks(): string[] {
  return bankFormats.map(f => f.name);
}
