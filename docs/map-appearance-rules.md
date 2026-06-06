# Jannah Map – Appearance Rules

A summary of all the rules that govern what appears on the Jannah map and when.

---

## Map Grid

| Property | Value |
|----------|-------|
| Grid size | 20 × 20 tiles (fixed) |
| Tile size | 32 px (base reference) |
| Min tile size | 16 px |
| Expansion | Disabled – map does not grow |

---

# Addition Rules

How and when elements are added to the map.

---

## Trees (Addition)

Trees are the foundational element of the map. Everything else scales from tree count.

- **3 consecutive full prayer days** → 1 tree action.
- A tree action **upgrades the oldest non-mature tree first** (saplings before young trees).
- A new sapling is only planted when all existing trees are already mature.
- **First-day seedling**: On the user's very first complete day, a sapling is planted immediately (even before the 3-day threshold is met).
- Placement: completely random across the grid.

### Growth Stages

```
sapling → young → mature
```

---

## Flowers (Addition)

Flowers appear naturally alongside trees, placed adjacent to them for a natural understory look. Like trees, flowers progress through growth stages and **upgrading existing flowers is prioritised over creating new ones**.

Formula: `targetCount = 1 + floor((trees − threshold) / repeatEvery)`

| Rule | Value |
|------|-------|
| Threshold | 4 trees |
| Repeat every | 2 trees |
| Placement | Adjacent to existing trees (cardinal + diagonal) |

### Varieties

| Variety | Stages |
|---------|--------|
| Pink | 3 |
| Leaf | 3 |
| Purple | 4 |
| Red | 3 |
| Teal | 3 |
| Dark | 3 |
| Wild | 4 |

- When a new flower is created, a **random variety** is chosen.
- Each action upgrades the **oldest, lowest-stage** flower first.
- A new flower (stage 1) is only planted when all existing flowers are at their maximum stage.

---

## Barakah Flowers (Addition – Permanent)

Logging Qur'an or dhikr may spawn a small `basic` flower or `bush` on the map for visual richness.

| Rule | Value |
|------|-------|
| Trigger | Qur'an **or** dhikr logged for the day |
| Spawn chance | 2% per qualifying day (`world.dhikrFlowers.spawnChance`) |
| Types | `basic`, `bush` (random) |
| Permanence | Permanent — never fade or decay |
| Effect on progress | None – purely decorative |

These represent **barakah**, not progress. If the user does not log Qur'an or dhikr, nothing is lost. They are stored under `worldState.dhikrFlowers` (name retained for storage compatibility).

---

## Obstacles (Stumps & Rocks)

Obstacles represent the untamed state of the map. They are cleared by progress and return when prayers are missed.

| Rule | Value |
|------|-------|
| Initial count | 30 (placed randomly on new profile) |
| Types | Stump (5 variants), Rock (7 variants) |
| Rock removal | One rock cleared per **prayer logged** that day (oldest first) |
| Stump removal | One stump cleared for **Qur'an logged** and one for **dhikr logged** that day (oldest first) |
| Addition trigger | Missed prayer day — one random stump or rock appears |

All obstacles are gradually cleared as the user logs prayers, Qur'an and dhikr; they only return on missed days.
Obstacles never block game mechanics or prevent element placement.

---

## Buildings (Addition)

Buildings appear when the tree count crosses configured thresholds. Additional instances spawn every `repeatEvery` trees beyond the initial threshold.

Formula: `targetCount = 1 + floor((trees − threshold) / repeatEvery)`

| Type | Threshold | Repeat Every | Cluster Size |
|------|-----------|--------------|--------------|
| Home | 12 trees | 10 | 3–6 |
| Mansion | 35 trees | 40 | 2–4 |
| Palace | 70 trees | 80 | 1–2 |

### Clustering

- Same-type buildings form street-like clusters (placed in cardinal adjacency).
- Once a cluster reaches its random size limit, a new cluster starts elsewhere.

---

