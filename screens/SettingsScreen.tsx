import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, TextInput, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { UserProfile, AvatarOption } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const avatarImages: Record<AvatarOption, any> = {
  1: require("@/assets/avatars/avatar1.png"),
  2: require("@/assets/avatars/avatar2.png"),
  3: require("@/assets/avatars/avatar3.png"),
  4: require("@/assets/avatars/avatar4.png"),
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile>({ name: "", avatar: 1 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    loadProfile();
  }, [isFocused]);

  const loadProfile = async () => {
    const savedProfile = await storage.getUserProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    }
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      const updatedProfile = { ...profile, name: tempName.trim() };
      setProfile(updatedProfile);
      await storage.saveUserProfile(updatedProfile);
      setIsEditingName(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSelectAvatar = async (avatar: AvatarOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedProfile = { ...profile, avatar };
    setProfile(updatedProfile);
    await storage.saveUserProfile(updatedProfile);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your messages, events, and transactions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            setProfile({ name: "", avatar: 1 });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "All data has been cleared");
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.profileSection}>
          <Image
            source={avatarImages[profile.avatar]}
            style={styles.currentAvatar}
            resizeMode="cover"
          />

          {isEditingName ? (
            <View style={styles.nameInput}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                onSubmitEditing={handleSaveName}
              />
              <Pressable
                style={[styles.saveButton, { backgroundColor: theme.accent }]}
                onPress={handleSaveName}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Save
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setTempName(profile.name);
                setIsEditingName(true);
              }}
            >
              <ThemedText type="h1" style={{ textAlign: "center", marginTop: Spacing.lg }}>
                {profile.name || "Tap to set your name"}
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.lg }}>
            Choose Avatar
          </ThemedText>
          <View style={styles.avatarGrid}>
            {([1, 2, 3, 4] as AvatarOption[]).map((avatar) => (
              <Pressable
                key={avatar}
                onPress={() => handleSelectAvatar(avatar)}
                style={({ pressed }) => [
                  styles.avatarOption,
                  {
                    borderColor: profile.avatar === avatar ? theme.accent : theme.border,
                    borderWidth: profile.avatar === avatar ? 3 : 1,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Image
                  source={avatarImages[avatar]}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.lg }}>
            Account
          </ThemedText>

          <Pressable
            style={[
              styles.settingItem,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleClearData}
          >
            <ThemedText style={{ color: theme.error }}>Clear All Data</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.settingItem,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "This feature would connect to authentication services. For now, you can clear your data instead.",
                [{ text: "OK" }]
              );
            }}
          >
            <ThemedText style={{ color: theme.error }}>Delete Account</ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.lg }}>
            About
          </ThemedText>
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={{ color: theme.textSecondary }}>Version 1.0.0</ThemedText>
            <ThemedText
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              AI Assistant helps you schedule meetings, manage finances, and convert currency with ease.
            </ThemedText>
          </View>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  currentAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  nameInput: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  avatarOption: {
    width: (Spacing.fabSize * 1.5),
    height: (Spacing.fabSize * 1.5),
    borderRadius: (Spacing.fabSize * 1.5) / 2,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  settingItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
  },
});
