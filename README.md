# Anchor Mobile

Anchor Mobile is an Expo + React Native app organized by feature modules (auth, sanctuary, vault, duo calendar, guardian alerts, and settings).

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- AsyncStorage
- Supabase (project folder: `supabase/`)

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Expo Go app (optional for device testing)

## Getting Started

```bash
npm install
npm run start
```

Then choose a target from Expo CLI:

- `a` for Android
- `i` for iOS (macOS required)
- `w` for Web

Or run directly:

```bash
npm run android
npm run ios
npm run web
```

## Firebase Setup (required for real auth)

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Then restart Expo:

```bash
npm run start
```

Current backend status:

- Auth in `context/SpaceContext.tsx` uses Firebase Auth (email/password).
- Spaces + pairing code use Firestore (`services/spaces.ts`).
- Sanctuary mood, DuoCalendar events, Guardian Alert reads, Vault memories, and snapshots use Firebase (`services/storage.ts`).
- Profile name persists to Firebase (`services/profile.ts`).
- App settings persist to Firebase with local cache fallback (`services/appSettings.ts`).

## Project Structure

```text
main/                 App shell + navigation
features/             Feature-based screens and components
  auth/
  sanctuary/
  vault/
  duo-calendar/
  guardian-alert/
  settings/
components/           Shared UI components
context/              Global React context (e.g., SpaceContext)
services/             App services (e.g., storage)
models/               Shared types/models
assets/               Static assets
supabase/             Supabase-related resources/config
```

## Firebase Rules

This project includes:

- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`

Deploy rules after login:

```bash
npx firebase login
npx firebase deploy --only firestore:rules,storage
```

### Web upload CORS setup (Firebase Storage)

If profile image upload fails on web with a CORS / XMLHttpRequest preflight error, configure CORS on your Storage bucket once:

```bash
gsutil cors set firebase.storage.cors.json gs://your_project.appspot.com
```

Then verify:

```bash
gsutil cors get gs://your_project.appspot.com
```

This repo includes a starter config file: `firebase.storage.cors.json`.

## Entry Points

- `App.tsx`
- `main/App.tsx`
- `index.ts`

## Notes

- If you use Supabase, add your project credentials/config as required by your local setup.
- Keep new screens/components inside the relevant `features/*` module to preserve current architecture.
