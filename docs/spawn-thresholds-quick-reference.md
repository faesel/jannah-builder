# Spawn Thresholds – Quick Reference

A one-glance lookup of every asset's spawn threshold. For the full addition,
decay, and visual-effect rules see [`map-appearance-rules.md`](./map-appearance-rules.md).

All tree-scaled assets share one formula:

```
targetCount = 1 + floor((trees − threshold) / repeatEvery)
```

Below the threshold the count is `0`; at the threshold it is `1`; then one more
every `repeatEvery` trees. All values come from `src/config/game.config.ts`.

---

## Trees (foundation)

| Rule | Value |
|------|-------|
| New tree | 3 consecutive complete prayer days |
| First-day seedling | A sapling on the user's very first complete day |
| Stages | sapling → young → mature |

---

## Flowers

| Rule | Value |
|------|-------|
| Threshold | 4 trees |
| Repeat every | 2 trees |
| Placement | Adjacent to existing trees |

### Variety stages

| Variety | Stages |
|---------|--------|
| Pink | 4 |
| Leaf | 4 |
| Teal | 4 |
| Dark | 4 |
| Wild | 4 |
| Purple | 3 |
| Red | 3 |

---

## Buildings

| Type | Threshold | Repeat every | Cluster size |
|------|-----------|--------------|--------------|
| 🏠 Home | 12 trees | 10 | 3–6 |
| 🏛️ Mansion | 35 trees | 40 | 2–4 |
| 🏰 Palace | 70 trees | 80 | 1–2 |

---

## Animals

| Type | Threshold | Repeat every |
|------|-----------|--------------|
| 🐦 Bird | 5 trees | 8 |
| 🐰 Rabbit | 15 trees | 15 |
| 🐿️ Squirrel | 25 trees | 20 |
| 🦌 Deer | 40 trees | 30 |

### 🐈‍⬛ Black cat (special — not tree-scaled)

| Rule | Value |
|------|-------|
| Spawn chance | 5% per prayer logged |
| Duration | 2 days, then fades |
| Limit | One active at a time |

---

## Rivers (water)

| Rule | Value |
|------|-------|
| Threshold | 18 trees |
| Repeat every | 30 trees |
| Base length | 6–10 tiles |
| Length growth | +0.1 tiles per tree above threshold |
| Max length | 25 tiles |

---

## Illustrious Items (streak-based, temporary)

Driven by the **consecutive-day streak**, not tree count. One of each.

| Item | Streak threshold |
|------|------------------|
| Radiant Fountain | 30 days |
| Glowing Tree | 60 days |
| Floating Lantern | 90 days |
| Light Arch | 120 days |

---

## Obstacles (stumps & rocks)

Present from the start; cleared by worship, returning only on missed days.

| Rule | Value |
|------|-------|
| Initial count | 30 (random placement) |
| Types | Stump (5 variants), Rock (7 variants) |
| Rock removal | 1 per prayer logged that day |
| Stump removal | 1 for Qur'an + 1 for dhikr logged that day |
| Return trigger | One stump/rock once prayers are missed **2+ consecutive days** (1st missed day forgiven; current in-progress day excluded) |

---

## Barakah Flowers (Qur'an / dhikr — permanent, decorative)

| Rule | Value |
|------|-------|
| Trigger | Qur'an **or** dhikr logged that day |
| Spawn chance | 2% per qualifying day |
| Types | `basic`, `bush` (random) |
| Permanence | Never fade — purely decorative |
