import { Event } from "@/types";

export async function createEvent(event: Event): Promise<string> {
  console.log("Creating calendar event:", event.title);
  return `google_cal_${Date.now()}`;
}

export async function updateEvent(eventId: string, event: Event): Promise<void> {
  console.log("Updating calendar event:", eventId, event.title);
}

export async function deleteEvent(eventId: string): Promise<void> {
  console.log("Deleting calendar event:", eventId);
}
