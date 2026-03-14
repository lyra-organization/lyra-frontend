# Lyra - Frontend

Proximity-based dating app. No swiping — an AI interviews users to build personality profiles, then notifies them when a compatible match is physically nearby. One approves, the other opens a live GPS radar, and they walk toward each other.

## User Flow

```
Login (Apple Sign-In) → Profile Setup → Onboarding (AI Interview) → Home → Match Profile → Proximity Radar
```

1. **Login** — "Lyra / Find your person" → Continue with Apple (real Apple Sign-In via Supabase Auth)
2. **Profile Setup** — Photo slots, name, age, gender, "Want to meet" preferences → saved to `users` table
3. **Onboarding** — Animated glowing orb (Lyra) streams AI interview via `/interview` edge function. Detects `<profile>` tag when done, saves profile + personality embedding to `profiles` table
4. **Home** — Blue breathing orb, "Looking for someone compatible near you". Background GPS tracking starts, push notifications registered. Real-time match listener active. Tap 5x for demo mode.
5. **Match Profile** — Circular photo, bio, Lyra's match reasoning. Pink/gray edge gradients that glow on button hold. "Let's not" / "Let's meet!"
6. **Proximity Radar** — Real GPS via Supabase Broadcast channel, Haversine distance, bearing calculation. Falls back to demo simulation for demo IDs. Confetti + haptics on arrival.

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/(auth)/login` | Apple Sign-In → creates auth session + `users` row |
| Profile Setup | `/(app)/signup` | Name, age, gender, orientation → saved to `users` table |
| Onboarding | `/(app)/onboarding` | AI interview with streaming SSE, profile parsing, embedding |
| Home | `/(app)/home` | Blue orb + GPS tracking + push registration + match listener |
| Match Profile | `/(app)/match/[id]` | Profile reveal with interactive edge gradients |
| Proximity Radar | `/(app)/radar/[id]` | Live GPS radar via Broadcast channel, or demo simulation |

## How Matching Works

The match flow is **sequential** — both users must accept one at a time:

```
Trigger creates match (status: pending)
  → user_b gets push notification + realtime alert
  → user_b sees profile, taps "Let's meet!" or "Let's not"
     → calls /respond-match Edge Function
     → if accept: status → approved, user_a gets notified
     → if pass: status → rejected, done

  → user_a gets push notification + realtime alert
  → user_a sees profile, taps "Let's meet!" or "Let's not"
     → calls /respond-match Edge Function
     → if accept: status → confirmed, both go to radar
     → if pass: status → rejected, done

  → Radar: both users walk toward each other
  → At < 3m: celebration, status → met
```

All match actions go through the `/respond-match` Edge Function (service role) — the frontend never writes directly to `matches` or `interactions`.

## Backend Integration

| Feature | Frontend file | Backend endpoint |
|---------|--------------|-----------------|
| Auth | `lib/supabase.ts`, `login.tsx` | Supabase Auth (Apple Sign-In) |
| AI Interview | `lib/interview.ts` | `/interview` Edge Function (Claude) |
| Profile save | `lib/embedding.ts` | `/embed` Edge Function (OpenAI + DB write) |
| Match actions | `match/[id].tsx` | `/respond-match` Edge Function |
| Background GPS | `lib/location.ts` | Direct write to `locations` table |
| Push notifications | `lib/notifications.ts` | `/send-push` Edge Function (webhook) |
| Live radar | `lib/radar.ts` | Supabase Broadcast channel |

## Demo Mode

From the home screen, **tap anywhere 5 times** to trigger demo mode:
1. After 3 seconds, Sam's profile appears
2. Hold "Let's meet!" (pink glow) or "Let's not" (gray glow)
3. Radar screen: compass arrow + distance counts down 88m → 0m over 25 seconds
4. At < 3m: confetti burst from bottom + haptic vibration

## Tech Stack

- Expo SDK 55 + TypeScript
- expo-router v5 (file-based routing)
- Supabase (auth, database, edge functions, realtime)
- React Native SVG (radar, orb gradients, compass arrow, edge gradients)
- React Native Animated API (orb breathing, confetti particles, text transitions)
- expo-location + expo-task-manager (background GPS)
- expo-notifications (push notifications)
- expo-apple-authentication + expo-crypto (Apple Sign-In)
- expo-secure-store (token persistence)
- expo-haptics (celebration vibration)

## Setup

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Fill in your Supabase URL and anon key

# Run in Expo Go
npx expo start --ios
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Project Structure

```
app/
├── _layout.tsx              # Root layout with auth state listener
├── index.tsx                # Entry → redirects based on auth state
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx            # Apple Sign-In
├── (app)/
│   ├── _layout.tsx
│   ├── onboarding.tsx       # AI interview with streaming
│   ├── signup.tsx           # Profile setup → saves to users table
│   ├── home.tsx             # Blue orb + GPS + push + match listener
│   ├── match/[id].tsx       # Match profile with edge gradients
│   └── radar/[id].tsx       # Live GPS radar or demo simulation
lib/
├── supabase.ts              # Supabase client with SecureStore
├── interview.ts             # SSE streaming from /interview edge function
├── profileParser.ts         # <profile> tag detection + JSON parsing
├── embedding.ts             # Calls /embed Edge Function (profile + vectors saved server-side)
├── location.ts              # Background GPS tracking
├── notifications.ts         # Push notification registration
└── radar.ts                 # Broadcast channel + Haversine distance
hooks/
└── useSmoothedDistance.ts    # Moving average for radar distance
```
