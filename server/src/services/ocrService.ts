import { logger } from '../utils/logger';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface OCRResult {
  transactions: Transaction[];
  bankName: string;
}

function parseTransactionLine(line: string, bankFormat: string): Transaction | null {
  const patterns: Record<string, RegExp> = {
    chase: /(\d{2}\/\d{2})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/,
    bofa: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/,
    wells: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})/,
  };

  const pattern = patterns[bankFormat];
  if (!pattern) return null;

  const match = line.match(pattern);
  if (!match) return null;

  const [, dateStr, description, amountStr] = match;
  const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')));
  const type = amountStr.startsWith('-') ? 'expense' : 'income';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    description: description.trim(),
    amount,
    type,
  };
}

export async function processStatementFile(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
  logger.info(`Processing statement file: ${mimeType}`);

  const mockBankStatementText = `
CHASE BANK STATEMENT
Account Summary for November 2025

Date        Description                     Amount
11/01       Salary Deposit                  $3,500.00
11/03       Amazon Purchase                 -$89.99
11/05       Starbucks                       -$5.75
11/07       Grocery Store                   -$125.40
11/10       Electric Bill                   -$87.50
11/15       Restaurant                      -$45.20
  `.trim();

  const lines = mockBankStatementText.split('\n');
  const transactions: Transaction[] = [];
  let bankName = 'Unknown Bank';

  if (mockBankStatementText.toLowerCase().includes('chase')) {
    bankName = 'Chase Bank';
  } else if (mockBankStatementText.toLowerCase().includes('bank of america')) {
    bankName = 'Bank of America';
  } else if (mockBankStatementText.toLowerCase().includes('wells fargo')) {
    bankName = 'Wells Fargo';
  }

  for (const line of lines) {
    const transaction = parseTransactionLine(line, 'chase');
    if (transaction) {
      transactions.push(transaction);
    }
  }

  logger.info(`Extracted ${transactions.length} transactions from ${bankName}`);

  return {
    transactions,
    bankName,
  };
}
