import React from "react";
import { TouchableOpacity } from "react-native";
import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export function MenuButton({ color = "#111827" }: { color?: string }) {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();

  const openDrawer = () => {
    let target: NavigationProp<Record<string, object | undefined>> | undefined = navigation;

    while (target && !target.dispatch) {
      target = (target as any).getParent?.();
    }

    let drawerNav: NavigationProp<Record<string, object | undefined>> | undefined = target;
    while (drawerNav) {
      // @ts-expect-error: openDrawer exists on drawer navigator
      if (typeof (drawerNav as any).openDrawer === "function") break;
      drawerNav = (drawerNav as any).getParent?.();
    }

    if (drawerNav) {
      drawerNav.dispatch(DrawerActions.openDrawer());
    } else {
      console.warn("Drawer navigator not found for MenuButton");
    }
  };

  return (
    <TouchableOpacity
      onPress={openDrawer}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="menu" size={22} color={color} />
    </TouchableOpacity>
  );
}
