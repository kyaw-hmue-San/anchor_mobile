import React from "react";
import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function DuoCalendarScreen() {
  const navigation = useNavigation();

  const goToGuardianAlert = () => {
    navigation.navigate("GuardianAlert" as never);
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Duo-Calendar</Text>
      <Button title="Go to Guardian Alert" onPress={goToGuardianAlert} />
    </View>
  );
}
