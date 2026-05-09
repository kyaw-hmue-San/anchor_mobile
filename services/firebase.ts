import { initializeApp, getApps, getApp } from "firebase/app";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FirebaseAuth from "firebase/auth";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

import Constants from "expo-constants";

const expoExtra: any = (Constants.manifest && (Constants.manifest as any).extra) || (Constants.expoConfig && (Constants.expoConfig as any).extra) || {};

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || expoExtra.EXPO_PUBLIC_FIREBASE_API_KEY || expoExtra.firebase?.apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || expoExtra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || expoExtra.firebase?.authDomain,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || expoExtra.EXPO_PUBLIC_FIREBASE_PROJECT_ID || expoExtra.firebase?.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || expoExtra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || expoExtra.firebase?.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || expoExtra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || expoExtra.firebase?.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || expoExtra.EXPO_PUBLIC_FIREBASE_APP_ID || expoExtra.firebase?.appId,
};

function missingConfigKeys() {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function isFirebaseConfigured() {
  return missingConfigKeys().length === 0;
}

export function getFirebaseConfigError() {
  const missing = missingConfigKeys();
  if (!missing.length) return null;
  return `Firebase is not configured. Missing: ${missing.join(", ")}`;
}

let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const initializeAuthForNative = (FirebaseAuth as any).initializeAuth as
  | ((app: unknown, deps?: { persistence?: unknown }) => Auth)
  | undefined;
const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence as
  | ((storage: typeof AsyncStorage) => unknown)
  | undefined;

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (authInstance) return authInstance;

  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

  if (Platform.OS === "web") {
    authInstance = getAuth(firebaseApp);
    return authInstance;
  }

  try {
    if (initializeAuthForNative && getReactNativePersistence) {
      authInstance = initializeAuthForNative(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(firebaseApp);
    }
  } catch {
    authInstance = getAuth(firebaseApp);
  }

  return authInstance;
}

export function getFirebaseDb() {
  if (!isFirebaseConfigured()) return null;
  if (firestoreInstance) return firestoreInstance;

  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  firestoreInstance = getFirestore(firebaseApp);

  return firestoreInstance;
}

export function getFirebaseStorage() {
  if (!isFirebaseConfigured()) return null;
  if (storageInstance) return storageInstance;

  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  storageInstance = getStorage(firebaseApp);

  return storageInstance;
}
