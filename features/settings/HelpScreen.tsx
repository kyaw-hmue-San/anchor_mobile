import React from "react";
import { View, Text, Alert, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { HelpSection } from "./sections/HelpSection";
import { useAppTheme } from "../../context/ThemeContext";
import { clearLocalCache, deleteCurrentAccount } from "../../services/account";
import { useSpace } from "../../context/SpaceContext";
import { ROUTES } from "../../main/navigation/routes";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";

export function HelpScreen() {
  const navigation = useNavigation();
  const { signOut } = useSpace();
  const { colors } = useAppTheme();
  const [pending, setPending] = useState(false);

  const onClearLocalCache = () => {
    Alert.alert("Clear local cache", "This clears local app data on this device only.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setPending(true);
          try {
            await clearLocalCache();
            Alert.alert("Done", "Local cache cleared.");
          } finally {
            setPending(false);
          }
        },
      },
    ]);
  };

  const onSignOut = () => {
    Alert.alert("Sign out", "You will need your email/password or quick PIN next time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setPending(true);
          try {
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: ROUTES.Landing as never }] });
          } finally {
            setPending(false);
          }
        },
      },
    ]);
  };

  const onDeleteAccountData = () => {
    if (pending) return;

    Alert.alert(
      "Delete account",
      "This permanently deletes your account and related data. For security, sign in again if prompted. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final confirmation",
              "This cannot be undone. Delete everything now?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete all",
                  style: "destructive",
                  onPress: async () => {
                    setPending(true);
                    try {
                      await deleteCurrentAccount();
                      navigation.reset({ index: 0, routes: [{ name: ROUTES.Auth as never }] });
                      Alert.alert("Deleted", "Your account and related data were removed.");
                    } catch (error) {
                      Alert.alert("Delete failed", getFriendlyFirebaseError(error, "Could not delete account."));
                    } finally {
                      setPending(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <Text style={[styles.screenTitle, { color: colors.text }]}>Help</Text>
        <HelpSection
          onClearLocalCache={onClearLocalCache}
          onSignOut={onSignOut}
          onDeleteAccountData={onDeleteAccountData}
          pending={pending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  screen: { flex: 1, backgroundColor: "#F5F3FF" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
});
