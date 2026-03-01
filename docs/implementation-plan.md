# Jannah Builder — Phased Implementation Plan

## Current State Summary

### Already Built
- **Project scaffolding** — Expo SDK 54, TypeScript, Expo Router, Reanimated, Skia (dependency installed)
- **Game config** (`src/config/game.config.ts`) — All thresholds and rules are configuration-driven
- **Data model** (`src/types/models.ts`) — Full type definitions for prayers, trees, world, profiles, statistics
- **Prayer logic** (`src/logic/prayerLogic.ts`) — Create, log, consecutive day counting, date helpers
- **Tree logic** (`src/logic/treeLogic.ts`) — Create, upgrade, degrade, spiral placement, decay (one tree at a time)
- **World logic** (`src/logic/worldLogic.ts`) — Day-end processing, tree generation, decay application, stat updates
- **Persistence** (`src/persistence/`) — AsyncStorage wrapper, profile CRUD (max 3 profiles), app state management
- **App initializer** — Creates default profile on first launch
- **Log Prayer screen** (`app/(tabs)/index.tsx`) — Functional UI with prayer toggles and debounced saves
- **Tab navigation** — Expo Router tab layout (Jannah and Statistics tabs visible)
- **ErrorBoundary** — Class-based error boundary component
- **CI pipeline** — GitHub Actions: linting, type checks, web build validation
- **README** — Project documentation

### Needs Attention
- Log Prayer tab is commented out in the tab layout
- Jannah and Statistics screens are placeholders
- `app/_layout.tsx` has dead commented-out JSX
- `src/rendering/` and `src/screens/` are empty directories
- Qur'an/Dhikr logging exists in data model and logic but has no UI
- Day-end processing logic exists but is never triggered
- No unit tests

---

## Phase 1 — Foundation Cleanup

**Goal:** Stabilise the existing codebase, fix known issues, and complete the prayer logging experience.

### Tasks
1. **Re-enable the Log Prayer tab** in `app/(tabs)/_layout.tsx`
2. **Remove dead commented-out code** from `app/_layout.tsx`, `app/(tabs)/jannah.tsx`, and `app/(tabs)/statistics.tsx`
3. **Fix SafeAreaView wrappers** in the Jannah and Statistics placeholder screens
4. **Add Qur'an & Dhikr toggle buttons** to the Log Prayer screen (simple boolean toggles — "I read Qur'an today" / "I did dhikr today")
5. **Wire the prayer save to also persist** Qur'an and Dhikr state
6. **Clean up empty directories** — remove `src/screens/` (screens live under `app/`) and the `.backup` file
7. **Add a day-boundary detection hook** — determine when a new day has started since last app open, so the game loop can be triggered

### Outcome
A fully functional prayer logging screen with Qur'an/Dhikr support, clean codebase, and the scaffolding to trigger daily game logic.

---

## Phase 2 — Core Game Loop

**Goal:** Connect the existing pure logic to the app lifecycle so the world actually evolves.

### Tasks
1. **Implement day-end processing trigger** — On app open, detect any unprocessed days since last active and run `WorldLogic.processDayEnd()` for each
2. **Wire tree generation** — After 3 consecutive complete days, generate a tree and persist it to the profile
3. **Wire decay** — If a full day was missed, apply single-tree decay
4. **Implement season transition logic** — Add a `SeasonLogic` module that evaluates current streak/gaps and transitions between Spring → Summer → Autumn → Winter per config thresholds
5. **Implement map expansion logic** — Expand `mapSize` when tree count crosses `expansionThreshold`
6. **Implement illustrious item logic** — Evaluate streak length against thresholds, add/remove items from world state
7. **Implement building and animal appearance logic** — Check tree count against config thresholds, spawn buildings/animals at milestones
8. **Add unit tests** for all pure logic modules (prayer, tree, world, season, illustrious items)

### Outcome
A complete, testable game engine where the world state evolves based on user behaviour — all driven by configuration.

---

## Phase 3 — Pixel Art Assets

**Goal:** Create the visual foundation for the Jannah map.

