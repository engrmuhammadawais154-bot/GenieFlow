import { useState, useEffect, useRef } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { FAB } from "@/components/FAB";
import { storage } from "@/services/storage";
import { processUserInput } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";
import { hasSchedulingIntent, parseEventFromText, createEventFromParsedData } from "@/services/eventParserService";
import { createEvent as createCalendarEvent } from "@/services/calendarService";
import { scheduleEventReminders } from "@/services/notificationService";
import { Message } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

export default function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [inputContainerHeight, setInputContainerHeight] = useState(100);

  useEffect(() => {
    loadMessages();
  }, [isFocused]);

  const loadMessages = async () => {
    const savedMessages = await storage.getMessages();
    setMessages(savedMessages);
  };

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await storage.saveMessages(updatedMessages);

    setLoading(true);

    try {
      // Check if this is a scheduling request
      if (hasSchedulingIntent(text)) {
        const parsedEvent = parseEventFromText(text);
        
        if (parsedEvent && parsedEvent.dateTime) {
          const event = createEventFromParsedData(parsedEvent);
          
          // Create in Google Calendar first
          const googleEventId = await createCalendarEvent(event);
          event.googleCalendarEventId = googleEventId;
          
          // Schedule reminders
          await scheduleEventReminders(event);
          
          // Save to storage with Google Calendar ID
          const existingEvents = await storage.getEvents();
          const newEvents = [...existingEvents, event];
          await storage.saveEvents(newEvents);
          
          // Respond with confirmation
          const confirmationText = `Great! I've scheduled "${parsedEvent.title}" for ${parsedEvent.dateTime.toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}. You'll receive reminders before the event.`;
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: confirmationText,
            isUser: false,
            timestamp: new Date(),
          };
          
          const finalMessages = [...updatedMessages, aiMessage];
          setMessages(finalMessages);
          await storage.saveMessages(finalMessages);
          
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (voiceEnabled) {
            try {
              setIsSpeaking(true);
              await VoiceService.speak(confirmationText);
              setIsSpeaking(false);
            } catch (voiceError) {
              setIsSpeaking(false);
              console.error("TTS error:", voiceError);
            }
          }
          
          setLoading(false);
          return;
        }
      }
      
      // Regular AI chat processing
      const intent = await processUserInput(text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: intent.response,
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await storage.saveMessages(finalMessages);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (voiceEnabled) {
        try {
          setIsSpeaking(true);
          await VoiceService.speak(intent.response);
          setIsSpeaking(false);
        } catch (voiceError) {
          setIsSpeaking(false);
          console.error("TTS error:", voiceError);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Voice Input",
      "Try typing scheduling commands like:\n\n• \"Schedule meeting with John tomorrow at 2pm\"\n• \"Remind me to call mom on Friday at 10am\"\n• \"Team standup next Monday 9:30am\"\n\nVoice recognition coming soon!",
      [
        {
          text: "Got it",
          style: "cancel",
        },
      ]
    );
  };

  const toggleVoiceResponse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      VoiceService.stop();
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    VoiceService.stop();
    setIsSpeaking(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={[
          styles.messagesList,
          {
            paddingTop: insets.top + 60 + Spacing.xl,
            paddingBottom: tabBarHeight + 80,
          },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="h2" style={{ textAlign: "center" }}>
              Hi! I'm your Financial Assistant
            </ThemedText>
            <ThemedText
              style={{
                textAlign: "center",
                color: theme.textSecondary,
                marginTop: Spacing.sm,
              }}
            >
              I can help you manage finances, schedule finance-related meetings, and convert currency. Try asking me to:
            </ThemedText>
            <ThemedText
              style={{
                textAlign: "center",
                color: theme.textSecondary,
                marginTop: Spacing.md,
                fontSize: 14,
              }}
            >
              • "Schedule budget review meeting tomorrow at 3pm"
              {"\n"}• "How can I save money on groceries?"
              {"\n"}• "Convert 100 USD to EUR"
            </ThemedText>
          </View>
        }
      />
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: tabBarHeight,
            backgroundColor: theme.background,
          },
        ]}
        onLayout={(e) => setInputContainerHeight(e.nativeEvent.layout.height)}
      >
        {isSpeaking ? (
          <View style={[styles.voiceControls, { backgroundColor: theme.surface }]}>
            <View style={styles.voiceControlsContent}>
              <Feather name="volume-2" size={20} color={theme.accent} />
              <ThemedText style={{ marginLeft: Spacing.sm, flex: 1 }}>
                Speaking...
              </ThemedText>
              <Pressable onPress={stopSpeaking} style={styles.stopButton}>
                <Feather name="square" size={18} color={theme.error} />
              </Pressable>
            </View>
          </View>
        ) : null}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <Pressable
            onPress={toggleVoiceResponse}
            style={[
              styles.voiceToggle,
              { backgroundColor: voiceEnabled ? theme.accent : theme.surface },
            ]}
          >
            <Feather
              name={voiceEnabled ? "volume-2" : "volume-x"}
              size={20}
              color={voiceEnabled ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ChatInput 
              onSend={handleSend} 
              disabled={loading || isSpeaking} 
            />
          </View>
        </View>
      </View>
      <FAB onPress={handleVoiceInput} inputContainerHeight={inputContainerHeight} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  loadingContainer: {
    padding: Spacing.md,
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  voiceToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceControls: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  voiceControlsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stopButton: {
    padding: Spacing.sm,
  },
});
