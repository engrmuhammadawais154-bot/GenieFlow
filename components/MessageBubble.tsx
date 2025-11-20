import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        message.isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: message.isUser ? theme.accent : theme.surface,
            borderTopRightRadius: message.isUser
              ? BorderRadius.chatBubbleTail
              : BorderRadius.chatBubble,
            borderTopLeftRadius: message.isUser
              ? BorderRadius.chatBubble
              : BorderRadius.chatBubbleTail,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.text,
            message.isUser && { color: "#FFFFFF" },
            message.isUser && Typography.bodyMedium,
          ]}
        >
          {message.text}
        </ThemedText>
        <ThemedText
          style={[
            styles.timestamp,
            message.isUser && { color: "rgba(255,255,255,0.7)" },
            !message.isUser && { color: theme.textSecondary },
          ]}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  aiContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderBottomLeftRadius: BorderRadius.chatBubble,
    borderBottomRightRadius: BorderRadius.chatBubble,
  },
  text: {
    ...Typography.body,
  },
  timestamp: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
});