### Tasks
1. **Design a base tile set** — Grass, path, water, dirt (top-down, 32×32 pixel tiles)
2. **Design tree sprites** — Sapling, Young, Mature (each as a small pixel-art sprite)
3. **Design flower sprites** — Basic and enhanced (Qur'an-boosted) variants
4. **Design building sprites** — Home, Mansion, Palace (increasing grandeur)
5. **Design animal sprites** — Bird, Rabbit, Deer, Squirrel (small, subtle)
6. **Design seasonal palette variants** — Spring (green/pastel), Summer (vibrant/warm), Autumn (amber/brown), Winter (blue/white)
7. **Design illustrious item sprites** — Radiant fountain, Glowing tree, Floating lantern, Light arch (ethereal, glowing style)
8. **Organise assets** under `assets/sprites/` with a clear naming convention

### Outcome
A complete sprite library ready for Skia rendering across all seasons and world elements.

---

## Phase 4 — Map Rendering (Skia)

**Goal:** Render the Jannah world as an interactive, pannable pixel-art map.

### Tasks
1. **Create a Skia canvas component** (`src/rendering/JannahCanvas.tsx`) — Full-screen canvas that renders the world
2. **Implement tile grid rendering** — Draw the base map using the tile set, sized to `mapSize` from world state
3. **Implement camera system** — Pan and scroll using `react-native-gesture-handler` (pinch-to-zoom optional, pan required)
4. **Render trees** on the map at their stored positions, using the correct sprite for their growth stage
5. **Render flowers** — Place flower sprites based on world state, with Qur'an-boosted density
6. **Render buildings** — Place building sprites at their positions
7. **Render animals** — Place animal sprites with subtle idle positioning
8. **Wire the Jannah screen** (`app/(tabs)/jannah.tsx`) to load the active profile's world state and render it via the canvas
9. **Handle map expansion** — Dynamically grow the rendered area when `mapSize` increases

### Outcome
A fully rendered, pannable pixel-art world that reflects the user's spiritual journey.

---

## Phase 5 — Visual Effects & Ambience

**Goal:** Bring the world to life with seasonal visuals, spiritual effects, and illustrious items.

### Tasks
1. **Implement season rendering** — Swap tile palette and add seasonal overlays (falling leaves in autumn, snow in winter, blossoms in spring)
2. **Implement Qur'an visual effects** — Softer ambient lighting, increased flower density, subtle tree glow (Skia shader or overlay)
3. **Implement Dhikr visual effects** — Floating light particles, fireflies, gentle shimmer (Skia particle system)
4. **Render illustrious items** — Draw streak-based items with glow and soft pulse animations using Reanimated + Skia
5. **Implement illustrious item fade-out** — Gentle disappearance animation when a streak breaks (configurable `fadeOutDuration`)
6. **Add ambient animations** — Gentle tree sway, water shimmer, cloud drift (subtle, calming)
7. **Implement day/night cycle** (optional) — Gradual lighting changes to make dhikr fireflies more visible at night

### Outcome
A living, breathing world with layered visual effects that reward Qur'an/Dhikr logging and long streaks — without pressure.

---

## Phase 6 — Statistics Screen

**Goal:** Provide calm, insightful reflections on the user's journey.

### Tasks
1. **Design the statistics screen layout** — Clean, minimal, soft colour palette
2. **Display core stats** — Total prayers logged, complete days, trees grown, trees decayed, buildings, animals, map age
3. **Display streak info** — Current streak and longest streak (no pressure language — present as "journey" not "record")
4. **Add a simple prayer history view** — Calendar or list showing which days were complete/incomplete
5. **Add a simple line chart** — Prayer consistency over time (calm colours, no aggressive trends)
6. **Ensure all data pulls from the profile's `statistics` and `prayerLogs`**

### Outcome
A reflective statistics screen that provides insight without pressure, guilt, or competitive framing.

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
Phase 1 (Foundation Cleanup)
    │
    ▼
Phase 2 (Core Game Loop)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Assets)    Phase 6 (Statistics)
    │                  
    ▼                  
Phase 4 (Map Rendering)
    │
    ▼
Phase 5 (Visual Effects)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 7 (Profiles)  Phase 8 (Polish)
```

- Phases 3 and 6 can run in parallel after Phase 2
- Phase 4 depends on Phase 3 (needs assets)
- Phase 5 depends on Phase 4 (needs rendering layer)
- Phases 7 and 8 can begin once the core experience is working (after Phase 5)

---

## Guiding Principles (Throughout All Phases)

- **Configuration-driven** — Every threshold, rate, and rule comes from `game.config.ts`
- **Pure logic, separate rendering** — Game mechanics must remain testable without UI
- **No guilt, no pressure** — Every design decision should favour kindness over engagement metrics
- **Incremental delivery** — Each phase produces a usable, stable version of the app
- **Minimal dependencies** — Only add packages when genuinely needed
