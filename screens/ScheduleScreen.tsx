import { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert, Pressable, Modal, TextInput, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { createCalendarEvent, deleteCalendarEvent } from "@/services/calendarService";
import { scheduleEventReminders, cancelEventReminders, requestNotificationPermissions } from "@/services/notificationService";
import { Event } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [reminders, setReminders] = useState({
    twoDays: true,
    oneDay: true,
    sixHours: true,
    oneHour: true,
  });

  useEffect(() => {
    loadEvents();
    requestNotificationPermissions();
  }, [isFocused]);

  const loadEvents = async () => {
    const savedEvents = await storage.getEvents();
    setEvents(savedEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newEvent: Event = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      dateTime: selectedDate,
      reminders,
      remindersSent: {
        twoDays: false,
        oneDay: false,
        sixHours: false,
        oneHour: false,
      },
    };

    try {
      const googleEventId = await createCalendarEvent(newEvent);
      newEvent.googleCalendarEventId = googleEventId;

      await scheduleEventReminders(newEvent);

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
      await storage.saveEvents(updatedEvents);

      setModalVisible(false);
      setTitle("");
      setDescription("");
      setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setReminders({ twoDays: true, oneDay: true, sixHours: true, oneHour: true });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Event created and synced to Google Calendar!");
    } catch (error) {
      Alert.alert("Error", "Failed to create event. Please try again.");
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    Alert.alert("Delete Event", `Are you sure you want to delete "${event.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (event.googleCalendarEventId) {
              await deleteCalendarEvent(event.googleCalendarEventId);
            }

            await cancelEventReminders(event.id);

            const updatedEvents = events.filter((e) => e.id !== event.id);
            setEvents(updatedEvents);
            await storage.saveEvents(updatedEvents);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Error", "Failed to delete event. Please try again.");
          }
        },
      },
    ]);
  };

  const handleVoiceInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onDelete={() => handleDeleteEvent(item)} />
        )}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + 60 + Spacing.xl,
            paddingBottom: tabBarHeight + 80,
          },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={theme.textSecondary} />
            <ThemedText type="h2" style={{ textAlign: "center", marginTop: Spacing.lg }}>
              No events scheduled
            </ThemedText>
            <ThemedText
              style={{
                textAlign: "center",
                color: theme.textSecondary,
                marginTop: Spacing.sm,
              }}
            >
              Tap the + button to create your first event
            </ThemedText>
          </View>
        }
      />

      <FAB onPress={handleVoiceInput} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modal}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setModalVisible(false)}>
              <ThemedText style={{ color: theme.error }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="h2">New Event</ThemedText>
            <Pressable onPress={handleAddEvent}>
              <ThemedText style={{ color: theme.accent, fontWeight: "600" }}>Save</ThemedText>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Event Title
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Enter event title"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Description (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Add details"
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Date & Time (Tomorrow as default)
              </ThemedText>
              <ThemedText>{selectedDate.toLocaleString()}</ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Reminders
              </ThemedText>
              {[
                { key: "twoDays", label: "2 days before" },
                { key: "oneDay", label: "1 day before" },
                { key: "sixHours", label: "6 hours before" },
                { key: "oneHour", label: "1 hour before" },
              ].map((reminder) => (
                <View key={reminder.key} style={styles.reminderRow}>
                  <ThemedText>{reminder.label}</ThemedText>
                  <Switch
                    value={reminders[reminder.key as keyof typeof reminders]}
                    onValueChange={(value) =>
                      setReminders({ ...reminders, [reminder.key]: value })
                    }
                    trackColor={{ false: theme.border, true: theme.accent }}
                  />
                </View>
              ))}
            </View>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
});
