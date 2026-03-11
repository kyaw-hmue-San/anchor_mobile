import React, { useState } from "react";
import { View, Text, Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { useSpace } from "../../context/SpaceContext";
import { SpacesSection } from "./sections/SpacesSection";
import { useAppTheme } from "../../context/ThemeContext";
import { getFriendlyFirebaseError } from "../../services/firebaseErrors";

export function SpacesScreen() {
  const { colors } = useAppTheme();
  const [spaceName, setSpaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { loading: spaceLoading, userId, mode, activeSpaceId, setSoloMode, setCoupleMode, createSpace, joinWithCode, generateCode } = useSpace();

  const disableActions = spaceLoading || busy;

  const onCreateSpace = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to create a shared space.");
      return;
    }

    setBusy(true);
    try {
      const { spaceId, error } = await createSpace(spaceName.trim() || "Shared Space");
      if (error || !spaceId) return Alert.alert("Create space failed", getFriendlyFirebaseError(error, "Could not create space."));
      setSpaceName("");
      setStatusMsg(`Active space: ${spaceId}`);
    } finally {
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
    try {
      const { spaceId, error } = await joinWithCode(joinCode.trim());
      if (error || !spaceId) return Alert.alert("Join failed", getFriendlyFirebaseError(error, "Could not join this space."));
      setJoinCode("");
      setStatusMsg(`Joined space: ${spaceId}`);
    } finally {
      setBusy(false);
    }
  };

  const onGenerateCode = async () => {
    if (!activeSpaceId) return Alert.alert("No active space", "Create or join a space first.");

    setBusy(true);
    try {
      const { code, error } = await generateCode(activeSpaceId);
      if (error || !code) return Alert.alert("Code error", getFriendlyFirebaseError(error, "Could not generate code."));
      setLastCode(code);
      setStatusMsg(`Share this code: ${code}`);
    } finally {
      setBusy(false);
    }
  };

  const onCoupleMode = async () => {
    const err = await setCoupleMode();
    if (err) {
      const message = getFriendlyFirebaseError(err, "Couple mode is unavailable right now.");
      Alert.alert("Couple mode unavailable", message);
      setStatusMsg(message);
      return;
    }
    setStatusMsg(activeSpaceId ? `Couple mode active in ${activeSpaceId}` : "Couple mode active");
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
          mode={mode}
          activeSpaceId={activeSpaceId}
          spaceLoading={disableActions}
          userId={userId}
          spaceName={spaceName}
          joinCode={joinCode}
          lastCode={lastCode}
          statusMsg={statusMsg}
          setSpaceName={setSpaceName}
          setJoinCode={setJoinCode}
          onSolo={setSoloMode}
          onCoupleHint={onCoupleMode}
          onCreateSpace={onCreateSpace}
          onJoinSpace={onJoinSpace}
          onGenerateCode={onGenerateCode}
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
