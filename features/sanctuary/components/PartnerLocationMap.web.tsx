import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  latitude: number;
  longitude: number;
  partnerName: string;
};

export function PartnerLocationMap({ latitude, longitude, partnerName }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{partnerName} location</Text>
      <Text style={styles.coords}>Latitude: {latitude.toFixed(6)}</Text>
      <Text style={styles.coords}>Longitude: {longitude.toFixed(6)}</Text>
      <Text style={styles.note}>Map preview is available on iOS/Android builds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 10,
    backgroundColor: "#EFF6FF",
    gap: 4,
  },
  title: {
    fontWeight: "700",
    color: "#1F2937",
  },
  coords: {
    color: "#374151",
    fontSize: 12,
  },
  note: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
  },
});
