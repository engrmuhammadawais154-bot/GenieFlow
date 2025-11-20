import { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { theme, isDark } = useTheme();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: theme.textPrimary,
            backgroundColor: theme.background,
          },
        ]}
        placeholder="Type your message..."
        placeholderTextColor={theme.textSecondary}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        editable={!disabled}
        onSubmitEditing={handleSend}
      />
      <Pressable
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: text.trim() ? theme.accent : theme.border,
            opacity: pressed ? 0.6 : 1,
          },
        ]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <Feather name="send" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: Spacing.md,
    borderTopWidth: 1,
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: Spacing.inputHeight,
    maxHeight: 100,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sendButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.button,
    justifyContent: "center",
    alignItems: "center",
  },
});
