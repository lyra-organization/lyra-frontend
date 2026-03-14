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

## Backend Integration Status

### Connected
- **Supabase client** (`lib/supabase.ts`) — SecureStore for token persistence
- **Apple Sign-In** (`login.tsx`) — `signInWithIdToken` → creates `users` row
- **Profile data** (`signup.tsx`) — Saves name/age/gender/show_me to `users` table
- **AI Interview** (`lib/interview.ts`) — Streams from `/interview` edge function, handles SSE chunks
- **Profile parsing** (`lib/profileParser.ts`) — Detects `<profile>` tag, extracts structured JSON
- **Personality embedding** (`lib/embedding.ts`) — Calls `/embed`, stores profile + 512-dim vector in `profiles` table
- **Background GPS** (`lib/location.ts`) — `expo-location` + `expo-task-manager`, writes to `locations` table
- **Push notifications** (`lib/notifications.ts`) — Registers Expo push token, stores in `users`, handles tap navigation
- **Live radar** (`lib/radar.ts`) — Supabase Broadcast channel, Haversine distance, bearing calculation
- **Distance smoothing** (`hooks/useSmoothedDistance.ts`) — Moving average filter

### Waiting on Backend Deployment
The edge functions exist in [lyra-backend](https://github.com/lyra-organization/lyra-backend) but need to be deployed:

```bash
npx supabase link --project-ref lxopklbgmlmterrakgmk
npx supabase db push
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-...
npx supabase functions deploy
```

Also needed:
- Enable **PostGIS** and **pgvector** extensions (Database → Extensions)
- Create DB webhook: table `matches`, event INSERT → function `send-push`

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
├── embedding.ts             # /embed call + profiles table write
├── location.ts              # Background GPS tracking
├── notifications.ts         # Push notification registration
└── radar.ts                 # Broadcast channel + Haversine distance
hooks/
└── useSmoothedDistance.ts    # Moving average for radar distance
```
