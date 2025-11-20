import { Event } from "@/types";

export interface RecurringPattern {
  type: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  interval: number;
  confidence: number;
  suggestedTitle?: string;
  occurrences: Date[];
}

export interface SchedulingSuggestion {
  title: string;
  suggestedTime: Date;
  reason: string;
  confidence: number;
  conflictsWith?: Event[];
}

export class SchedulingService {
  static detectRecurringPatterns(events: Event[]): RecurringPattern[] {
    const patterns: RecurringPattern[] = [];
    
    const sortedEvents = [...events].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    
    const eventGroups = new Map<string, Event[]>();
    for (const event of sortedEvents) {
      const normalizedTitle = event.title.toLowerCase().trim();
      if (!eventGroups.has(normalizedTitle)) {
        eventGroups.set(normalizedTitle, []);
      }
      eventGroups.get(normalizedTitle)!.push(event);
    }
    
    for (const [title, groupEvents] of eventGroups) {
      if (groupEvents.length < 3) continue;
      
      const intervals: number[] = [];
      for (let i = 1; i < groupEvents.length; i++) {
        const diff = groupEvents[i].dateTime.getTime() - groupEvents[i - 1].dateTime.getTime();
        intervals.push(diff);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalStdDev = Math.sqrt(
        intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
      );
      
      const consistency = 1 - Math.min(intervalStdDev / avgInterval, 1);
      
      if (consistency > 0.7) {
        const dayInMs = 24 * 60 * 60 * 1000;
        const weekInMs = 7 * dayInMs;
        const monthInMs = 30 * dayInMs;
        
        let patternType: RecurringPattern["type"] = "custom";
        let interval = 1;
        
        if (Math.abs(avgInterval - dayInMs) < dayInMs * 0.1) {
          patternType = "daily";
          interval = 1;
        } else if (Math.abs(avgInterval - weekInMs) < dayInMs * 0.5) {
          patternType = "weekly";
          interval = 1;
        } else if (Math.abs(avgInterval - 2 * weekInMs) < dayInMs * 0.5) {
          patternType = "biweekly";
          interval = 2;
        } else if (Math.abs(avgInterval - monthInMs) < dayInMs * 2) {
          patternType = "monthly";
          interval = 1;
        }
        
        patterns.push({
          type: patternType,
          interval,
          confidence: consistency,
          suggestedTitle: groupEvents[0].title,
          occurrences: groupEvents.map(e => e.dateTime),
        });
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  static async generateSmartSuggestions(
    events: Event[],
    userInput?: string
  ): Promise<SchedulingSuggestion[]> {
    const suggestions: SchedulingSuggestion[] = [];
    
    const now = new Date();
    const upcomingEvents = events.filter(e => e.dateTime > now);
    const pastEvents = events.filter(e => e.dateTime <= now);
    
    const patterns = this.detectRecurringPatterns(pastEvents);
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.8) {
        const lastOccurrence = pattern.occurrences[pattern.occurrences.length - 1];
        const nextSuggested = this.calculateNextOccurrence(lastOccurrence, pattern.type, pattern.interval);
        
        const conflicts = upcomingEvents.filter(e => 
          Math.abs(e.dateTime.getTime() - nextSuggested.getTime()) < 60 * 60 * 1000
        );
        
        suggestions.push({
          title: pattern.suggestedTitle || "Recurring Event",
          suggestedTime: nextSuggested,
          reason: `Based on ${pattern.type} pattern detected`,
          confidence: pattern.confidence,
          conflictsWith: conflicts,
        });
      }
    }
    
    if (userInput) {
      const aiSuggestion = await this.getAISuggestion(userInput, events);
      if (aiSuggestion) {
        suggestions.push(aiSuggestion);
      }
    }
    
    const busyHours = this.analyzeBusyHours(events);
    const optimalTimes = this.findOptimalTimeSlots(upcomingEvents, busyHours);
    
    for (const time of optimalTimes.slice(0, 2)) {
      suggestions.push({
        title: "Available Time Slot",
        suggestedTime: time,
        reason: "Optimal time based on your schedule",
        confidence: 0.7,
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static calculateNextOccurrence(
    lastDate: Date,
    type: RecurringPattern["type"],
    interval: number
  ): Date {
    const next = new Date(lastDate);
    
    switch (type) {
      case "daily":
        next.setDate(next.getDate() + interval);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7 * interval);
        break;
      case "biweekly":
        next.setDate(next.getDate() + 14);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + interval);
        break;
      default:
        next.setDate(next.getDate() + 7);
    }
    
    return next;
  }
  
  private static analyzeBusyHours(events: Event[]): Map<number, number> {
    const busyHours = new Map<number, number>();
    
    for (const event of events) {
      const hour = event.dateTime.getHours();
      busyHours.set(hour, (busyHours.get(hour) || 0) + 1);
    }
    
    return busyHours;
  }
  
  private static findOptimalTimeSlots(upcomingEvents: Event[], busyHours: Map<number, number>): Date[] {
    const slots: Date[] = [];
    const now = new Date();
    
    const preferredHours = [9, 10, 14, 15];
    
    for (let day = 1; day <= 7; day++) {
      for (const hour of preferredHours) {
        const slotTime = new Date(now);
        slotTime.setDate(slotTime.getDate() + day);
        slotTime.setHours(hour, 0, 0, 0);
        
        const hasConflict = upcomingEvents.some(e => 
          Math.abs(e.dateTime.getTime() - slotTime.getTime()) < 60 * 60 * 1000
        );
        
        const isBusyHour = (busyHours.get(hour) || 0) > 5;
        
        if (!hasConflict && !isBusyHour) {
          slots.push(slotTime);
        }
      }
    }
    
    return slots.slice(0, 5);
  }
  
  private static async getAISuggestion(
    userInput: string,
    existingEvents: Event[]
  ): Promise<SchedulingSuggestion | null> {
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
              content: `You are a smart scheduling assistant. Analyze the user's request and suggest the best time for their meeting.

Consider:
- Current date/time: ${new Date().toISOString()}
- Typical business hours: 9 AM - 5 PM
- Avoid weekends unless specifically requested
- Look for context clues about urgency ("ASAP", "tomorrow", "next week")

Respond with JSON:
{
  "title": "suggested meeting title",
  "dateTime": "ISO timestamp",
  "reason": "why this time works",
  "confidence": 0.85
}`,
            },
            {
              role: "user",
              content: userInput,
            },
          ],
          temperature: 0.5,
        }),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      return {
        title: parsed.title,
        suggestedTime: new Date(parsed.dateTime),
        reason: parsed.reason,
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.error("AI suggestion error:", error);
      return null;
    }
  }
}
