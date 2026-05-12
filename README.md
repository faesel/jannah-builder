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
- Affects one tree at a time
- Gradual degradation (never cascades)

### Supportive Practices
- **Qur'an logging** — simple "I read Qur'an today" toggle
- **Dhikr logging** — simple "I did dhikr today" toggle
- These enhance visual ambience but never generate or destroy trees

### Statistics
- Current streak and longest streak
- 7-day prayer history with completion indicators
- Current world state vs all-time totals (toggle view)
- Garden age display
- Reset Garden option with gentle two-step confirmation

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
│   └── (tabs)/       # Tab navigation (Prayer, Jannah, Stats)
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
