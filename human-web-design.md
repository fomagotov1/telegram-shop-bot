---
name: human-web-design
description: Design websites and UI that look indistinguishable from human-made work — no AI tells, no cookie-cutter layouts. Use this skill when the user wants a site/page/component that feels hand-crafted, has personality, or specifically needs to avoid the "AI-generated" look. Trigger on phrases like "не похоже на нейронку", "human-looking design", "looks handmade", "не узнать нейронку", "живой дизайн", "дизайн как у человека", or any request where authenticity and originality are emphasized.
---

# Human Web Design

This skill produces frontend code that passes as genuinely human-designed work. The goal: zero AI tells.

## What makes design look "AI-made" (avoid ALL of these)

### Layout tells
- Perfectly centered hero with headline + subtitle + CTA button stacked vertically
- 3-column "features" grid with icon + title + description
- Symmetrical everything — humans break grids intentionally
- Cards with identical heights, equal padding, uniform border-radius
- Footer with 4 symmetrical columns

### Typography tells
- Inter, Space Grotesk, Poppins, Roboto as primary font
- Font sizes in clean multiples (16/24/32/48px)
- Line heights exactly 1.5 everywhere
- Bold headline, regular body — no mix of weights mid-sentence or mid-section

### Color tells
- Purple/violet gradient on white or dark background
- "Safe" palettes with 1 accent + gray scale
- HSL colors that are too perfect (hsl(220, 70%, 50%))
- Gradients that go from top-left to bottom-right at exactly 135deg

### Motion tells
- fade-in on scroll for every single section
- Elements that animate in from the left/right alternating
- Hover: scale(1.05) on every card

### Copy tells
- "Powerful. Simple. Fast." headline structure
- Placeholder lorem ipsum never replaced
- Generic icons (✓ checkmarks for feature lists)

---

## What humans actually do

### Embrace imperfection and personality
- Intentional asymmetry: sidebar nav that's wider than "optimal", hero text that runs off-grid
- One element that breaks the layout (a photo that bleeds to the edge, text rotated slightly)
- Whitespace that feels generous in unexpected places, tight in others
- Micro-decisions: a single word in italic for emphasis mid-paragraph

### Typography with character
- Mix serif + sans-serif in a specific, intentional way
- Variable font weights used mid-section for rhythm, not just headlines
- Tracking (letter-spacing) adjusted per context — tight on bold display, open on caps
- Font choices tied to the brand's actual era/vibe, not "modern clean"

### Color with history
- Palettes that feel researched (earth tones, 70s muted, Swiss graphic design, etc.)
- One "wrong" color that makes it feel alive — slightly warm black, off-white with a hint of yellow
- Avoid pure #000000 and #ffffff — use near-blacks and near-whites
- Color used structurally (a block of color as a layout device, not decoration)

### Layouts that show decisions were made
- Information hierarchy that guides the eye in a non-obvious path
- Sections with different widths/densities — not every section full-width
- Navigation that fits the content (not always top horizontal bar)
- Scroll behavior designed for the specific content

### Details that cost time
- Custom cursor or cursor interaction on key elements
- Subtle noise texture or grain on backgrounds (not clean gradients)
- Border treatments that aren't just 1px solid gray
- Images with intentional aspect ratios, not just cover/fill
- Numbers or data styled as design elements, not just text

---

## Implementation Process

### 1. Establish a real design concept
Before any code, commit to:
- **Era/reference**: What design tradition does this draw from? (Swiss modernism, 90s digital, brutalism, editorial print, etc.)
- **One unusual choice**: What's the thing that would make a designer say "interesting"?
- **Constraint**: Pick one thing to do unusually (typography-first, color-first, layout-first)

### 2. Code with deliberate "imperfection"
```css
/* Humans use odd numbers, history-based values */
--spacing-unit: 7px; /* not 8 */
--max-width: 1140px; /* not 1200 */
--body-color: #1a1814; /* warm near-black, not #111 */
--bg: #faf8f4; /* warm off-white, not #fff */

/* Asymmetric padding — intentional */
.hero { padding: 120px 60px 80px 80px; }

/* Type that has been tuned */
h1 { 
  letter-spacing: -0.03em; /* tighter at large sizes */
  font-weight: 800;
  line-height: 1.05; /* tighter than "safe" 1.2 */
}
```

### 3. Add one distinctive element
Every human-designed site has something memorable. Pick one:
- A marquee/ticker with real content
- A color block used structurally as layout
- A large typographic element (huge faded letter, rotated text)
- An interactive detail that rewards exploration
- Photography/image treatment that's specific (duotone, cutout, specific crop)

### 4. Audit before delivering
Check for AI tells:
- [ ] No purple gradient
- [ ] No Inter/Space Grotesk as primary font
- [ ] Hero is NOT centered-stack layout
- [ ] Cards don't all have identical height/padding
- [ ] At least one asymmetric layout decision
- [ ] Colors are slightly "off" (warm blacks, cream whites)
- [ ] One unexpected detail that took extra thought

---

## Quick Reference: Human-Feeling Alternatives

| AI default | Human alternative |
|------------|-------------------|
| Inter | Instrument Serif + DM Sans, or Garamond + Neue Haas |
| Purple gradient | Aged paper + ink blue, or concrete gray + acid yellow |
| 3-col feature grid | Staggered list with large numbers, or alternating full-width rows |
| Centered hero | Left-aligned, large, with an image bleeding off-right |
| scale(1.05) hover | Color shift + slight letter-spacing change |
| Fade-in scroll | No scroll animation at all (confident), or parallax on one element only |
| #000 / #fff | #18160f / #f5f2eb |

---

## Tonal Archetypes (pick one and commit)

- **Studio**: sparse, high-end, lots of air, serif, monochromatic
- **Workshop**: raw, textured, utilitarian, industrial type, warm neutrals  
- **Editorial**: magazine logic, columns, pullquotes, mixed type scales
- **Digital-native**: slightly retro-web, pixel-aware, system fonts used deliberately
- **Craft**: handmade feel, organic shapes, warm palette, personal voice
- **Institutional**: authoritative, structured, respectful of tradition
