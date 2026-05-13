# Jannah Builder

A spiritually-sensitive prayer tracking app that visualises your spiritual journey as a growing pixel-art landscape.

## 🌳 About

Jannah Builder is a cross-platform mobile app built with React Native and Expo. It allows users to log their five daily prayers and watch their spiritual progress manifest as a beautiful, growing world inspired by Jannah (Paradise).

The app emphasises:
- **Calm reflection** over gamification
- **Gentle encouragement** over guilt or pressure
- **Gradual growth** earned through consistent practice
- **Beautiful impermanence** that mirrors spiritual reality

## 🛠 Technical Stack

- **React Native** & **Expo** (SDK 54) — Cross-platform framework
- **TypeScript** — Type-safe development
- **Expo Router** — File-based tab navigation
- **React Native Animated** — Smooth native-driven animations
- **AsyncStorage** — Local-first data persistence
- **expo-haptics** — Subtle tactile feedback
- **expo-av** — Completion sound effects
- **Node Canvas** — Pixel-art sprite generation scripts

## 🎮 Features

### Prayer Logging
- Log five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Haptic feedback on each toggle
- Gentle chime when all five prayers are logged
- Three consecutive full days → one tree grows
- Trees progress: Sapling → Young → Mature

### Jannah Map
- Top-down pixel-art world rendered as a tile grid (scales to screen size)
- 6 grass tile variants with deterministic placement for natural-looking terrain
- Trees, flowers, buildings, and animals appear as you progress
- **Animated animals** — birds, rabbits, deer, and squirrels roam the map with feeding, idle, and movement behaviours; each species moves at a different speed with collision avoidance
- Visual effects for Qur'an reading (glowing flowers, warm golden overlay) and Dhikr (floating light particles)
- Illustrious items (radiant fountains, glowing trees, floating lanterns, light arches) appear during long streaks and fade gently when broken

### Gentle Decay
- Only triggered when an entire day is missed
- Affects one tree at a time (gradual degradation, never cascades)
- Buildings and animals also gently disappear when trees drop below their thresholds
- Newest elements are removed first, preserving older progress

### Supportive Practices
- **Qur'an logging** — simple "I read Qur'an today" toggle
- **Dhikr logging** — simple "I did dhikr today" toggle
- These enhance visual ambience but never generate or destroy trees

### Rivers
- Rivers snake across the map as your garden grows (threshold: 35 trees)
- Water tiles follow a snake constraint — no two edges may touch
- Rivers cannot overlap trees or buildings
- Ground animals cannot cross water (birds can fly over but not land)
- Sand borders automatically surround every body of water

### Statistics
- Current streak and longest streak
- 7-day prayer history with completion indicators
- **Qur'an and Dhikr weekly trends** — visual dot indicators showing consistency
- Current world state vs all-time totals (toggle view)
- Garden age display

### Settings
- Accessible from Statistics page (not in bottom navigation)
- **About section** — describes the app as a motivational tool for Muslims
- **Reset Garden** — gentle two-step confirmation to clear all data
- **Version number** — displayed from app config

### Animated Wildlife
- **Birds, rabbits, deer, and squirrels** roam the map independently
- Three behaviours: idle (standing still), feeding (grazing animation), and moving (directional sprites)
- Per-species movement speed (birds fastest, deer slowest)
- Collision avoidance — animals cannot walk through buildings or trees (birds can perch on trees)
- Randomised timing so animals behave naturally

## 📁 Project Structure

```
jannah-builder/
├── app/              # Expo Router screens
│   ├── (tabs)/       # Tab navigation (Prayer, Jannah, Stats)
│   └── settings.tsx  # Settings page (accessed from Stats)
├── src/
│   ├── config/       # Game configuration & colour palette
│   ├── logic/        # Pure game mechanics (testable, deterministic)
│   ├── persistence/  # AsyncStorage profile management
│   ├── rendering/    # JannahCanvas and sprite definitions
│   ├── hooks/        # useGameLoop hook
│   ├── components/   # Reusable UI components (StatCard, ErrorBoundary)
│   ├── types/        # TypeScript interfaces
│   └── __tests__/    # Unit and integration tests
├── assets/
│   └── sprites/      # Pixel-art sprite images
│       ├── tiles/    # Grass (6 variants), dirt, path, water
│       ├── trees/    # Sapling, young, mature
│       ├── flowers/  # Basic and enhanced (Qur'an) variants
│       ├── buildings/# Home, mansion, palace
│       ├── animals/  # Bird, rabbit, deer, squirrel (+ animation frames)
│       └── illustrious/ # Fountain, glowing tree, lantern, light arch
├── scripts/          # Sprite generation scripts (Node Canvas)
├── docs/             # Implementation plan & store listing
└── .github/          # CI/CD workflows
```

