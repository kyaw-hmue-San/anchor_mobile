# Play Store Setup Quick Guide (Anchor)

Use this to complete the Play Console items shown in your screenshot.

## 1. Privacy Policy URL

You need a **public URL**.

### Option A (fastest if you have any hosting)
- Upload `public/privacy-policy.html` to any static host (GitHub Pages, Netlify, Vercel, Firebase Hosting).
- Paste that URL into Play Console.

### Fast path with your current repo (Firebase Hosting already configured)
1. Build web output:
	- npx expo export --platform web
2. Deploy hosting:
	- npx firebase login
	- npx firebase deploy --only hosting
3. Use this URL in Play Console:
	- https://YOUR_PROJECT_ID.web.app/privacy-policy.html

### Option B (presentation emergency)
- Put the policy text on a public Google Doc and publish to web.
- Use the published URL temporarily, then replace with your permanent site URL.

## 2. App Access

Select:
- **All or some functionality is restricted**: `No`

(Your app requires sign-in but does not use an external review login gate beyond normal account flow.)

## 3. Ads

Select:
- **Does your app contain ads?** `No`

(Only choose Yes if you integrated AdMob or another ads SDK.)

## 4. Content Rating

Fill the questionnaire conservatively:
- Category: Lifestyle / Social
- No gambling, no explicit violence, no sexual content, no real-money betting.

Result should generally be suitable for teens/adults depending on answers.

## 5. Target Audience

Recommended selection for Anchor:
- `18 and over`

(Do not target children under 13.)

## 6. Data Safety (important)

Because you use Firebase + optional location + photos, declare collection/sharing accurately.

### Data collected (typical for your app)
- Personal info: Email address
- App info and performance: basic diagnostics (if collected by SDK defaults)
- Photos and videos: user-selected images
- Location: precise location (optional feature)
- App activity: user content like events/moods/notes

### Data sharing
- Shared with connected partner inside app feature context
- Processed by Firebase service providers

### Security practices
- Data encrypted in transit: `Yes`
- Users can request/delete account data: `Yes` (if your in-app delete flow exists)

## 7. Government apps

Select:
- `No` (unless this is an official government app)

## 8. Financial features

Select:
- `No` (unless you provide loans, payments, wallets, or financial services)

## 9. Health

Select:
- `No`

(Your mood feature is relational wellness context, not clinical health/medical service.)

## 10. App category + contact details

- Category: `Lifestyle` (primary) or `Social` depending your preference
- Provide support email (required)
- Provide website (optional but recommended)

## 11. Store listing

Prepare:
- App name: Anchor
- Short description (max ~80 chars)
- Full description
- App icon
- Screenshots (phone required)

## Suggested Short Description
Private couple space for mood sync, shared reminders, and daily snapshots.

## Suggested Full Description
Anchor is a private digital sanctuary for couples to stay connected through daily mood check-ins, shared milestone reminders, and relationship-focused planning tools. Manage your duo calendar, guardian reminders, snapshots, and notes in one secure shared space.

## Final reminder
Before production rollout, replace placeholder contact email in privacy policy and verify Data Safety answers match your exact runtime behavior.
