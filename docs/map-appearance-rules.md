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

## Trees

Trees are the foundational element of the map. Everything else scales from tree count.

### Generation

- **3 consecutive full prayer days** → 1 tree action.
- A tree action **upgrades the oldest non-mature tree first** (saplings before young trees).
- A new sapling is only planted when all existing trees are already mature.
- **First-day seedling**: On the user's very first complete day, a sapling is planted immediately (even before the 3-day threshold is met).
- Placement: completely random across the grid.

### Growth Stages

```
sapling → young → mature
```

### Decay

Triggered when **an entire day of prayers is missed**.

- Only **one tree** is affected per missed day.
- The **most mature** tree degrades first.
- Degradation order: `mature → young → sapling → removed`.
- Decay **never cascades** across multiple trees.

---

## Flowers

| Rule | Value |
|------|-------|
| Base threshold | 4 trees before flowers appear |

---

## Buildings

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

### Decay

- When trees drop below a threshold, the **newest** building of that type degrades.
- Condition path: `good → dilapidated → removed`.
- Only **one building** is affected per missed day.

---

## Animals

Animals follow the same threshold/repeat formula as buildings.

| Type | Threshold | Repeat Every |
|------|-----------|--------------|
| Bird | 5 trees | 8 |
| Rabbit | 15 trees | 15 |
| Squirrel | 25 trees | 20 |
| Deer | 40 trees | 30 |

### Decay

- When trees drop below a threshold, the **newest** animal of that type is removed.
- Only **one animal** is removed per missed day.

### Black Cat (Special)

| Rule | Value |
|------|-------|
| Spawn chance | 8% per prayer logged |
| Duration | 2 days then disappears |
| Limit | One active at a time |

---

## Rivers

| Rule | Value |
|------|-------|
| Threshold | 18 trees |
| Repeat every | 30 trees |
| Base length | 6–10 tiles |
| Length growth | +0.1 tiles per tree above threshold |
| Max length | 25 tiles |

Rivers are generated as snaking single-tile-wide paths from map edges. They never form thick blobs (enforced by a "snake constraint" preventing adjacency to non-consecutive path tiles).

---

## Illustrious Items (Streak-Based)

Temporary, visually striking items that represent spiritual gifts – not achievements.

| Item | Streak Threshold |
|------|-----------------|
| Radiant Fountain | 30 days |
| Glowing Tree | 60 days |
| Floating Lantern | 90 days |
| Light Arch | 120 days |

### Rules

- Appear when streak reaches the threshold.
- **Fade gently** when streak breaks.
- Never affect trees, buildings, or permanent progress.
- Positioned just outside the tree cluster ring.

---

## Qur'an Effects (Visual Only)

Logging Qur'an **never** generates trees or causes decay. Effects are purely visual.

| Effect | Detail |
|--------|--------|
| Glowing flowers | 1–4 flowers appear at deterministic positions; persist for **2 days** |
| Flower glow | Breathing opacity animation: ~5 % → 80 % (1.5 s cycle) |
| Ambient light boost | ×1.3 |
| Tree glow | Enabled |
| Flower density | ×1.5 |

---

## Dhikr Effects (Visual Only)

Logging dhikr **never** generates trees or causes decay. Effects are purely ambient.

| Effect | Detail |
|--------|--------|
| Floating particles | 20 particles |
| Firefly density | 10 |
| Wind / shimmer | Enabled |

---

## Seasons (Planned)

Seasons represent continuity over time, not perfection.

| Season | Trigger | Mood |
|--------|---------|------|
| Spring | Default / returning to prayer | Flowers, gentle growth |
| Summer | Sustained consistency | Brighter colours, richer life |
| Autumn | Missed days | Falling leaves, warm tones |
| Winter | Long pauses | Quiet, stillness, snow – nothing destroyed |

---

## Total Items on the Map (Theoretical Maximums)

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

| Type | Max Count | Notes |
|------|-----------|-------|
| Persistent (world state) | Uncapped | Stored in world state; no generation logic yet |
| Qur'an glowing flowers | 1–4 | Temporary visual overlay, deterministic per day |

### Grand Total (at 100 trees, full streak)

| Category | Count |
|----------|-------|
| Trees | 100 |
| Buildings | 12 |
| Animals | 25 + 1 black cat |
| Rivers | 3 |
| Illustrious Items | 4 |
| Qur'an Flowers (overlay) | 1–4 |
| **Approximate items** | **~145** |

---

## Core Philosophy Reminders

- Growth is earned slowly.
- Loss is gentle and limited.
- Beauty can be temporary.
- No shaming, no punishment, no competitive mechanics.
- Returning to prayer always moves the world toward Spring.