## ⚙️ Configuration

All game mechanics are configuration-driven via `src/config/game.config.ts`:

- **Prayer thresholds** — consecutive days per tree, daily prayer names
- **Tree mechanics** — decay rules, growth stages
- **Building & animal thresholds** — when homes, mansions, palaces, and animals appear
- **Animal behaviour** — movement speed per species, idle/feeding/movement durations
- **Illustrious items** — streak thresholds for radiant fountains, glowing trees, lanterns, arches
- **Map** — grid size, tile size, expansion rules
- **Debug tools** — grid lines, show all sprites, simulated progress (days/months/years)

No game rules are hard-coded. Change the config to change the game.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm
- Expo Go app (for mobile testing)

### Installation

```bash
npm install
npm start
```

### Platform-specific

```bash
npm run ios
npm run android
npm run web
```

### Development

```bash
npm run lint          # ESLint
npm run type-check    # TypeScript compiler check
npm test              # Jest test suite
```

## 📦 Releases

### Creating a Release

Releases are built and published via GitHub Actions. The workflow builds both an AAB (for Google Play) and APK (for sideloading), runs all checks, and creates a GitHub Release.

#### 1. Bump the version

Update **both** fields in `app.json`:

```json
{
  "expo": {
    "version": "2.2.0",
    "android": {
      "versionCode": 2
    }
  }
}
```

- **`version`** — semver string displayed to users
  - **Patch** (2.1.2 → 2.1.3) — bug fixes, minor tweaks
  - **Minor** (2.1.3 → 2.2.0) — new features, visual changes
  - **Major** (2.2.0 → 3.0.0) — breaking changes, major redesigns
- **`versionCode`** — integer that **must increment** with every Play Store upload (1, 2, 3, …)

Commit and push the version bump to `main`.

#### 2. Set up signing (first time only)

To sign releases for Google Play, add these repository secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded release keystore file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias within the keystore |
| `KEY_PASSWORD` | Key password |

To generate a keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore -alias jannah-builder \
  -keyalg RSA -keysize 2048 -validity 10000

# Encode for GitHub secret
base64 -i release.keystore | pbcopy
```

> **Important:** Keep your keystore safe. If lost, you cannot update the app on Google Play.

#### 3. Trigger the release workflow

1. Go to **Actions** → **Release** in the GitHub repository
2. Click **Run workflow**
3. Enter the version number (must match `app.json`)
4. Click **Run workflow**

The workflow will:
- Validate the version format and match against `app.json`
- Run lint, type checks, and all tests
- Build the AAB (Play Store) and APK (sideloading)
- Sign both if keystore secrets are configured
- Create a GitHub Release tagged `v{version}` with both files attached

#### 4. Publish to Google Play

1. Download the `.aab` file from the GitHub Release
2. Go to [Google Play Console](https://play.google.com/console)
3. Select your app → **Production** → **Create new release**
4. Upload the `.aab` file
5. Add release notes and submit for review

### Building Locally

If you need to build on your machine:

#### Prerequisites

- **JDK 17** — download from [Adoptium](https://adoptium.net/)
- **Android SDK** — install via Android Studio or standalone SDK tools
- **Node.js** — version 18+

#### Steps

```bash
# 1. Clean prebuild to generate the android/ directory
npx expo prebuild --platform android --clean

# 2. Export the JS bundle and assets
npx expo export --platform android

# 3. Copy the exported bundle into the Android project
cp -r dist/* android/app/src/main/assets/

# 4. Build the release AAB (for Play Store)
cd android
JAVA_HOME=~/jdk17/jdk-17.0.19+10/Contents/Home \
ANDROID_HOME=~/Library/Android/sdk \
./gradlew app:bundleRelease

# 5. Or build APK (for sideloading)
./gradlew app:assembleRelease
```

- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

> **Note:** Adjust `JAVA_HOME` to match your JDK 17 path. JDK 24+ is not supported by the current Gradle version.

## 🎨 Design Philosophy

This app is built with deep respect for spiritual practice. It:
- Never shames users
- Never punishes harshly
- Never destroys large amounts of progress
- Never encourages obsessive behaviour
- Never compares users against each other

Growth is earned slowly. Loss is gentle and limited. Beauty can be temporary.

## ♿ Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`
- Prayer toggles use `switch` role with checked state
- Touch targets meet the 44×44pt minimum
- Screen reader hints on non-obvious actions
- Calm colour palette with sufficient contrast

## 📜 Licence

Private project.

## 🤲 Note

This app is designed to support, not replace, genuine spiritual practice. May it be a means of drawing closer to Allah (SWT).
