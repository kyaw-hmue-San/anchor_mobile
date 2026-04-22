import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  partnerName: string;
};

export function PartnerLocationMap({ latitude, longitude, partnerName }: Props) {
  return (
    <View style={styles.mapWrap}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={`${partnerName} location`}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  map: {
    width: "100%",
    height: 180,
  },
});