## Animals (Addition)

Animals follow the same threshold/repeat formula as buildings.

Formula: `targetCount = 1 + floor((trees − threshold) / repeatEvery)`

| Type | Threshold | Repeat Every |
|------|-----------|--------------|
| Bird | 5 trees | 8 |
| Rabbit | 15 trees | 15 |
| Squirrel | 25 trees | 20 |
| Deer | 40 trees | 30 |

### Black Cat (Special)

| Rule | Value |
|------|-------|
| Spawn chance | 8% per prayer logged |
| Duration | 2 days then disappears |
| Limit | One active at a time |

---

## Rivers (Addition)

| Rule | Value |
|------|-------|
| Threshold | 18 trees |
| Repeat every | 30 trees |
| Base length | 6–10 tiles |
| Length growth | +0.1 tiles per tree above threshold |
| Max length | 25 tiles |

Rivers are generated as snaking single-tile-wide paths from map edges. They never form thick blobs (enforced by a "snake constraint" preventing adjacency to non-consecutive path tiles).

---

## Illustrious Items (Addition – Streak-Based)

Temporary, visually striking items that represent spiritual gifts – not achievements.

| Item | Streak Threshold |
|------|-----------------|
| Radiant Fountain | 30 days |
| Glowing Tree | 60 days |
| Floating Lantern | 90 days |
| Light Arch | 120 days |

- Appear when streak reaches the threshold.
- Positioned just outside the tree cluster ring.
- Never affect trees, buildings, or permanent progress.

---

# Decay Rules

How and when elements are removed or degraded. Decay is triggered when **an entire day of prayers is missed**.

---

## Trees (Decay)

| Rule | Value |
|------|-------|
| Trigger | Entire day missed |
| Trees affected | 1 per missed day |
| Target selection | Most mature tree first |
| Cascade | Never — only one tree per day |

### Degradation path

```
mature → young → sapling → removed
```

---

## Buildings (Decay)

Triggered on a missed day when tree count drops below a building type's threshold.

| Rule | Value |
|------|-------|
| Trigger | Tree count < threshold for a building type |
| Target selection | Newest building of that type |
| Buildings affected | 1 per missed day |
| Condition path | `good → dilapidated → removed` |

### Thresholds (same as addition)

| Type | Threshold |
|------|-----------|
| Home | 12 trees |
| Mansion | 35 trees |
| Palace | 70 trees |

If trees drop below the threshold, the desired count decreases and excess buildings are decayed one at a time.

---

## Animals (Decay)

Triggered on a missed day when tree count drops below an animal type's threshold.

| Rule | Value |
|------|-------|
| Trigger | Tree count < threshold for an animal type |
| Target selection | Newest animal of that type |
| Animals affected | 1 per missed day |
| Condition path | Removed immediately (no intermediate state) |

### Thresholds (same as addition)

| Type | Threshold |
|------|-----------|
| Bird | 5 trees |
| Rabbit | 15 trees |
| Squirrel | 25 trees |
| Deer | 40 trees |

---

## Flowers (Decay)

| Rule | Value |
|------|-------|
| Trigger | Tree count drops below threshold (4 trees) |
| Target selection | Highest-stage flower first, then newest |
| Flowers affected | 1 per missed day |
| Condition path | Stage N → Stage N−1 → … → Stage 1 → Removed |

### Threshold

| | Value |
|-|-------|
| Threshold | 4 trees |
| Repeat every | 2 trees |

---

## Obstacles (Decay / Regrowth)

| Rule | Value |
|------|-------|
| Trigger | Missed prayer day |
| Effect | One random stump or rock appears on the map |
| Removal | Happens when new elements are added (see Addition Rules) |

---

## Rivers (Decay)

| Rule | Value |
|------|-------|
| Trigger | Tree count drops below threshold (18 trees) |
| Target selection | Newest river |
| Rivers affected | 1 per missed day |
| Condition path | Removed immediately (no intermediate state) |

