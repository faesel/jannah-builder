# Jannah Builder — Phased Implementation Plan

## Current State Summary

### Completed
- **Phase 1 — Foundation Cleanup** ✅
- **Phase 2 — Core Game Loop** ✅
- **Phase 3 — Pixel Art Assets** ✅ (including 6 grass variants, 28 animal animation frames, improved building sprites)
- **Phase 4 — Map Rendering** ✅ (React Native Animated + Image-based, not Skia)
- **Phase 5 — Visual Effects & Ambience** ✅ (Qur'an glowing flowers, Dhikr particles, illustrious items, animal animations)
- **Phase 6 — Statistics Screen** ✅

### Built Features
- **Project scaffolding** — Expo SDK 54, TypeScript, Expo Router
- **Game config** (`src/config/game.config.ts`) — All thresholds, rules, and debug flags are configuration-driven
- **Data model** (`src/types/models.ts`) — Full type definitions for prayers, trees, world, profiles, statistics
- **Prayer logic** (`src/logic/prayerLogic.ts`) — Create, log, consecutive day counting, date helpers
- **Tree logic** (`src/logic/treeLogic.ts`) — Create, upgrade, degrade, spiral placement, decay (one tree at a time)
- **World logic** (`src/logic/worldLogic.ts`) — Day-end processing, tree generation, decay application, stat updates
- **Persistence** (`src/persistence/`) — AsyncStorage wrapper, profile CRUD (max 3 profiles), app state management
- **Log Prayer screen** (`app/(tabs)/index.tsx`) — Prayer toggles, Qur'an/Dhikr logging, haptic feedback, completion chime
- **Jannah Map** (`src/rendering/JannahCanvas.tsx`) — Full pixel-art map with 6 grass variants, trees, flowers, buildings, animals, illustrious items, visual effects
- **Animated animals** — Birds, rabbits, deer, squirrels with idle/feeding/movement states, per-species speed, collision avoidance
- **Statistics screen** (`app/(tabs)/statistics.tsx`) — Streaks, 7-day history, world state vs all-time totals, garden age, reset garden
- **Sprite generation** (`scripts/generate-sprites.js`, `scripts/generate-animal-sprites.js`) — Automated pixel-art generation via Node Canvas
- **Debug tools** — Show grid lines, show all sprites, simulated progress (days/months/years)
- **CI pipeline** — GitHub Actions: linting, type checks, web build validation
- **107 unit tests** across 8 test suites — all passing

### Remaining
- **Phase 7 — Profile Management** — Multi-profile selection, creation, switching, deletion
- **Phase 8 — Polish & Release** — Smooth transitions, performance optimisation, expanded tests, accessibility pass, app store preparation

---

## Phase 1 — Foundation Cleanup ✅

**Completed.** Prayer logging screen with Qur'an/Dhikr support, clean codebase, day-boundary detection.

---

## Phase 2 — Core Game Loop ✅

**Completed.** Day-end processing, tree generation/decay, map expansion, illustrious items, building/animal thresholds, 107 unit tests.

---

## Phase 3 — Pixel Art Assets ✅

**Completed.** Full sprite library: 6 grass variants, 3 tree stages, flowers (basic + enhanced), 3 building types, 4 animal species (32 sprites each with directional + feeding frames), 4 illustrious items. All generated via Node Canvas scripts (`scripts/generate-sprites.js`, `scripts/generate-animal-sprites.js`).

---

## Phase 4 — Map Rendering ✅

**Completed.** Full-screen tile-based map using React Native Animated + Image components (not Skia). Renders grass grid, trees, flowers, buildings, animals, and illustrious items at world state positions. Map scales to screen size dynamically.

---

## Phase 5 — Visual Effects & Ambience ✅

**Completed.** Qur'an effects (glowing flowers with warm golden overlay), Dhikr effects (floating light particles), illustrious items with glow/pulse animations, and full animal animation system (idle, feeding with 3-frame cycles, directional movement with collision avoidance, per-species speed).

---

## Phase 6 — Statistics Screen ✅

**Completed.** Clean statistics screen with streaks, 7-day prayer history, current vs all-time world state toggle, garden age, and reset garden with two-step confirmation.

---

## Phase 7 — Profile Management

**Goal:** Allow users to manage up to three independent profiles.

### Tasks
1. **Create a profile selection screen** — Show existing profiles (up to 3) with their world preview/stats summary
2. **Add "New Profile" flow** — Name input, create profile, set as active
3. **Add profile switching** — Tap a profile to set it as active; world and stats update accordingly
4. **Add profile deletion** — With gentle confirmation ("This world will be removed")
5. **Integrate profile context** — Ensure all screens (prayer, jannah, stats) read from the active profile
6. **Add a settings screen** (optional) — Notifications toggle, sound toggle, theme selector

### Outcome
Full multi-profile support with independent worlds, as specified in the design document.

---

## Phase 8 — Polish & Release Preparation

**Goal:** Harden the app for release.

### Tasks
1. **Add smooth screen transitions** — Soft fades between tabs, gentle animations on state changes
2. **Add haptic feedback** — Subtle vibration on prayer toggle (optional, tasteful)
3. **Add sound effects** (optional) — Gentle ambient sounds, soft confirmation tones
4. **Performance optimisation** — Profile Skia rendering, lazy-load heavy assets, optimise re-renders
5. **Expand unit test coverage** — Aim for full coverage of all logic modules
6. **Add integration tests** — Test the full flow: log prayers → trigger game loop → verify world state
7. **Accessibility pass** — Screen reader labels, contrast ratios, touch target sizes
8. **Update README and documentation** — Reflect final architecture and feature set
9. **App store preparation** — Icons, screenshots, store descriptions, privacy policy

### Outcome
A polished, tested, accessible app ready for distribution.

---

## Dependency Graph

```
Phase 1 (Foundation Cleanup)     ✅
    │
    ▼
Phase 2 (Core Game Loop)         ✅
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Assets) ✅  Phase 6 (Statistics) ✅
    │                  
    ▼                  
Phase 4 (Map Rendering) ✅
    │
    ▼
Phase 5 (Visual Effects) ✅
    │
    ├──────────────────┐
    ▼                  ▼
Phase 7 (Profiles)  Phase 8 (Polish)    ← NEXT
```

- Phases 1–6 are complete
- Phases 7 and 8 are the remaining work before release

---

## Guiding Principles (Throughout All Phases)

- **Configuration-driven** — Every threshold, rate, and rule comes from `game.config.ts`
- **Pure logic, separate rendering** — Game mechanics must remain testable without UI
- **No guilt, no pressure** — Every design decision should favour kindness over engagement metrics
- **Incremental delivery** — Each phase produces a usable, stable version of the app
- **Minimal dependencies** — Only add packages when genuinely needed
