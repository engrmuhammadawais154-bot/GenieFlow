import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, Pressable, Modal, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionItem } from "@/components/TransactionItem";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { convertCurrency, popularCurrencies } from "@/services/currencyService";
import { Transaction } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";

export default function FinancesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [isFocused]);

  const loadTransactions = async () => {
    const savedTransactions = await storage.getTransactions();
    setTransactions(savedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()));
  };

  const calculateBalance = () => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, balance };
  };

  const handleUploadStatement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        "Statement Processing",
        "Document uploaded! In a production app, this would use OCR to extract transactions. For now, I'll add sample transactions.",
        [
          {
            text: "OK",
            onPress: async () => {
              const sampleTransactions: Transaction[] = [
                {
                  id: Date.now().toString(),
                  date: new Date(),
                  description: "Salary Deposit",
                  amount: 5000,
                  type: "income",
                  category: "Salary",
                },
                {
                  id: (Date.now() + 1).toString(),
                  date: new Date(),
                  description: "Grocery Shopping",
                  amount: 250,
                  type: "expense",
                  category: "Food",
                },
                {
                  id: (Date.now() + 2).toString(),
                  date: new Date(),
                  description: "Electric Bill",
                  amount: 120,
                  type: "expense",
                  category: "Utilities",
                },
              ];

              const updatedTransactions = [...transactions, ...sampleTransactions];
              setTransactions(updatedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()));
              await storage.saveTransactions(updatedTransactions);

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to upload document. Please try again.");
    }
  };

  const handleConvert = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setConverting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
      setConvertedAmount(result.convertedAmount.toFixed(2));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Failed to convert currency. Please check your internet connection.");
    } finally {
      setConverting(false);
    }
  };

  const handleVoiceInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrencyModalVisible(true);
  };

  const { totalIncome, totalExpenses, balance } = calculateBalance();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 60 + Spacing.xl,
            paddingBottom: tabBarHeight + 80,
          },
        ]}
      >
        <BalanceCard totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h2">Recent Transactions</ThemedText>
            <Pressable onPress={handleUploadStatement}>
              <Feather name="upload" size={24} color={theme.accent} />
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={48} color={theme.textSecondary} />
              <ThemedText
                type="h2"
                style={{ textAlign: "center", marginTop: Spacing.lg }}
              >
                No transactions yet
              </ThemedText>
              <ThemedText
                style={{
                  textAlign: "center",
                  color: theme.textSecondary,
                  marginTop: Spacing.sm,
                }}
              >
                Upload a bank statement to get started
              </ThemedText>
            </View>
          ) : (
            <View>
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleVoiceInput} />

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modal}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setCurrencyModalVisible(false)}>
              <ThemedText style={{ color: theme.error }}>Close</ThemedText>
            </Pressable>
            <ThemedText type="h2">Currency Converter</ThemedText>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Amount
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
                placeholder="Enter amount"
                placeholderTextColor={theme.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                From {fromCurrency}
              </ThemedText>
              <ThemedText type="h2">{fromCurrency}</ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                To {toCurrency}
              </ThemedText>
              <ThemedText type="h2">{toCurrency}</ThemedText>
            </View>

            {convertedAmount ? (
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Result
                </ThemedText>
                <ThemedText type="hero" style={{ color: theme.accent, marginTop: Spacing.sm }}>
                  {convertedAmount} {toCurrency}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.convertButton,
                {
                  backgroundColor: theme.accent,
                  opacity: converting || !amount ? 0.6 : 1,
                },
              ]}
              onPress={handleConvert}
              disabled={converting || !amount}
            >
              <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {converting ? "Converting..." : "Convert"}
              </ThemedText>
            </Pressable>
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
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing["2xl"] * 2,
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
    fontSize: 24,
    fontWeight: "600",
  },
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  convertButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.button,
    justifyContent: "center",
    alignItems: "center",
  },
});
