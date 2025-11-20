import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Event } from "@/types";

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onDelete?: () => void;
}

export function EventCard({ event, onPress, onDelete }: EventCardProps) {
  const { theme } = useTheme();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReminderBadges = () => {
    const badges = [];
    if (event.remindersSent.twoDays)
      badges.push({ label: "2d", color: theme.success });
    if (event.remindersSent.oneDay)
      badges.push({ label: "1d", color: theme.success });
    if (event.remindersSent.sixHours)
      badges.push({ label: "6h", color: theme.success });
    if (event.remindersSent.oneHour)
      badges.push({ label: "1h", color: theme.success });

    if (badges.length === 0) {
      if (event.reminders.twoDays)
        badges.push({ label: "2d", color: theme.warning });
      if (event.reminders.oneDay)
        badges.push({ label: "1d", color: theme.warning });
      if (event.reminders.sixHours)
        badges.push({ label: "6h", color: theme.warning });
      if (event.reminders.oneHour)
        badges.push({ label: "1h", color: theme.warning });
    }

    return badges;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.dateTimeContainer}>
            <ThemedText type="h2" style={styles.title}>
              {event.title}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {formatDate(event.dateTime)} at {formatTime(event.dateTime)}
            </ThemedText>
          </View>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="trash-2" size={20} color={theme.error} />
            </Pressable>
          ) : null}
        </View>
        {event.description ? (
          <ThemedText
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {event.description}
          </ThemedText>
        ) : null}
        {getReminderBadges().length > 0 ? (
          <View style={styles.badges}>
            {getReminderBadges().map((badge, index) => (
              <View
                key={index}
                style={[styles.badge, { backgroundColor: badge.color }]}
              >
                <ThemedText style={styles.badgeText}>{badge.label}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.cardPadding,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateTimeContainer: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginTop: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
