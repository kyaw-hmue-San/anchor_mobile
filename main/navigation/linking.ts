import { LinkingOptions } from "@react-navigation/native";
import { ROUTES } from "./routes";

export const linking: LinkingOptions<any> = {
  prefixes: ["/"],
  config: {
    screens: {
      [ROUTES.Landing]: "",
      [ROUTES.Auth]: "auth",
      [ROUTES.QuickPinSetup]: "quick-pin-setup",
      [ROUTES.QuickPinUnlock]: "quick-pin-unlock",
      [ROUTES.ChangeQuickPin]: "change-quick-pin",
      [ROUTES.MainTabs]: {
        path: "app",
        screens: {
          Home: {
            path: "",
            screens: {
              [ROUTES.SoloTimeline]: "date",
              [ROUTES.Sanctuary]: "sanctuary",
              [ROUTES.DuoCalendar]: {
                path: "calendar",
                screens: {
                  [ROUTES.DuoCalendarHome]: "",
                  [ROUTES.GuardianAlert]: "guardian-alert",
                },
              },
              [ROUTES.Vault]: "vault",
            },
          },
          [ROUTES.Profile]: "profile",
          [ROUTES.Spaces]: "spaces",
          [ROUTES.Settings]: "settings",
          [ROUTES.Help]: "help",
        },
      },
    },
  },
};
