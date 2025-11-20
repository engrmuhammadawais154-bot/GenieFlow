import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function BalanceCard({
  totalIncome,
  totalExpenses,
  balance,
}: BalanceCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
        },
        Shadows.card,
      ]}
    >
      <ThemedText style={{ color: theme.textSecondary }} type="caption">
        Total Balance
      </ThemedText>
      <ThemedText
        style={[
          styles.balance,
          {
            color: balance >= 0 ? theme.incomePositive : theme.expenseNegative,
          },
        ]}
      >
        ${balance.toFixed(2)}
      </ThemedText>
      <View style={styles.row}>
        <View style={styles.stat}>
          <ThemedText style={{ color: theme.textSecondary }} type="small">
            Income
          </ThemedText>
          <ThemedText
            style={[styles.statValue, { color: theme.incomePositive }]}
          >
            +${totalIncome.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={{ color: theme.textSecondary }} type="small">
            Expenses
          </ThemedText>
          <ThemedText
            style={[styles.statValue, { color: theme.expenseNegative }]}
          >
            -${totalExpenses.toFixed(2)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    margin: Spacing.lg,
  },
  balance: {
    fontSize: 32,
    fontWeight: "700",
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.xl,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
});