### Threshold

| | Value |
|-|-------|
| Threshold | 18 trees |
| Repeat every | 30 trees |

---

## Illustrious Items (Decay)

| Rule | Value |
|------|-------|
| Trigger | Streak breaks (not a missed day per se — just loss of consecutive days) |
| Effect | Gentle fade-out animation |
| Impact on permanent progress | None |

Disappearance represents a temporary gift returning — not failure.

---

# Visual Effects (Non-Mechanical)

These effects never generate trees, cause decay, or affect game state. They are purely cosmetic.

---

## Qur'an Effects

| Effect | Detail |
|--------|--------|
| Glowing flowers | 1–4 flowers appear at deterministic positions; persist for **2 days** |
| Flower glow | Breathing opacity animation: ~5 % → 80 % (1.5 s cycle) |
| Ambient light boost | ×1.3 |
| Tree glow | Enabled |

---

## Dhikr Effects

| Effect | Detail |
|--------|--------|
| Floating particles | 20 particles |
| Firefly density | 10 |
| Wind / shimmer | Enabled |

---

# Seasons (Planned)

Seasons represent continuity over time, not perfection.

| Season | Trigger | Mood |
|--------|---------|------|
| Spring | Default / returning to prayer | Flowers, gentle growth |
| Summer | Sustained consistency | Brighter colours, richer life |
| Autumn | Missed days | Falling leaves, warm tones |
| Winter | Long pauses | Quiet, stillness, snow – nothing destroyed |

---

# Summary: Total Items on the Map (at 100 Trees)

The formula for scaled elements is: `targetCount = 1 + floor((trees − threshold) / repeatEvery)`

Note: there is no hard cap on tree count. The values below use 100 trees as a reference point.

### Trees

| | Count |
|-|-------|
| Reference point | **100** (no hard cap) |

### Buildings

| Type | Calculation | Max Count |
|------|-------------|-----------|
| Home | 1 + floor((100 − 12) / 10) | **9** |
| Mansion | 1 + floor((100 − 35) / 40) | **2** |
| Palace | 1 + floor((100 − 70) / 80) | **1** |
| **Total buildings** | | **12** |

### Animals

| Type | Calculation | Max Count |
|------|-------------|-----------|
| Bird | 1 + floor((100 − 5) / 8) | **12** |
| Rabbit | 1 + floor((100 − 15) / 15) | **6** |
| Squirrel | 1 + floor((100 − 25) / 20) | **4** |
| Deer | 1 + floor((100 − 40) / 30) | **3** |
| Black Cat | 1 (temporary, max 1 at a time) | **1** |
| **Total animals** | | **26** |

### Rivers

| | Calculation | Max Count |
|-|-------------|-----------|
| Rivers | 1 + floor((100 − 18) / 30) | **3** |

### Illustrious Items

| | Max Count |
|-|-----------|
| Radiant Fountain | 1 |
| Glowing Tree | 1 |
| Floating Lantern | 1 |
| Light Arch | 1 |
| **Total illustrious** | **4** |

### Flowers

| Type | Calculation | Max Count | Notes |
|------|-------------|-----------|-------|
| Persistent | 1 + floor((100 − 4) / 2) | **49** | Generated by tree-count mechanic |
| Qur'an glowing flowers | — | 1–4 | Temporary visual overlay, deterministic per day |

### Grand Total (at 100 trees, full streak)

| Category | Count |
|----------|-------|
| Trees | 100 |
| Flowers | 49 |
| Buildings | 12 |
| Animals | 25 + 1 black cat |
| Rivers | 3 |
| Illustrious Items | 4 |
| Qur'an Flowers (overlay) | 1–4 |
| **Approximate items** | **~195** |

---

## Core Philosophy Reminders

- Growth is earned slowly.
- Loss is gentle and limited.
- Beauty can be temporary.
- No shaming, no punishment, no competitive mechanics.
- Returning to prayer always moves the world toward Spring.
