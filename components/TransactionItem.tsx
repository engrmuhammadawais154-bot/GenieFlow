import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { theme } = useTheme();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, type: "income" | "expense") => {
    const sign = type === "income" ? "+" : "-";
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              transaction.type === "income"
                ? `${theme.incomePositive}20`
                : `${theme.expenseNegative}20`,
          },
        ]}
      >
        <Feather
          name={transaction.type === "income" ? "trending-up" : "trending-down"}
          size={20}
          color={
            transaction.type === "income"
              ? theme.incomePositive
              : theme.expenseNegative
          }
        />
      </View>
      <View style={styles.details}>
        <ThemedText style={styles.description}>
          {transaction.description}
        </ThemedText>
        <ThemedText style={{ color: theme.textSecondary }} type="small">
          {formatDate(transaction.date)} • {transaction.category}
        </ThemedText>
      </View>
      <ThemedText
        style={[
          styles.amount,
          {
            color:
              transaction.type === "income"
                ? theme.incomePositive
                : theme.expenseNegative,
          },
        ]}
      >
        {formatAmount(transaction.amount, transaction.type)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  description: {
    marginBottom: Spacing.xs / 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
  },
});
