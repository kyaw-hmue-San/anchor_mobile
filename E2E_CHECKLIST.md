# Anchor Mobile Basic E2E Checklist

Use this checklist before release builds.

## Preconditions

- Firebase env variables are configured in `.env`
- Expo app is running with `npx expo start`
- Test account email is available

## Auth + Quick PIN flow

1. Open app fresh (no prior session)
2. Confirm landing screen appears for ~3 seconds
3. Confirm app redirects to `Sign In`
4. Sign up with new email/password
5. Confirm app routes to quick PIN setup screen
6. Create a 4-6 digit quick PIN
7. Confirm app enters main app screen
8. Close app completely and relaunch
9. Confirm landing screen appears, then quick PIN unlock screen appears
10. Enter wrong PIN 5 times
11. Confirm lockout message and cooldown timer are shown
12. Wait for cooldown and enter correct PIN
13. Confirm app unlocks successfully

## Settings safety actions

1. Open `Help`
2. Tap `Clear local cache` and confirm
3. Relaunch app and verify local mode/settings reset
4. Sign in again
5. Tap `Sign out` and confirm app returns to landing/auth flow
6. Sign in again
7. Tap `Delete account data` and confirm
8. Verify account is removed and login with old account fails (or requires new signup)

## Feature sync UX

### Sanctuary
- Verify loading spinner appears on first open
- If network error occurs, verify error card + `Retry sync` button
- Verify empty activity state text appears when no feed exists

### Vault
- Verify loading spinner appears on first open
- Verify `Retry sync` appears on load error
- Verify empty memory state appears when there are no memories

### Duo Calendar
- Verify loading spinner appears on first open
- Verify `Syncing calendar data…` message during actions
- Verify `Retry sync` appears when fetch/save fails
- Verify empty states for events/goals/reminders

### Guardian Alert
- Verify loading spinner appears on first open
- Verify `Retry sync` appears when load fails
- Verify empty state for no alerts in next 24 hours

## Startup reliability

1. Launch app with invalid Firebase env values
2. Confirm landing screen shows startup issue and `Retry startup`
3. Restore valid Firebase env values
4. Tap `Retry startup`
5. Confirm app bootstrap succeeds

## Final pass

- No TypeScript errors in changed files
- Main auth flow works on Android and web (or iOS)
- All danger-zone actions show confirmation dialog before action
