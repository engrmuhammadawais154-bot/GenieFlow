import { Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Shadows, BorderRadius } from "@/constants/theme";

interface FABProps {
  onPress: () => void;
  inputContainerHeight?: number;
}

export function FAB({ onPress, inputContainerHeight = 100 }: FABProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const bottomOffset = inputContainerHeight + Spacing.md;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.accent,
          bottom: bottomOffset,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        Shadows.fab,
      ]}
      onPress={onPress}
    >
      <Feather name="mic" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: BorderRadius.fab,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
