import React from "react";
import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function AuthScreen() {
  const navigation = useNavigation();

  const handleContinue = () => {
    navigation.navigate("MainTabs" as never);
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Auth / Pairing</Text>
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}
