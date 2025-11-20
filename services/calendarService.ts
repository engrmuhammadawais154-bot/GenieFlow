import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event } from "@/types";

const STORAGE_KEY = "@calendar_events";

// Mock calendar service for Expo/React Native
// In a production app, this would connect to a backend API that interfaces with Google Calendar

export async function getUpcomingEvents(): Promise<Event[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const events = JSON.parse(stored);
      return events.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
    }
    
    // Return mock events if no stored data
    return getMockEvents();
  } catch (error) {
    console.error("Error loading events:", error);
    return getMockEvents();
  }
}

export async function createEvent(event: Omit<Event, "id">): Promise<Event> {
  try {
    const events = await getUpcomingEvents();
    const newEvent: Event = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    events.push(newEvent);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    
    return newEvent;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  try {
    const events = await getUpcomingEvents();
    const index = events.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error("Event not found");
    }
    
    const updatedEvent = { ...events[index], ...updates };
    events[index] = updatedEvent;
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return updatedEvent;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    const events = await getUpcomingEvents();
    const filtered = events.filter(e => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

function getMockEvents(): Event[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return [
    {
      id: "1",
      title: "Team Standup",
      description: "Daily team sync meeting",
      start: new Date(now.setHours(10, 0, 0, 0)),
      end: new Date(now.setHours(10, 30, 0, 0)),
      location: "Conference Room A",
    },
    {
      id: "2",
      title: "Project Review",
      description: "Quarterly project review with stakeholders",
      start: new Date(tomorrow.setHours(14, 0, 0, 0)),
      end: new Date(tomorrow.setHours(15, 30, 0, 0)),
      location: "Zoom",
    },
    {
      id: "3",
      title: "Client Presentation",
      description: "Present new features to client",
      start: new Date(nextWeek.setHours(11, 0, 0, 0)),
      end: new Date(nextWeek.setHours(12, 0, 0, 0)),
      location: "Client Office",
    },
  ];
}
