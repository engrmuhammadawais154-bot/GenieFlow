export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  dateTime: Date;
  reminders: {
    twoDays: boolean;
    oneDay: boolean;
    sixHours: boolean;
    oneHour: boolean;
  };
  googleCalendarEventId?: string;
  remindersSent: {
    twoDays: boolean;
    oneDay: boolean;
    sixHours: boolean;
    oneHour: boolean;
  };
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  categoryConfidence?: number;
  subcategory?: string;
  bankName?: string;
}

export interface BalanceSheet {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: Transaction[];
}

export interface UserProfile {
  name: string;
  avatar: number;
}

export type AvatarOption = 1 | 2 | 3 | 4;
