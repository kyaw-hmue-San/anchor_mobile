import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from "react-native-svg";

export type AnchorLogoProps = {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
};

export function AnchorLogo({ size = 28, showWordmark = false, wordmarkColor = "#111827" }: AnchorLogoProps) {
  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="anchorGradient" x1="40" y1="24" x2="120" y2="136" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#C084FC" />
            <Stop offset="1" stopColor="#7C3AED" />
          </LinearGradient>
        </Defs>
        <Rect x="12" y="12" width="136" height="136" rx="32" fill="#F5F3FF" />
        <Path
          d="M80 38c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16Zm0 32v24a12 12 0 0 1-12 12h-6a4 4 0 0 0 0 8h36a4 4 0 0 0 0-8h-6a12 12 0 0 1-12-12V70"
          fill="url(#anchorGradient)"
        />
        <Path d="M52 82c0 15.5 12.5 28 28 28s28-12.5 28-28" stroke="#7C3AED" strokeWidth={6} strokeLinecap="round" />
        <Circle cx="80" cy="54" r="6" fill="#FFFFFF" />
      </Svg>
      {showWordmark ? <Text style={[styles.wordmark, { color: wordmarkColor }]}>Anchor</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { fontSize: 18, fontWeight: "800" },
});
