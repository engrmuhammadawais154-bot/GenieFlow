import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, Event, Transaction, UserProfile } from "@/types";

const KEYS = {
  MESSAGES: "@ai_assistant_messages",
  EVENTS: "@ai_assistant_events",
  TRANSACTIONS: "@ai_assistant_transactions",
  USER_PROFILE: "@ai_assistant_user_profile",
};

export const storage = {
  async getMessages(): Promise<Message[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MESSAGES);
      return data ? JSON.parse(data, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      }) : [];
    } catch (error) {
      console.error("Error loading messages:", error);
      return [];
    }
  },

  async saveMessages(messages: Message[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  },

  async getEvents(): Promise<Event[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.EVENTS);
      return data ? JSON.parse(data, (key, value) => {
        if (key === 'dateTime') return new Date(value);
        return value;
      }) : [];
    } catch (error) {
      console.error("Error loading events:", error);
      return [];
    }
  },

  async saveEvents(events: Event[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error("Error saving events:", error);
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data, (key, value) => {
        if (key === 'date') return new Date(value);
        return value;
      }) : [];
    } catch (error) {
      console.error("Error loading transactions:", error);
      return [];
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving transactions:", error);
    }
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};
