# Copilot Instructions – Janna Builder

## Project Overview
Janna Builder is a cross-platform mobile app built with **React Native and Expo**.

The app allows users to log their five daily prayers and visualise spiritual progress as a growing landscape (Jannah) rendered in a pixel-art, top-down style.

The experience is **calm, reflective, and spiritually sensitive**.  
It must avoid guilt, pressure, or competitive mechanics.

---

## Core Technical Stack
- React Native
- Expo
- TypeScript
- Expo Router (if navigation is required)
- React Native Reanimated
- Shopify Skia (for map rendering and animations)
- Local-first persistence by default

Do not introduce heavy game engines or unnecessary dependencies unless explicitly requested.

---

## Architecture Principles
- Separate:
  - Game mechanics (pure logic)
  - Rendering (Skia / UI)
  - Persistence (storage)
- Game rules must be configuration-driven
- Avoid hard-coded timings or thresholds
- Prefer deterministic, testable logic

---

## Game Philosophy (CRITICAL)
This app should never:
- Shame users
- Punish users harshly
- Destroy large amounts of progress
- Encourage obsessive streak behaviour
- Compare users against each other

Growth is **earned slowly**.  
Loss is **gentle and limited**.  
Beauty can be **temporary**.

---

## Core Mechanics

### Prayer Logging (Foundational)
- Prayer is the primary mechanic
- Logged prayers contribute toward daily completion
- Three consecutive full days of completed prayers generate one tree

### Tree Growth
- Trees progress through:
  - Sapling
  - Young tree
  - Mature tree
- Trees are added gradually
- Trees are permanent unless affected by decay

### Decay
- Triggered only when **an entire day of prayers is missed**
- Affects **one tree at a time**
- Decay is gradual:
  - Mature → Young
  - Young → Sapling
  - Sapling → Removed
- Decay never cascades across multiple trees

---

## Qur’an & Dhikr Logging (Supportive Mechanics)

### Logging Model
Qur’an and dhikr are logged in the **simplest possible way**:
- “I read Qur’an today” (boolean)
- “I did dhikr today” (boolean)

No counters.  
No minutes.  
No verse or tasbih tracking.

---

### Effect Scope
- Qur’an and dhikr **never generate trees**
- They **never cause decay**
- They **only enhance visuals and ambience**

If the user does not log them, nothing is lost.

---

## Visual Effects of Qur’an & Dhikr

### Qur’an Effects
- Softer, brighter ambient lighting
- Increased flower appearance
- Rivers or gardens may unlock over time
- Trees may appear healthier or subtly glowing

### Dhikr Effects
- Floating light particles
- Fireflies at night
- Gentle wind or shimmer effects
- Calmer animation pacing

These effects represent **barakah**, not progress.

---

## Streak-Based Illustrious Items (NEW FEATURE)

### Concept
Long-term consistency may cause **illusory, illustrious items** to appear on the map.

These items:
- Are visually striking
- Are clearly non-permanent
- Disappear gently when consistency breaks

They represent *temporary spiritual gifts*, not achievements.

---

### Examples of Illustrious Items
- Radiant fountains
- Glowing trees with golden leaves
- Floating lanterns
- Light arches
- Subtle celestial motifs

These items should:
- Glow
- Pulse softly
- Feel “otherworldly”
- Stand apart from permanent assets

---

### Streak Rules
- Illustrious items are tied to **long, consistent behaviour**
- Breaking the streak causes:
  - A gentle fade-out animation
  - No decay
  - No punishment
  - No negative messaging

Disappearance should feel like:
> “This gift has returned to the unseen.”

Not like failure.

---

### Important Constraints
- No counters shown prominently
- No “X-day streak” pressure language
- No loss of permanent assets
- Items should never block or affect core gameplay

---

## Seasons System

### Purpose
Seasons represent **continuity over time**, not perfection.

### Season Mapping
- **Spring**
  - Default
  - Flowers, gentle growth
- **Summer**
  - Sustained consistency
  - Brighter colours, richer life
- **Autumn**
  - Missed days
  - Falling leaves, warm tones
- **Winter**
  - Long pauses
  - Quiet, stillness, snow
  - Growth pauses, nothing is destroyed

Returning to prayer always moves the world back toward Spring.

---

## Map & World Design
- Top-down pixel-art style inspired by classic Pokémon
- More vibrant and warm colour palette
- Map starts small and expands gradually
- User can pan and explore freely

### World Elements
- Trees
- Flowers
- Buildings:
  - Homes
  - Mansions
  - Palaces
- Animals:
  - Birds
  - Rabbits
  - Deer
  - Squirrel
- Illustrious temporary items

Appearance thresholds must be configurable.

---

## Configuration-Driven Design
All mechanics must be controlled via a configuration file (e.g. `game.config.ts`), including:
- Days per tree
- Decay rates
- Building thresholds
- Animal appearance
- Season transitions
- Illustrious item rules

Never hard-code these values.

---

## Persistence & Profiles
- Up to **three user profiles**
- Each profile has an independent world
- App state must persist between sessions

Prefer:
- AsyncStorage / SQLite for local-first
- Backend storage only if explicitly required

---

## Navigation & UI
Bottom navigation must include:
- Log Prayer
- View Jannah
- Statistics

UI principles:
- Soft transitions
- Minimal text
- No aggressive alerts
- No gamified pressure

---

## Statistics & Visualisation
Statistics may include:
- Total sawab
- Trees grown
- Trees decayed
- Buildings created
- Animals appeared
- Map age

Graphs:
- Simple line charts
- Calm colour palette
- No trophies or rankings

---

## Git & CI Expectations
- First commit must include a `.gitignore`
- GitHub Actions should include:
  - Linting
  - Type checks
  - Build validation

CI should be stable and conservative.

---

## Documentation Expectations
- Keep README updated
- Comment intent, not just implementation
- Tone must remain respectful and neutral

---

## When Unsure
When ambiguity exists, choose the option that:
- Is simpler
- Is kinder
- Preserves progress
- Avoids pressure

Never introduce competitive or addictive mechanics unless explicitly instructed.
