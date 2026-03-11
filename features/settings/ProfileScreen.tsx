import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { AnchorLogo } from "../../components/AnchorLogo";
import { MenuButton } from "../../components/MenuButton";
import { getFirebaseAuth } from "../../services/firebase";
import { clearProfilePhoto, getProfileName, getProfilePhotoUrl, saveProfileName, saveProfilePhoto } from "../../services/profile";
import { useSpace } from "../../context/SpaceContext";
import { useAppTheme } from "../../context/ThemeContext";

function nameFromEmail(email: string) {
  return email.split("@")[0] || "";
}

function getPhotoUploadErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  if (Platform.OS === "web" && /(cors|xmlhttprequest|failed to fetch|network request failed)/i.test(rawMessage)) {
    return "Web upload blocked. Firebase Storage may not be set up yet (or CORS is missing). Open Firebase Console → Storage → Get started, then retry.";
  }

  return "Could not update profile photo.";
}

export function ProfileScreen() {
  const { session, mode, activeSpaceId } = useSpace();
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = session?.user?.email ?? "Not signed in";
  const trimmedName = name.trim();
  const hasChanges = trimmedName !== initialName.trim();
  const canSave = !!trimmedName && hasChanges && !saving && !loading && !uploadingPhoto;
  const avatarLabel = (trimmedName || email).slice(0, 1).toUpperCase();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setStatus(null);
      try {
        const [localName, photo] = await Promise.all([getProfileName(), getProfilePhotoUrl()]);
        setPhotoUrl(photo || null);
        if (localName) {
          setName(localName);
          setInitialName(localName);
          return;
        }

        if (session?.user?.email) {
          const fallback = nameFromEmail(session.user.email);
          setName(fallback);
          setInitialName(fallback);
        }
      } catch {
        setError("Could not load profile details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.user?.email]);

  const onPickPhoto = async () => {
    if (uploadingPhoto || loading) return;

    setUploadingPhoto(true);
    setError(null);
    setStatus(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo access to update your profile image.");
      setUploadingPhoto(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) {
      setUploadingPhoto(false);
      return;
    }

    try {
      const uri = result.assets[0].uri;
      const uploadedUrl = await saveProfilePhoto(uri);

      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: uploadedUrl });
      }

      setPhotoUrl(uploadedUrl);
      setStatus("Profile photo updated.");
    } catch (error) {
      setError(getPhotoUploadErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onRemovePhoto = () => {
    if (uploadingPhoto || loading) return;

    Alert.alert("Remove photo", "Do you want to remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (uploadingPhoto || loading) return;

          setUploadingPhoto(true);
          setError(null);
          setStatus(null);

          try {
            await clearProfilePhoto();
            const auth = getFirebaseAuth();
            if (auth?.currentUser) {
              await updateProfile(auth.currentUser, { photoURL: null });
            }
            setPhotoUrl(null);
            setStatus("Profile photo removed.");
          } catch {
            setError("Could not remove profile photo.");
          } finally {
            setUploadingPhoto(false);
          }
        },
      },
    ]);
  };

  const onSave = async () => {
    if (!trimmedName) {
      setError("Please enter a username.");
      return;
    }

    if (!hasChanges) {
      setStatus("No changes to save.");
      return;
    }

    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      await saveProfileName(trimmedName);

      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      }

      setInitialName(trimmedName);
      setStatus("Profile updated.");
    } catch {
      setError("Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AnchorLogo size={35} />
          <MenuButton color={colors.text} />
        </View>

        <Text style={[styles.screenTitle, { color: colors.text }]}>Profile</Text>
        <Text style={[styles.muted, { color: colors.muted }]}>Customize your display name</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.accountRow}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={[styles.avatar, { borderColor: colors.border }]} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{avatarLabel}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountTitle, { color: colors.text }]}>{trimmedName || "Your profile"}</Text>
              <Text style={[styles.accountSubtitle, { color: colors.muted }]}>{email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }, uploadingPhoto && styles.primaryButtonDisabled]}
            onPress={onPickPhoto}
            disabled={uploadingPhoto || loading}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {uploadingPhoto ? "Uploading photo..." : "Change Profile Photo"}
            </Text>
          </TouchableOpacity>

          {photoUrl ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, uploadingPhoto && styles.primaryButtonDisabled]}
              onPress={onRemovePhoto}
              disabled={uploadingPhoto || loading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Remove Profile Photo</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Mode</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{mode === "couple" ? "Couple" : "Solo"}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Active Space</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{activeSpaceId ?? "None"}</Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Username</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.muted, { color: colors.muted }]}>Loading profile…</Text>
            </View>
          ) : null}

          <TextInput
            value={name}
            onChangeText={value => {
              setName(value);
              if (error) setError(null);
              if (status) setStatus(null);
            }}
            placeholder="Enter your username"
            placeholderTextColor={colors.muted}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            autoCapitalize="words"
            editable={!loading && !saving && !uploadingPhoto}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: canSave ? colors.primary : colors.border }, (saving || loading || uploadingPhoto) && styles.primaryButtonDisabled]}
            onPress={onSave}
            disabled={!canSave}
          >
            <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Profile"}</Text>
          </TouchableOpacity>

          {error ? <Text style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
          {status ? <Text style={[styles.status, { color: colors.muted }]}>{status}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F3FF" },
  screen: { flex: 1, backgroundColor: "#F5F3FF" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  muted: { color: "#6B7280" },
  card: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", fontSize: 18 },
  accountTitle: { fontSize: 16, fontWeight: "700" },
  accountSubtitle: { fontSize: 13 },
  infoRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { fontWeight: "600" },
  infoValue: { fontWeight: "700", flexShrink: 1 },
  label: { color: "#111827", fontWeight: "700" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    backgroundColor: "#FFF",
    color: "#111827",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: { opacity: 0.6 },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontWeight: "700" },
  primaryButtonText: { color: "white", fontWeight: "700" },
  status: { color: "#6B7280" },
});
