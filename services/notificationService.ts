import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Event } from "@/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function scheduleEventReminders(event: Event): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const eventTime = event.dateTime.getTime();
  const now = Date.now();

  const reminders = [
    {
      enabled: event.reminders.twoDays,
      time: eventTime - 2 * 24 * 60 * 60 * 1000,
      title: "Event in 2 days",
    },
    {
      enabled: event.reminders.oneDay,
      time: eventTime - 24 * 60 * 60 * 1000,
      title: "Event tomorrow",
    },
    {
      enabled: event.reminders.sixHours,
      time: eventTime - 6 * 60 * 60 * 1000,
      title: "Event in 6 hours",
    },
    {
      enabled: event.reminders.oneHour,
      time: eventTime - 60 * 60 * 1000,
      title: "Event in 1 hour",
    },
  ];

  for (const reminder of reminders) {
    if (reminder.enabled && reminder.time > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: event.title,
          data: { eventId: event.id },
        },
        trigger: {
          date: new Date(reminder.time),
        },
      });
    }
  }
}

export async function cancelEventReminders(eventId: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.eventId === eventId) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}
