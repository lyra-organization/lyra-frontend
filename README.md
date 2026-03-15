# Human — Frontend

Proximity-based dating app where an AI conversation builds your personality profile, then notifies you when a compatible person is physically nearby. A live GPS radar guides you toward each other for a face-to-face meeting.

## Stack

- **Runtime:** Expo SDK 55, React Native 0.83.2, React 19, TypeScript (strict)
- **Routing:** expo-router (file-based, typed routes)
- **Backend:** Supabase JS v2.49.1 (pinned — newer versions crash on React Native)
- **Auth storage:** expo-secure-store (iOS Keychain, `AFTER_FIRST_UNLOCK` for background access)
- **Location:** expo-location (foreground + background GPS), expo-task-manager
- **Proximity:** expo-nearby-connections (Bluetooth/WiFi peer discovery)
- **Voice:** expo-speech-recognition (speech-to-text)
- **Audio:** expo-audio (TTS playback)
- **Push:** expo-notifications (Expo Push Service)
- **UI:** react-native-svg (radar, orb animations), expo-haptics

## Architecture

```
Phone (Expo) <-> Supabase (DB + Edge Functions) <-> AI Services (Claude, OpenAI)
```

The app operates in three phases:

1. **Onboarding** — AI voice interview produces a structured personality profile stored as 8 x 512-dim vectors
2. **Waiting** — Background GPS uploads location every 30s; the backend auto-matches compatible nearby users
3. **Meeting** — Both users see each other's profile, approve the meeting, then navigate via a real-time radar

## Project Structure

```
lyra-frontend/
├── app/                        # Screens (expo-router file-based routing)
│   ├── _layout.tsx             # Root layout — auth guard, session listener
│   ├── index.tsx               # Smart router — redirects based on profile state
│   ├── (auth)/
│   │   └── login.tsx           # Email-based login/signup
│   └── (app)/
│       ├── signup.tsx          # Profile setup (name, age, gender, photos)
│       ├── onboarding.tsx      # AI voice interview screen
│       ├── home.tsx            # Waiting screen with match listener
│       ├── match/[id].tsx      # Match reveal — profile + approve/pass
│       └── radar/[id].tsx      # Live proximity radar with haptics
├── lib/
│   ├── supabase.ts             # Supabase client with SecureStore adapter
│   ├── interview.ts            # SSE streaming to /interview edge function
│   ├── embedding.ts            # Calls /embed edge function to save profile
│   ├── profileParser.ts        # Parses <profile> JSON tags from AI response
│   ├── location.ts             # Background GPS task + location tracking
│   ├── notifications.ts        # Push token registration + notification routing
│   └── radar.ts                # Supabase Broadcast channel + haversine math
├── hooks/
│   └── useSmoothedDistance.ts  # Exponential moving average for GPS jitter
├── app.json                    # Expo config, permissions, plugins
├── tsconfig.json               # Strict mode, @/* path alias
└── package.json
```

## Screens

| Route | Screen | Purpose |
|---|---|---|
| `/` | Smart Router | Checks auth, user, profile — redirects accordingly |
| `/(auth)/login` | Login | Email-based auth |
| `/(app)/signup` | Profile Setup | Name, age, gender, orientation, up to 4 photos |
| `/(app)/onboarding` | AI Interview | Voice conversation with Claude via TTS/STT |
| `/(app)/home` | Waiting | Breathing orb, background GPS, match listener |
| `/(app)/match/[id]` | Match Reveal | Photo carousel, AI summary, approve or pass |
| `/(app)/radar/[id]` | Radar | Live GPS radar with directional cone + haptics |

## Key Flows

### Auth Flow

1. `_layout.tsx` checks session on mount and listens for auth state changes
2. Smart router (`index.tsx`) queries `users` and `profiles` tables to determine destination
3. Tokens persist in iOS Keychain with `AFTER_FIRST_UNLOCK` so background tasks can access them

### Interview Flow

1. User taps mic — `expo-speech-recognition` captures speech (non-continuous mode for fast response)
2. Transcript is sent to `/interview` edge function which streams Claude's response as SSE
3. Response chunks are batched into sentences (>=60 chars) and sent to `/tts` for audio playback
4. When Claude emits a `<profile>` tag, the profile JSON is parsed and the "That's me!" button appears
5. Profile is saved via `/embed` edge function (generates 8 x 512-dim vectors server-side)

### Match Detection

Two mechanisms run concurrently on the home screen:
- **Supabase Realtime** — postgres_changes subscription on `matches` table
- **Polling fallback** — 5-second interval query for pending/approved matches

### Radar Flow

1. Both users subscribe to the same Supabase Broadcast channel (`radar:{matchId}`)
2. GPS updates at 1-second intervals are broadcast to the peer (>20m accuracy readings filtered out)
3. Distance is smoothed with an EMA (alpha=0.2) to reduce GPS jitter
4. Bearing is computed via forward azimuth and rendered as a directional SVG cone
5. `expo-nearby-connections` detects Bluetooth/WiFi proximity (~30m) as a secondary trigger
6. At <15m (or BLE peer found), celebration triggers with triple haptic feedback and confetti

### Radar Color Zones

| Distance | Color | Label |
|---|---|---|
| >80m | Blue `#4466FF` | Distance in meters |
| 30-80m | Green `#22C55E` | "Getting closer" |
| 15-30m | Amber `#F59E0B` | "Very close!" |
| <15m | Pink `#FF00DD` | "You found them!" |

## Environment Variables

Create `.env.local` in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup

```bash
npm install
npx expo start
```

iOS only — `platforms` is set to `["ios"]` in `app.json`.

## Notable Details

- **Demo mode:** 5 taps on the home screen triggers a fake match flow with hardcoded profile data
- **Audio session reset:** After speech recognition, the audio mode is reconfigured before TTS playback to prevent volume drop (iOS switches to earpiece during recording)
- **Background location:** Uses a separate Supabase client with `autoRefreshToken: false` to avoid token refresh issues in background tasks
- **Supabase JS pinned to v2.49.1** — newer versions crash on React Native
