# Jannah Builder

A spiritually-sensitive prayer tracking app that visualizes your spiritual journey as a growing pixel-art landscape.

## 🌳 About

Jannah Builder is a cross-platform mobile app built with React Native and Expo. It allows users to log their five daily prayers and watch their spiritual progress manifest as a beautiful, growing world inspired by Jannah (Paradise).

The app emphasizes:
- **Calm reflection** over gamification
- **Gentle encouragement** over guilt or pressure
- **Gradual growth** earned through consistent practice
- **Beautiful impermanence** that mirrors spiritual reality

## 🛠 Technical Stack

- **React Native** & **Expo** - Cross-platform framework
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation
- **React Native Reanimated** - Smooth animations
- **Shopify Skia** - High-performance pixel-art rendering
- **AsyncStorage** - Local-first data persistence

## 🎮 Core Mechanics

### Prayer Logging
- Log five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Three consecutive full days → one tree grows
- Trees progress: Sapling → Young → Mature

### Gentle Decay
- Only triggered when an entire day is missed
- Affects one tree at a time
- Gradual degradation (never cascades)

### Supportive Features
- **Qur'an & Dhikr logging** (simple boolean, no tracking)
- **Visual enhancements** (lighting, flowers, particles)
- **Seasonal transitions** (Spring, Summer, Autumn, Winter)
- **Illustrious items** (temporary streak-based beauty)

## 📁 Project Structure

```
jannah-builder/
├── src/
│   ├── config/       # Game configuration (all rules & thresholds)
│   ├── logic/        # Pure game mechanics (testable, deterministic)
│   ├── persistence/  # AsyncStorage/SQLite layer
│   ├── rendering/    # Skia rendering components
│   ├── screens/      # UI screens
│   ├── components/   # Reusable React components
│   └── types/        # TypeScript interfaces
├── assets/           # Pixel-art sprites & images
└── .github/          # CI/CD workflows
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19.4+
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

### Development

```bash
# Lint code
npm run lint

# Type check
npm run type-check
```

## 🎨 Design Philosophy

This app is built with deep respect for spiritual practice. It:
- Never shames users
- Never punishes harshly
- Never destroys large amounts of progress
- Never encourages obsessive behavior
- Never compares users against each other

Growth is earned slowly. Loss is gentle and limited. Beauty can be temporary.

## 📜 License

Private project.

## 🤲 Note

This app is designed to support, not replace, genuine spiritual practice. May it be a means of drawing closer to Allah (SWT).
