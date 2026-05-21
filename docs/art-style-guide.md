# 🎨 Jannah Builder - Art Style Guide: Ghibli Dreamscape

**Goal:** To create a visually cohesive, deeply cozy, and professionally magical world that feels hand-painted, reflective, and spiritually gentle. The aesthetic must evoke the feeling of looking at a treasured watercolor painting or an animated film from Studio Ghibli.

**Core Philosophy (The Vibe):**
*   **Tone:** Calm, Reflective, Warm, Magical, Nostalgic.
*   **Avoid:** High contrast, harsh lines, overly saturated primary colors, mechanical perfection, and any sense of artificiality or 'gamey' flatness.
*   **Guiding Principle:** Everything should look like it was painted by hand with care.

---

## 🌈 I. Global Aesthetic Directives (The Filter)

These rules apply to *every single asset* and must be maintained across all art pieces.

1.  **Color Palette & Grading:**
    *   **Primary Tones:** Earth tones, muted greens (moss/sage), deep indigo blues (night sky), warm ochres, and soft amber/gold for light sources.
    *   **Rule:** Use a **Warm Sepia Grade**. The overall image should have a slight golden or sepia cast to unify the disparate assets.
    *   **Saturation:** Keep saturation moderate. Reserve high saturation only for *magical effects* (e.g., glowing flowers, illustrious items).

2.  **Lighting & Depth (The Most Critical Element):**
    *   **Directional Light Source:** Assume a single, dominant light source (Sun/Moon) at all times. All assets must cast soft, visible shadows that follow this direction.
    *   **Bloom Effect:** Implement a subtle **bloom** or *halation* effect on all light sources and magical elements. This simulates the way light scatters in the atmosphere, giving everything a gentle, ethereal glow.
    *   **Atmosphere:** Introduce subtle atmospheric haze (fog/mist) in low-lying areas to increase depth and soften edges.

---

## 🌳 II. Asset-Specific Guidelines

### A. Trees & Foliage (`assets/sprites/trees/`, `assets/sprites/flowers/`)
*   **Seasonal Cycle:** The visual state of foliage must change dramatically with the season (Spring, Summer, Autumn, Winter). This is a core mechanic.
    *   **Example:** In Autumn, leaves must transition to rich golds and burnt oranges; in Winter, they should be sparse and muted grey/white.
*   **Growth & Decay:** When decay occurs, the loss of foliage must look natural—not like an object being deleted, but like a branch naturally shedding its leaves.
*   **Flowers:** Must utilize **Bloom**. They should appear translucent, as if backlit by soft sunlight.

### B. Buildings & Landmarks (`assets/sprites/buildings/`, `assets/sprites/landmarks/`)
*   **Patina of Time:** Nothing is pristine. All structures must show signs of age: moss growth on stone, slight discoloration on wood, and structural imperfections that suggest history and care over time.
*   **Integration:** Buildings should feel *part* of the landscape, not placed upon it. Ivy, roots, and small plants should naturally creep up walls and around foundations.

### C. Animals (`assets/sprites/animals/`)
*   **Naturalism:** Animals must be integrated into their environment. They should interact with foliage (e.g., partially hidden by grass) rather than simply walking across empty tiles.
*   **Texture:** Use soft, painterly textures for fur and feathers to match the overall watercolor feel.

### D. Illustrious Items (`assets/sprites/illustrious/`)
*   **The Source of Light:** These items are *sources* of magic. Their glow must look *internal*. Instead of just adding a bright halo, the asset itself should appear to be generating light (e.g., glowing veins in a leaf, or an internal pulse).
*   **Animation Focus:** The animation should be subtle pulsing or gentle floating, never aggressive or jarring.

---

## 🛠️ III. Implementation Notes for Developers/Artists

1.  **File Format Preference:** PNG with transparency is required. For advanced effects (Bloom, Haze), consider using a format that supports layered effects if possible, though standard PNGs with careful gradient work should suffice initially.
2.  **Configuration Linkage:** All visual thresholds (e.g., `flowers.baseThreshold`, `trees.daysForNewTree`) must be respected by the art—the world's *feel* must match the game's *rules*.

***
*This guide serves as the single source of truth for all artistic assets.*