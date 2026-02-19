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

## Entry Points

- `App.tsx`
- `main/App.tsx`
- `index.ts`

## Notes

- If you use Supabase, add your project credentials/config as required by your local setup.
- Keep new screens/components inside the relevant `features/*` module to preserve current architecture.
