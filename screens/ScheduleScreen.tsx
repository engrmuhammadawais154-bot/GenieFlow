import { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert, Pressable, Modal, TextInput, Switch, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { createEvent as createCalendarEvent, updateEvent as updateCalendarEvent, deleteEvent as deleteCalendarEvent } from "@/services/calendarService";
import { scheduleEventReminders, cancelEventReminders, requestNotificationPermissions } from "@/services/notificationService";
import { SchedulingService, RecurringPattern, SchedulingSuggestion } from "@/services/schedulingService";
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
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminders, setReminders] = useState({
    twoDays: true,
    oneDay: true,
    sixHours: true,
    oneHour: true,
  });
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadEvents();
    requestNotificationPermissions();
  }, [isFocused]);

  useEffect(() => {
    if (events.length >= 3) {
      const patterns = SchedulingService.detectRecurringPatterns(events);
      setRecurringPatterns(patterns);
      
      SchedulingService.generateSmartSuggestions(events).then(setSuggestions);
    }
  }, [events]);

  const loadEvents = async () => {
    const savedEvents = await storage.getEvents();
    setEvents(savedEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
  };

  const handleSaveEvent = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const eventData: Event = {
      id: editingEvent?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      dateTime: selectedDate,
      reminders,
      remindersSent: editingEvent?.remindersSent || {
        twoDays: false,
        oneDay: false,
        sixHours: false,
        oneHour: false,
      },
      googleCalendarEventId: editingEvent?.googleCalendarEventId,
    };

    try {
      if (editingEvent) {
        // Update existing event
        if (eventData.googleCalendarEventId) {
          await updateCalendarEvent(eventData.googleCalendarEventId, eventData);
        }
        
        await cancelEventReminders(eventData.id);
        await scheduleEventReminders(eventData);

        const updatedEvents = events.map(e => e.id === eventData.id ? eventData : e);
        setEvents(updatedEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
        await storage.saveEvents(updatedEvents);

        Alert.alert("Success", "Event updated successfully!");
      } else {
        // Create new event
        const googleEventId = await createCalendarEvent(eventData);
        eventData.googleCalendarEventId = googleEventId;

        await scheduleEventReminders(eventData);

        const updatedEvents = [...events, eventData];
        setEvents(updatedEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
        await storage.saveEvents(updatedEvents);

        Alert.alert("Success", "Event created and synced to Google Calendar!");
      }

      closeModal();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", `Failed to ${editingEvent ? 'update' : 'create'} event. Please try again.`);
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

  const handleEditEvent = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setSelectedDate(event.dateTime);
    setReminders(event.reminders);
    setModalVisible(true);
  };

  const handleAddEventPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setReminders({ twoDays: true, oneDay: true, sixHours: true, oneHour: true });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setReminders({ twoDays: true, oneDay: true, sixHours: true, oneHour: true });
  };

  const applySuggestion = (suggestion: SchedulingSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTitle(suggestion.title);
    setSelectedDate(suggestion.suggestedTime);
    setModalVisible(true);
    setShowSuggestions(false);
  };

  const onDateChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      const newDate = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        selectedDate.getHours(),
        selectedDate.getMinutes()
      );
      setSelectedDate(newDate);
    }
  };

  const onTimeChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selected) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        selected.getHours(),
        selected.getMinutes()
      );
      setSelectedDate(newDate);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard 
            event={item} 
            onPress={() => handleEditEvent(item)}
            onDelete={() => handleDeleteEvent(item)} 
          />
        )}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + 60 + Spacing.xl,
            paddingBottom: tabBarHeight + 80,
          },
        ]}
        ListHeaderComponent={
          suggestions.length > 0 && showSuggestions ? (
            <View style={styles.suggestionsSection}>
              <View style={styles.suggestionHeader}>
                <ThemedText type="h2">Smart Suggestions</ThemedText>
                <Pressable onPress={() => setShowSuggestions(false)}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Pressable
                  key={index}
                  style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => applySuggestion(suggestion)}
                >
                  <View style={styles.suggestionContent}>
                    <Feather name="zap" size={18} color={theme.accent} />
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <ThemedText style={{ fontWeight: "600" }}>{suggestion.title}</ThemedText>
                      <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                        {formatDate(suggestion.suggestedTime)} at {suggestion.suggestedTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        {suggestion.reason}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : recurringPatterns.length > 0 && !showSuggestions ? (
            <View style={styles.suggestionsSection}>
              <View style={styles.suggestionHeader}>
                <ThemedText type="h2">Recurring Patterns Detected</ThemedText>
                <Pressable onPress={() => setShowSuggestions(true)}>
                  <ThemedText style={{ color: theme.accent }}>View Suggestions</ThemedText>
                </Pressable>
              </View>
              {recurringPatterns.slice(0, 2).map((pattern, index) => (
                <View
                  key={index}
                  style={[styles.patternCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Feather name="repeat" size={18} color={theme.accent} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <ThemedText style={{ fontWeight: "600" }}>{pattern.suggestedTitle}</ThemedText>
                    <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                      {pattern.type} • {Math.round(pattern.confidence * 100)}% match
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
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

      <FAB icon="plus" onPress={handleAddEventPress} />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modal}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={closeModal}>
              <ThemedText style={{ color: theme.error }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="h2">{editingEvent ? "Edit Event" : "New Event"}</ThemedText>
            <Pressable onPress={handleSaveEvent}>
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
                Date
              </ThemedText>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Feather name="calendar" size={20} color={theme.accent} />
                <ThemedText style={{ marginLeft: Spacing.sm }}>
                  {selectedDate.toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric" 
                  })}
                </ThemedText>
              </Pressable>
              {(showDatePicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Time
              </ThemedText>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Feather name="clock" size={20} color={theme.accent} />
                <ThemedText style={{ marginLeft: Spacing.sm }}>
                  {selectedDate.toLocaleTimeString("en-US", { 
                    hour: "numeric", 
                    minute: "2-digit" 
                  })}
                </ThemedText>
              </Pressable>
              {(showTimePicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}
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
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  suggestionsSection: {
    marginBottom: Spacing.lg,
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  suggestionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  patternCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
});
