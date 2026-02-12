import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "../../main/navigation/routes";
import { getUser, saveUser } from "../../services/storage";
import { User } from "../../models/types";

export function AuthScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("");
  const [partnerCode, setPartnerCode] = useState("");

  const handleContinue = async () => {
    if (!displayName.trim()) {
      Alert.alert("Missing name", "Please enter a display name.");
      return;
    }
    const user: User = {
      id: "local-user",
      displayName: displayName.trim(),
      partnerCode: partnerCode.trim() || "partner-demo",
    };
    await saveUser(user);
    navigation.navigate(ROUTES.MainTabs as never);
  };

  const handlePrefill = async () => {
    const existing = await getUser();
    if (existing) {
      setDisplayName(existing.displayName);
      setPartnerCode(existing.partnerCode);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Anchor</Text>
      <Text style={{ fontSize: 16 }}>Private digital sanctuary for you two.</Text>
      <TextInput
        placeholder="Your display name"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Partner code (fake pairing)"
        value={partnerCode}
        onChangeText={setPartnerCode}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
      <Button title="Continue" onPress={handleContinue} />
      <Button title="Load saved profile" onPress={handlePrefill} />
    </View>
  );
}
