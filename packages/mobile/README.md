# Financial App - Mobile (React Native)

Mobile app built with React Native & Expo, sharing backend and business logic with the web app.

## Quick Start

```bash
# Install dependencies (from root)
pnpm install

# Start Expo dev server
pnpm -F financial-app-mobile start

# For Android (requires Android Studio and emulator running):
pnpm -F financial-app-mobile android

# For iOS (requires macOS with Xcode):
pnpm -F financial-app-mobile ios

# For web (development/testing):
pnpm -F financial-app-mobile web
```

## Structure

```
packages/mobile/
├── src/
│  ├── App.tsx              # Entry point
│  ├── screens/             # Page-level components
│  ├── components/          # Reusable UI components
│  └── navigation/          # Navigation setup
├── app.json                # Expo configuration
└── package.json            # Dependencies
```

## Shared Code

This app imports from `@financial-app/shared`:

```typescript
import { wishlistApi, type WishlistItem } from '@financial-app/shared'
```

Any updates to services, types, or utils in the main app are automatically available here.

## Testing with Android Studio

1. **Open Android Studio**
2. **Tools → AVD Manager → Create Virtual Device**
3. **Select Pixel 5 (or your preferred device)**
4. **Select API 33+ (Android 13+)**
5. **Start the emulator** (green play button)
6. **Run:** `pnpm -F financial-app-mobile android`

## Environment Setup

Create `.env` file (optional, not in repo):

```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:4000/api/v1
# Optional (recommended if backend auth is enabled):
EXPO_PUBLIC_BACKEND_AUTH_TOKEN=eyJhbGciOi...
```

(Note: Android emulator uses `10.0.2.2` for localhost)

## Build for Production

```bash
# Build APK for Android
eas build -p android --non-interactive

# Build IPA for iOS
eas build -p ios --non-interactive
```

Requires [Expo Account](https://expo.dev) and `eas-cli` installed.

## Dashboard Month Picker

- The Home dashboard header uses a month button (replacing the previous settings icon).
- Tapping it opens a slide-up picker with the last 12 months.
- The selected month is saved locally and restored on next app launch.
- Dashboard metrics update for the selected month.
- Loan summary remains based on current overall loan status (not month-filtered).
