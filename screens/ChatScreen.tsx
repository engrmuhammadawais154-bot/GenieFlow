import { useState, useEffect, useRef } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "@/components/ThemedView";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { FAB } from "@/components/FAB";
import { storage } from "@/services/storage";
import { processUserInput } from "@/services/aiService";
import { Message } from "@/types";
import { Spacing } from "@/constants/theme";
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
      "Voice input feature coming soon! For now, please type your message."
    );
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
              Hi! I'm your AI Assistant
            </ThemedText>
            <ThemedText
              style={{
                textAlign: "center",
                color: theme.textSecondary,
                marginTop: Spacing.sm,
              }}
            >
              I can help you schedule meetings, convert currency, and manage your finances.
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
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : null}
        <ChatInput onSend={handleSend} disabled={loading} />
      </View>
      <FAB onPress={handleVoiceInput} />
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
});

import { ThemedText } from "@/components/ThemedText";
