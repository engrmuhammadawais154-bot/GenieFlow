import { Event } from "@/types";
import Chrono from "chrono-node";

export interface ParsedEventData {
  title: string;
  dateTime: Date | null;
  description?: string;
}

/**
 * Parse natural language event descriptions into structured event data
 * Examples:
 * - "Schedule meeting with John tomorrow at 2pm"
 * - "Remind me to call mom on Friday at 10am"
 * - "Team standup next Monday 9:30am"
 */
export function parseEventFromText(text: string): ParsedEventData | null {
  // Remove common scheduling prefixes
  const cleanText = text
    .toLowerCase()
    .replace(/^(schedule|remind me to|create event|add event|set reminder for|remind me about)\s*/i, "");

  // Extract time using chrono-node (handles natural language dates)
  const parsedDates = Chrono.parse(cleanText);
  
  if (parsedDates.length === 0) {
    // No date found, return null
    return null;
  }

  const firstDate = parsedDates[0];
  const dateTime = firstDate.start.date();

  // Extract title by removing the date/time portion
  const dateText = firstDate.text;
  let title = cleanText.replace(dateText, "").trim();
  
  // Clean up common connecting words
  title = title
    .replace(/^(for|to|about|at|on)\s+/i, "")
    .replace(/\s+(for|to|about|at|on)\s*$/i, "")
    .trim();

  // Capitalize first letter
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title: title || "Untitled Event",
    dateTime,
    description: "",
  };
}

/**
 * Check if text contains scheduling intent
 */
export function hasSchedulingIntent(text: string): boolean {
  const schedulingKeywords = [
    "schedule",
    "remind me",
    "reminder",
    "meeting",
    "event",
    "appointment",
    "call",
    "deadline",
    "set up",
    "book",
    "reserve",
  ];

  const lowerText = text.toLowerCase();
  
  // Check for scheduling keywords
  const hasKeyword = schedulingKeywords.some((keyword) => lowerText.includes(keyword));
  
  // Check for time indicators
  const hasTimeIndicator = /\b(tomorrow|today|tonight|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at \d|am|pm|\d+:\d+)\b/i.test(text);
  
  return hasKeyword && hasTimeIndicator;
}

/**
 * Create an Event object from parsed data
 */
export function createEventFromParsedData(parsedData: ParsedEventData): Event {
  return {
    id: Date.now().toString(),
    title: parsedData.title,
    description: parsedData.description || "",
    dateTime: parsedData.dateTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
    reminders: {
      twoDays: true,
      oneDay: true,
      sixHours: true,
      oneHour: true,
    },
    remindersSent: {
      twoDays: false,
      oneDay: false,
      sixHours: false,
      oneHour: false,
    },
  };
}
