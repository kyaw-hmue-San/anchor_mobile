import React, { useState } from "react";
import { View, Text, Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { useSpace } from "../../context/SpaceContext";
import { SpacesSection } from "./sections/SpacesSection";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";
import * as Clipboard from "expo-clipboard";

export function SpacesScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [spaceName, setSpaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"create" | "join" | "generate" | null>(null);

  const { loading: spaceLoading, userId, activeSpaceId, activeSpaceName, createSpace, joinWithCode, generateCode } = useSpace();

  const disableActions = spaceLoading || busy;

  const onCreateSpace = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to create a shared space.");
      return;
    }
    if (activeSpaceId) {
      Alert.alert("Space already active", "You already have an active space. Join from the existing space or sign out if you want a fresh account.");
      return;
    }

    setBusy(true);
    setLoadingAction("create");
    try {
      const { spaceId, spaceName: createdName, error } = await createSpace(spaceName.trim() || "Shared Space");
      if (error || !spaceId) return Alert.alert("Create space failed", getFriendlyFirebaseError(error, "Could not create space."));
      setSpaceName("");
      const { code, error: codeError } = await generateCode(spaceId);
      if (code && !codeError) {
        setLastCode(code);
        await Clipboard.setStringAsync(code);
        setStatusMsg(`Created ${createdName ?? "Shared Space"}. Pairing code copied to clipboard.`);
        Alert.alert("Copied successfully", "Pairing code copied to clipboard.");
      } else {
        setStatusMsg(`Created ${createdName ?? "Shared Space"}. Pairing code can be generated below.`);
      }
    } finally {
      setLoadingAction(null);
      setBusy(false);
    }
  };

  const onJoinSpace = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to join a shared space.");
      return;
    }
    if (!joinCode.trim()) return Alert.alert("Missing code", "Enter a pairing code to join.");

    setBusy(true);
    setLoadingAction("join");
    try {
      const { spaceId, spaceName: joinedName, error } = await joinWithCode(joinCode.trim());
      if (error || !spaceId) return Alert.alert("Join failed", getFriendlyFirebaseError(error, "Could not join this space."));
      setJoinCode("");
      const message = `Successfully joined ${joinedName ?? "Shared Space"}. Have fun together 💕`;
      setStatusMsg(message);
      Alert.alert("Success", message, [
        {
          text: "Go to Home",
          onPress: () => navigation.navigate("Home" as never),
        },
      ]);
    } finally {
      setLoadingAction(null);
      setBusy(false);
    }
  };

  const onGenerateCode = async () => {
    if (!activeSpaceId) return Alert.alert("No active space", "Create or join a space first.");

    setBusy(true);
    setLoadingAction("generate");
    try {
      const { code, error } = await generateCode(activeSpaceId);
      if (error || !code) return Alert.alert("Code error", getFriendlyFirebaseError(error, "Could not generate code."));
      setLastCode(code);
      await Clipboard.setStringAsync(code);
      setStatusMsg("Pairing code copied to clipboard.");
      Alert.alert("Copied successfully", "Pairing code copied to clipboard.");
    } finally {
      setLoadingAction(null);
      setBusy(false);
    }
  };

  const onCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setStatusMsg("Pairing code copied to clipboard.");
    Alert.alert("Copied successfully", "Pairing code copied to clipboard.");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <Text style={[styles.screenTitle, { color: colors.text }]}>Spaces</Text>

        <SpacesSection
          activeSpaceId={activeSpaceId}
          activeSpaceName={activeSpaceName}
          spaceLoading={disableActions}
          loadingAction={loadingAction}
          userId={userId}
          spaceName={spaceName}
          joinCode={joinCode}
          lastCode={lastCode}
          statusMsg={statusMsg}
          setSpaceName={setSpaceName}
          setJoinCode={setJoinCode}
          onCreateSpace={onCreateSpace}
          onJoinSpace={onJoinSpace}
          onGenerateCode={onGenerateCode}
          onCopyCode={onCopyCode}
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
