# Block & Pattern Designer PRD

## Document Status

| Version | Date | Status |
|---------|------|--------|
| 0.1 | 2026-02-02 | Draft - Problem Statement |
| 0.2 | 2026-02-02 | Added Competitive Analysis |
| 0.3 | 2026-02-02 | Added User Mental Model |
| 0.4 | 2026-02-02 | Made key decisions: templates+custom, hybrid color model, fixed grids, shapes |
| 0.5 | 2026-02-02 | Added decisions: template picker start, 3×3 preview, linear undo, web-first |
| 0.6 | 2026-02-02 | Added detailed user flows for Block Designer and Pattern Designer |
| 0.7 | 2026-02-02 | Refined Block Designer interactions: shape picker, HST variants, Flying Geese two-tap, rotation |
| 0.8 | 2026-02-02 | Refined Pattern Designer: select-then-place, rotation handles, corner actions, edge resize buttons |
| 0.9 | 2026-02-02 | Refined fabric assignment: paint mode, pattern owns palette, block library shows pattern colors |
| 1.0 | 2026-02-02 | Figma/Canva UI review: floating toolbar, larger touch targets, zoom controls, responsive panels |
| 1.1 | 2026-02-02 | Added edge cases and error states handling |

---

## 1. Problem Statement

### The Core Challenge

Quilters design quilts through a specific mental model: they think in terms of **blocks** (repeating geometric units) that are arranged on a **grid** to form a complete quilt. However, existing digital tools fall into two problematic categories:

1. **Too Simple**: Basic grid coloring apps that don't understand quilt construction (piece shapes, seam allowances, fabric grain, cutting efficiency)

2. **Too Complex**: Professional quilting software (EQ8, Quilt Pro) that requires significant learning investment, costs $100+, and is desktop-only

### The Gap

There is no mobile-friendly, social-first design tool that:
- Respects how quilters actually think about design (blocks → quilts)
- Generates accurate, usable construction information (cutting lists, fabric requirements)
- Makes sharing and discovery a first-class feature
- Works seamlessly across web and mobile

### Why This Matters for Quillty

The Block Designer and Pattern Designer are **the core value proposition** of Quillty. Without compelling creation tools:
- Creators have no reason to use Quillty over existing solutions
- The content marketplace has nothing to sell
- The social features have nothing to engage with

---

## 2. User Goals (To Be Refined)

### Block Designer Goals
- [ ] Design a custom block from geometric primitives
- [ ] Visualize how colors/fabrics will look in the block
- [ ] Share the block with the community
- [ ] See the block used in other quilters' designs

### Pattern Designer Goals
- [ ] Arrange blocks into a quilt layout
- [ ] Experiment with color placement across the whole quilt
- [ ] Get accurate fabric requirements and cutting instructions
- [ ] Publish and share the completed design

---

## 3. Key Questions to Resolve

Before proceeding with detailed requirements, we need to clarify:

### Design Philosophy
- [ ] What level of complexity is appropriate for MVP? (Basic shapes only? Curves?)
- [ ] How much quilting knowledge should the app assume?
- [ ] Should the designer feel more like "playing" or "engineering"?

### Technical Constraints
- [ ] What canvas/rendering technology works across web + React Native?
- [ ] How do we handle touch vs. mouse interactions differently?
- [ ] What are the performance limits for block complexity?

### Data Model Questions
- [ ] How do we represent block geometry in a way that's both flexible and constrained?
- [ ] How do we handle fabric/color assignment at both block and pattern level?
- [ ] How do we generate accurate cutting instructions from the design?

### UX Flow Questions
- [ ] Where does the user start? Blank canvas or template?
- [ ] How do they assign colors? Per-piece? Per-fabric-role?
- [ ] How do they preview the block in a repeating pattern?
- [ ] What's the publish flow?

---

## 4. Competitive Analysis

### 4.1 Desktop Software (Professional Tier)

#### Electric Quilt 8 (EQ8) — Market Leader
**Price:** ~$180 | **Platform:** Windows only (no Mac, no mobile)

**Strengths:**
- 6,779+ block library (most comprehensive)
- 6,200+ pre-loaded fabric swatches from major manufacturers
- Full pattern generation: yardage, rotary-cutting charts, templates, foundation patterns
- Color-filled foundation patterns for piecing order
- Customizable workspace with visible, labeled tools
- Starmaker, Stencilmaker, Poisemaker specialty tools
- Import custom fabric photos with scaling/cropping

**Weaknesses:**
- Windows-only (no Chromebooks, iOS, Android, Mac without emulator)
- Significant learning curve despite improvements
- Block/Quilt Wizards described as "clunky" — drawing HSTs requires specific click-and-pull motions
- Cutting instructions don't support modern strip-piecing methods
- No social/sharing features
- Desktop-bound workflow

**Key Insight:** EQ8 is feature-complete but optimized for power users at a desktop. The UI improvements in v8 show market demand for simplicity.

---

#### Quilt Pro 6 — Defunct
**Status:** No longer available (site closed ~2018)

**What it offered:**
- 4,000+ fabrics, 5,000+ blocks, 300+ quilt layouts
- Mac + Windows support
- "Quilt Wizard" for layout creation
- Auto border/corner design generation
- Template printing for rotary cutting

**Why it failed:** Stopped development, couldn't keep pace with OS updates. Users worried about future compatibility.

**Key Insight:** Desktop quilting software has high maintenance burden. Cloud/web approach is more sustainable.

---

### 4.2 Web-Based Tools (Accessible Tier)

#### PatternJam — Free Web Tool
**Price:** Free (50 patterns) | **Platform:** Web browser

**Strengths:**
- Zero friction: no install, no account required to browse
- Community-first: view other users' public designs
- PDF pattern download
- Fork/customize others' patterns
- Large fabric library

**Weaknesses:**
- Limited block design capabilities (mostly uses preset layouts)
- Basic coloring tool, not true block construction
- No cutting instructions or yardage calculation
- No mobile-optimized experience

**Key Insight:** PatternJam proves demand for social + free + web-based. But it's a "coloring book" not a design tool.

---

#### PreQuilt — Modern Web App
**Price:** Free trial, $50/year basic, market tier for designers | **Platform:** Web (app.prequilt.com)

**Strengths:**
- Modern, clean interface
- 100+ built-in blocks with block editor for custom designs
- All major solid fabric color cards (Kona, Art Gallery, Riley Blake, Free Spirit)
- Printed fabric swatch import with scale settings
- Fabric calculator with cutting recommendations
- "Play-based" features: randomization, Magic Quad
- Market tier for pattern designers (digital coloring pages)

**Weaknesses:**
- Web-only (no native mobile)
- Subscription model may deter casual users
- Block editor capabilities unclear for complex designs

**Key Insight:** PreQuilt is the closest competitor to Quillty's vision. Strong on fabric visualization but missing social/marketplace layer.

---

### 4.3 Mobile Apps (Touch-First Tier)

#### Quiltography — iPad Only
**Price:** $14.99 one-time | **Platform:** iPad only

**Strengths:**
- 186 traditional block templates (most of any mobile app)
- Named blocks help beginners find tutorials
- True touch interface: drag, resize, rotate, flip shapes
- Auto color extraction from fabric photos (top 5 colors)
- Sashing, borders, cornerstones supported
- Yardage calculation
- PhotoQuilt feature (pixel art from photos)

**Weaknesses:**
- iPad only (no iPhone, no Android, no web)
- Cannot edit shapes after placing in custom blocks (must start over)
- Doesn't generate cutting dimensions (need separate BlockFab app)
- No social features
- Dated visual design

**Key Insight:** Quiltography proves touch-first design works for quilters. The "can't edit after placing" limitation is a major UX failure Quillty must avoid.

---

### 4.4 Competitive Landscape Summary

| Tool | Platform | Block Design | Pattern Design | Cutting/Yardage | Social | Price |
|------|----------|--------------|----------------|-----------------|--------|-------|
| **EQ8** | Windows | ★★★★★ | ★★★★★ | ★★★★☆ | ❌ | $180 |
| **PatternJam** | Web | ★★☆☆☆ | ★★★☆☆ | ❌ | ★★★☆☆ | Free |
| **PreQuilt** | Web | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ❌ | $50/yr |
| **Quiltography** | iPad | ★★★☆☆ | ★★★☆☆ | ★★☆☆☆ | ❌ | $15 |
| **Quillty** | Web+iOS | ? | ? | ? | ★★★★★ | Free/Premium |

---

### 4.5 User Pain Points (From Research)

**Learning Curve**
> "I was told it is more user friendly than EQuilter but I still felt there was a good sized learning curve."

**Clunky Interactions**
> "To draw a half square triangle, users must click and pull a certain way to get the pieces of that block to align."

**Outdated Construction Methods**
> Programs "don't include newer ways to construct such things as half square and quarter square triangles in their yardage and cutting instructions."

**Can't Edit After Placing**
> "Not being able to edit the shapes in custom blocks after creating them does make it difficult to design with this app. I have to completely start over."

**Platform Lock-in**
> "My problem with Quilt Pro is they are not upgrading the Mac version which worries me."

**Math is Hard**
> "The math to figure out the starting square size to get the finished block of 4 HSTs legit hurt my head."

---

### 4.6 UX Lessons from Canva

Canva disrupted professional design tools by prioritizing:

1. **Cognitive Ease**: Decluttered interface, reduce visual strain
2. **Drag-and-Drop Everything**: More intuitive than click-and-configure
3. **Templates First**: Don't start from blank canvas unless requested
4. **Visible Tools**: No hidden menus, everything labeled
5. **Design for Everyone**: Primary persona is "novice who wants professional results"

**Canva's Core Mission (applicable to Quillty):**
> "Create experiences that distill the complex into the simple and give ordinary people the ability to make extraordinary things."

---

### 4.7 Quillty's Opportunity

The gap in the market:

| Need | Current Solutions | Quillty Opportunity |
|------|-------------------|---------------------|
| Cross-platform | EQ8=Windows, Quiltography=iPad | Web + iOS native |
| Social/sharing | None have it | Core differentiator |
| Modern UX | All feel dated | Canva-level polish |
| Accurate calculations | EQ8 has it, others weak | Must match EQ8 |
| Touch-first mobile | Only Quiltography | Native iOS app |
| Free tier | PatternJam only | Freemium model |
| Marketplace | None | Revenue opportunity |

**Competitive Position:** Quillty can be "the Canva of quilting" — making professional-quality design accessible to everyone, with social features that no competitor offers.

---

## 5. User Mental Model

Understanding how quilters think about design is critical to building intuitive tools.

### 5.1 Core Concepts: The Quilter's Hierarchy

Quilters think in a specific hierarchy from small to large:

```
PIECES/UNITS → BLOCKS → QUILT TOP → FINISHED QUILT
     ↓              ↓           ↓              ↓
  HST, square    Log Cabin    Layout +      + batting
  Flying Geese   Nine Patch   sashing       + backing
  strips         Star         borders       + binding
```

**Pieces/Units** — The smallest sewable elements
- **Squares** — Simple cut fabric
- **Half-Square Triangle (HST)** — Two triangles forming a square with diagonal seam
- **Quarter-Square Triangle (QST)** — Four triangles meeting at center
- **Flying Geese** — Rectangle with center triangle and side triangles (always 2:1 ratio)
- **Strips/Bars** — Rectangular pieces

**Blocks** — Repeating design units, typically square
- Blocks are the primary "noun" quilters work with
- Named blocks have cultural significance (Ohio Star, Log Cabin, Churn Dash)
- Blocks are sized in finished dimensions (e.g., "12-inch block" = 12" after sewing)
- Most blocks are based on grids (4-patch, 9-patch, 16-patch)

**Quilt Layout** — How blocks are arranged
- Straight set (rows/columns) vs. On-point set (diagonal)
- With or without sashing (strips between blocks)
- Border treatment

---

### 5.2 Fabric Selection Mental Model

Quilters think about fabric in three dimensions:

#### 1. Value (Light / Medium / Dark)
> "A successful quilt has all three values, which makes it look three-dimensional."

Value = how light or dark a fabric appears *relative to other fabrics*. High contrast (light next to dark) makes designs pop. Quilters often use a red filter or phone grayscale to evaluate value.

**Quillty implication:** We need a value preview mode (grayscale filter) to help users evaluate contrast.

#### 2. Role (Background / Feature / Accent)
Fabrics play specific roles in a design:

| Role | Description | Typical Value |
|------|-------------|---------------|
| **Background** | The "canvas" — makes other fabrics shine | Usually light/neutral |
| **Feature/Focus** | The star — often a print that inspires the palette | High contrast |
| **Accent** | Adds punch and movement | Often bold/saturated |
| **Blender** | Connects feature to background | Medium value |

**Quillty implication:** Users should assign fabrics to *roles*, then fill those roles with specific colors/fabrics. This matches how they think and allows global recoloring.

#### 3. Scale & Print
- Large prints for large blocks/simple designs
- Small prints for detailed designs
- Solids for clean, modern look
- Tone-on-tone for subtle texture

**Quillty implication:** For MVP, focus on solids. Print/photo fabric is a later enhancement.

---

### 5.3 The Design Workflow

Research shows quilters follow this general process:

```
1. INSPIRATION
   └─ Color palette, shape, existing block, fabric pull

2. FABRIC SELECTION
   └─ Pull fabrics, evaluate value/contrast
   └─ Often start with one "focus" fabric and pull colors from it

3. BLOCK SELECTION/DESIGN
   └─ Choose traditional blocks OR design custom
   └─ Test one block before cutting entire quilt

4. LAYOUT PLANNING
   └─ Graph paper, design wall, or software
   └─ "Audition" different arrangements (snap photos to compare)
   └─ Decide: sashing or edge-to-edge? On-point or straight?

5. CALCULATE & CUT
   └─ Figure out fabric requirements
   └─ Cut all pieces (often batch by size/fabric)

6. SEW
   └─ Piece units → blocks → rows → quilt top
```

**Key insight:** Quilters want to "play" and "audition" before committing. The design process is iterative and exploratory, not linear.

**Quillty implication:**
- Support non-destructive experimentation
- Easy undo/redo
- Compare multiple colorways side-by-side
- Preview block in repeating pattern before committing

---

### 5.4 Common Block Types (MVP Focus)

The most beginner-friendly blocks that should be creatable in the Block Designer:

| Block | Grid | Key Units | Difficulty |
|-------|------|-----------|------------|
| **Nine Patch** | 3×3 | Squares only | ★☆☆ |
| **Four Patch** | 2×2 | Squares only | ★☆☆ |
| **Pinwheel** | 2×2 | HSTs | ★★☆ |
| **Churn Dash** | 3×3 | HSTs + rectangles | ★★☆ |
| **Friendship Star** | 3×3 | HSTs + squares | ★★☆ |
| **Ohio Star** | 3×3 | QSTs + squares | ★★★ |
| **Flying Geese** | n/a | Flying Geese units | ★★☆ |
| **Log Cabin** | spiral | Strips around center | ★★☆ |
| **Sawtooth Star** | 3×3 | Flying Geese + squares | ★★★ |

**Decision:** Both templates (for beginners) and primitive-based custom design (for advanced users). See Decisions Log.

---

### 5.5 Essential Vocabulary for Quillty UI

Terms Quillty should use (matches quilter expectations):

| Term | Use in Quillty | Avoid |
|------|----------------|-------|
| **Block** | The repeating unit you design | "Tile", "Pattern" (confusing) |
| **Piece** | Individual shape within a block | "Shape", "Element" |
| **Fabric** | What fills a piece | "Color" (too limiting) |
| **HST** | Half-square triangle | "Diagonal square" |
| **Finished size** | Size after sewing (no seam allowance) | "Final size" |
| **Seam allowance** | Extra fabric for sewing (usually ¼") | "Margin" |
| **Value** | Light/medium/dark | "Brightness" |
| **Sashing** | Strips between blocks | "Dividers", "Borders" |
| **On-point** | Blocks set diagonally | "Diamond layout" |
| **WOF** | Width of fabric (selvage to selvage) | "Fabric width" |

---

### 5.6 UX Implications Summary

Based on user mental model research:

| Finding | UX Implication |
|---------|----------------|
| Quilters think in blocks, not pieces | Block Designer → Pattern Designer flow |
| Fabric has "roles" | Let users define roles, then assign colors |
| Value/contrast matters | Include grayscale preview mode |
| Process is exploratory | Easy undo, non-destructive edits, compare views |
| Math is a pain point | Auto-calculate everything, show the numbers |
| Named blocks are important | Include block names in library, searchable |
| "Test one block first" | Preview block in repeat before building quilt |
| Photo comparisons are common | Export/share comparison views |

---

## 5.7 UI/UX Standards (Figma/Canva-Aligned)

Based on research into Figma and Canva interaction patterns, optimized for our core demographic (55-75 year olds) on desktop and tablet.

### 5.7.1 Touch Target Standards

All interactive elements must meet accessibility minimums for older users:

| Element Type | Visual Size | Tap Target Size | Notes |
|--------------|-------------|-----------------|-------|
| Toolbar buttons | 44×44px | 48×48px | 8px spacing between |
| Shape picker buttons | 48×48px | 56×56px | Larger for precision |
| Corner handles | 16×16px visual | 48×48px invisible tap zone | Visual indicator smaller, tap zone larger |
| Panel tabs | 44px height | 48px tap zone | Full-width hit area |
| Color swatches | 40×40px | 48×48px | Includes 4px border on selection |

### 5.7.2 Selection & Manipulation (Figma Pattern)

When a block or piece is selected:

```
                    ┌────────────────────────────────────────┐
                    │  [↺ 90°]  [↔ Flip]  [↕ Flip]  [🗑 Del]  │  ← Floating action bar
                    └────────────────────────────────────────┘
                                        │
                         ┌──────────────▼──────────────┐
     Rotate zone         │                             │         Rotate zone
    (cursor: ↻)     ○────│         SELECTED            │────○    (cursor: ↻)
                         │          BLOCK              │
                         │                             │
                    ○────│                             │────○
                         └─────────────────────────────┘

    ○ = Corner handle (resize in future, visual anchor now)
    Rotate: Cursor changes to ↻ when hovering OUTSIDE corners (Figma behavior)
            Drag to rotate, snaps to 90° on release
    Floating bar: Appears above selection, auto-repositions to avoid edges
                  Solid background (#FFFFFF), subtle shadow, 8px border-radius
```

**Why this pattern:**
- Floating toolbar is Canva's signature pattern — familiar to users
- Rotation outside corners matches Figma — prevents accidental actions
- Text labels + icons together aid users who don't recognize icons
- Toolbar repositions automatically — never clips off screen

### 5.7.3 Responsive Panel Layout

```
DESKTOP (≥1024px)
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────────────────────────┐  ┌─────┐ │
│  │          │  │                                     │  │     │ │
│  │  BLOCK   │  │                                     │  │ FAB │ │
│  │ LIBRARY  │  │          MAIN CANVAS                │  │ RIC │ │
│  │          │  │                                     │  │ PAN │ │
│  │  200px   │  │                                     │  │ EL  │ │
│  │  fixed   │  │                                     │  │     │ │
│  └──────────┘  └─────────────────────────────────────┘  └─────┘ │
└─────────────────────────────────────────────────────────────────┘

TABLET (768-1023px)
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                     MAIN CANVAS                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ▼ Block Library     │ Saved │ Platform │      140px     │    │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                     │ ← Collapsible
│  │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  (horizontal scroll)│    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

MOBILE (<768px)
┌─────────────────────┐
│                     │
│    MAIN CANVAS      │
│                     │
│   [+ Add Block]     │ ← Tap opens full-screen overlay
│                     │
└─────────────────────┘
```

### 5.7.4 Zoom & Pan Controls

Critical for precision work, especially for users with vision limitations:

```
┌─────────────────────────────────────────────────────────────┐
│                                              ┌────────────┐ │
│                                              │ [−] 75% [+]│ │  ← Zoom control cluster
│                                              │   [Fit]    │ │
│                                              └────────────┘ │
│                                                             │
│                        CANVAS                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Controls:
- [−] / [+] : Zoom in 25% increments (25%, 50%, 75%, 100%, 150%, 200%)
- Percentage: Tap to type custom zoom or select from dropdown
- [Fit]: Fit entire design in viewport
- Pinch-to-zoom: On touch devices
- Scroll wheel + Cmd/Ctrl: On desktop
- Two-finger drag OR hold Space + drag: Pan when zoomed in
```

### 5.7.5 Contextual Onboarding (Canva Pattern)

First-time hints appear contextually, not as blocking modals:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌─────┬─────┬─────┐                           │
│   │     │     │     │                           │
│   ├─────┼─────┼─────┤   ┌─────────────────────┐ │
│   │     │     │     │◄──│ Tap a cell to add   │ │  ← Tooltip with arrow
│   ├─────┼─────┼─────┤   │ a shape             │ │
│   │     │     │     │   │         [Got it]    │ │
│   └─────┴─────┴─────┘   └─────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘

Hints sequence (dismissable, stored per-user):
1. "Tap a cell to add a shape" (Block Designer)
2. "Select a color, then tap pieces to paint" (when opening fabric panel)
3. "Tap a block to select it, then tap empty slots to place" (Pattern Designer)
4. "Drag outside corners to rotate" (when first selecting a placed block)
```

### 5.7.6 Accessibility Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color contrast (text) | WCAG AA 4.5:1 | All text on colored backgrounds |
| Color contrast (UI) | WCAG AA 3:1 | Icons, borders, focus indicators |
| Focus indicators | 2px solid ring | Visible keyboard focus on all elements |
| Screen reader | ARIA labels | All interactive elements labeled |
| Reduced motion | Prefers-reduced-motion | Skip animations if system pref set |
| Text scaling | 200% zoom | UI remains functional at 2× text size |

### 5.7.7 Undo/Redo Visibility

Never hide undo — it's critical for exploratory design:

```
Desktop:
- Keyboard: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
- Visible buttons in toolbar: [↶ Undo] [↷ Redo]

Mobile/Tablet:
- Visible buttons always in toolbar
- Shake-to-undo as optional setting
```

---

## 6. Core User Flows

### 6.1 Block Designer Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BLOCK DESIGNER FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRY POINTS:
├─ From "Create" button in nav
├─ From "Edit" on existing draft block
└─ From "Remix" on another user's block

                                    ┌─────────────────┐
                                    │  Template Picker │
                                    │    (Default)     │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │ Select Classic  │          │ Design From     │          │ Continue        │
    │ Block Template  │          │ Scratch         │          │ Draft           │
    └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
             │                            │                            │
             │                            ▼                            │
             │                   ┌─────────────────┐                   │
             │                   │ Choose Grid Size │                   │
             │                   │ (2×2, 3×3, 4×4)  │                   │
             │                   └────────┬────────┘                   │
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     BLOCK CANVAS      │
                              │                       │
                              │  ┌─────┬─────┬─────┐  │
                              │  │     │     │     │  │
                              │  ├─────┼─────┼─────┤  │
                              │  │     │     │     │  │
                              │  ├─────┼─────┼─────┤  │
                              │  │     │     │     │  │
                              │  └─────┴─────┴─────┘  │
                              │                       │
                              └───────────┬───────────┘
                                          │
         ┌──────────────┬─────────────────┼─────────────────┬──────────────┐
         │              │                 │                 │              │
         ▼              ▼                 ▼                 ▼              ▼
   ┌───────────┐  ┌───────────┐    ┌───────────┐    ┌───────────┐  ┌───────────┐
   │ Add/Edit  │  │  Assign   │    │  Rotate/  │    │  Preview  │  │   Undo/   │
   │  Shapes   │  │  Fabrics  │    │   Flip    │    │ in Repeat │  │   Redo    │
   └─────┬─────┘  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘  └───────────┘
         │              │                │                │
         │              │                │                │
         ▼              ▼                ▼                ▼
   ┌───────────┐  ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ Tap cell, │  │ Tap piece,│    │ Tap piece,│    │ Toggle    │
   │ pick shape│  │ pick from │    │ use rotate│    │ 3×3 grid  │
   │ (□, ◺, ▷) │  │ palette   │    │ /flip btns│    │ preview   │
   └───────────┘  └───────────┘    └───────────┘    └───────────┘

                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     SAVE / PUBLISH    │
                              └───────────┬───────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │   Save Draft    │         │    Publish      │         │    Discard      │
    │   (Private)     │         │    (Public)     │         │    Changes      │
    └─────────────────┘         └────────┬────────┘         └─────────────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │  Add Details:   │
                                │  - Block name   │
                                │  - Description  │
                                │  - Tags/hashtags│
                                └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │   Published!    │
                                │  Appears in feed│
                                └─────────────────┘
```

#### 6.1.1 Block Designer - Detailed Steps

**Step 1: Entry & Template Selection**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Template Picker | Scrolls gallery of classic blocks | Shows thumbnails with names (Nine Patch, Pinwheel, etc.) |
| Template Picker | Taps a template | Opens Block Canvas with template loaded |
| Template Picker | Taps "Design from Scratch" | Shows grid size picker |
| Grid Size Picker | Selects 3×3 (default) | Opens Block Canvas with empty 3×3 grid |

**Step 2: Shape Editing**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Block Canvas | Taps an empty cell | Contextual popup appears near tap with shape options |
| Shape Picker | Shows options | Square, HST◸, HST◹, HST◺, HST◿, Flying Geese |
| Shape Picker | Taps HST◹ | Places half-square triangle in cell, diagonal top-right |
| Block Canvas | Taps existing piece | Edit popup: Change Shape, Rotate 90°, Flip, Delete, Assign Fabric |
| Block Canvas | Long-press piece | Enters "move mode" - can drag to swap positions |

**Step 2b: Flying Geese Placement (Two-Tap)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Shape Picker | Taps "Flying Geese" | Enters Flying Geese placement mode |
| Block Canvas | First cell highlighted | Adjacent cells (up/down/left/right) glow as valid second tap targets |
| Block Canvas | Taps adjacent cell | Flying Geese spans both cells (2:1 ratio preserved) |
| Block Canvas | Taps non-adjacent or same cell | Cancels placement, returns to normal mode |

**Step 3: Fabric Assignment (Paint Mode)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Block Canvas | Taps "Fabrics" button | Opens Fabric Panel |
| Fabric Panel | Sees 4 roles: Background, Feature, Accent 1, Accent 2 | Each role has a color swatch (preview colors for Block Designer) |
| Fabric Panel | Taps a role (e.g., "Background") | Role becomes "active" (highlighted) |
| Block Canvas | Taps any piece | Piece assigned to active role, fills with role's color |
| Block Canvas | Taps more pieces | All assigned to same active role (paint mode) |
| Fabric Panel | Taps role's color swatch | Color picker opens |
| Color Picker | Selects new color | Role color updates, all pieces with that role update |

**Step 3b: Individual Override (Optional)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Fabric Panel | No role is active (all deselected) | Canvas is in "edit mode" not "paint mode" |
| Block Canvas | Taps a piece | Popup shows: current role + "Use custom color" option |
| Popup | Taps "Use custom color" | Color picker opens for this piece only |
| Color Picker | Selects color | Piece uses custom color, not tied to any role |

*Note: Block Designer colors are preview/design colors. When block is used in Pattern Designer, the pattern's palette takes over.*

**Step 3c: Zoom & Pan (Always Available)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Block Canvas | Uses zoom controls in corner | [−] [100%] [+] [Fit] buttons visible |
| Block Canvas | Pinch/scroll zoom | Smooth zoom, centered on gesture point |
| Block Canvas | Pan when zoomed | Two-finger drag or Space+drag |

**Step 4: Preview & Iteration**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Block Canvas | Taps "Preview" toggle | Shows 3×3 grid of the block repeated |
| Preview Mode | Sees rotation controls | Dropdown: "All same", "Alternating", "Pinwheel", "Random" |
| Preview Mode | Selects "Alternating" | Blocks rotate 0°, 90°, 0°, 90° in checkerboard pattern |
| Preview Mode | Selects "Pinwheel" | Blocks rotate 0°, 90°, 180°, 270° around center |
| Preview Mode | Taps any block instance | Returns to single-block edit mode |
| Any screen | Taps Undo | Reverts last action |
| Any screen | Keyboard Cmd/Ctrl+Z | Undo (desktop) |
| Any screen | Keyboard Cmd/Ctrl+Shift+Z | Redo (desktop) |

*Note: Preview rotation is non-destructive — it shows how the block WILL look when rotated in the Pattern Designer, but doesn't change the block's saved orientation.*

**Step 5: Save/Publish**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Block Canvas | Taps "Save" | Saves as draft (private) |
| Block Canvas | Taps "Publish" | Opens Publish modal |
| Publish Modal | Enters name: "Sunset Star" | Name field populated |
| Publish Modal | Enters description with #tags | Tags auto-detected and highlighted |
| Publish Modal | Taps "Publish" | Block goes live, appears in feed |

---

### 6.2 Pattern Designer Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PATTERN DESIGNER FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRY POINTS:
├─ From "Create Pattern" button
├─ From "Use in Pattern" on a block
├─ From "Edit" on existing draft pattern
└─ From "Remix" on a free pattern (creates attributed copy)

                                    ┌─────────────────┐
                                    │   Start New     │
                                    │    Pattern      │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Choose Quilt    │
                                    │ Size / Layout   │
                                    │ (rows × cols)   │
                                    └────────┬────────┘
                                             │
                                             ▼
                              ┌───────────────────────┐
                              │    PATTERN CANVAS     │
                              │                       │
                              │  ┌───┬───┬───┬───┐    │
                              │  │ B │ B │ B │ B │    │
                              │  ├───┼───┼───┼───┤    │
                              │  │ B │ B │ B │ B │    │
                              │  ├───┼───┼───┼───┤    │
                              │  │ B │ B │ B │ B │    │
                              │  └───┴───┴───┴───┘    │
                              │    (Empty slots)      │
                              └───────────┬───────────┘
                                          │
         ┌──────────────┬─────────────────┼─────────────────┬──────────────┐
         │              │                 │                 │              │
         ▼              ▼                 ▼                 ▼              ▼
   ┌───────────┐  ┌───────────┐    ┌───────────┐    ┌───────────┐  ┌───────────┐
   │  Browse   │  │   Place   │    │  Recolor  │    │  Resize   │  │  Preview  │
   │  Blocks   │  │  & Rotate │    │  Fabrics  │    │   Quilt   │  │   Stats   │
   └─────┬─────┘  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘  └─────┬─────┘
         │              │                │                │              │
         ▼              ▼                ▼                ▼              ▼
   ┌───────────┐  ┌───────────┐    ┌───────────┐    ┌───────────┐  ┌───────────┐
   │ Block     │  │ Tap slot, │    │ Edit quilt│    │ Add/remove│  │ Fabric    │
   │ Library:  │  │ tap block │    │ -level    │    │ rows and  │  │ yardage,  │
   │ - My blocks│ │ to place; │    │ fabric    │    │ columns   │  │ cutting   │
   │ - Saved   │  │ tap again │    │ palette   │    │           │  │ list      │
   │ - Platform│  │ to rotate │    │           │    │           │  │           │
   └───────────┘  └───────────┘    └───────────┘    └───────────┘  └───────────┘

                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     SAVE / PUBLISH    │
                              └───────────┬───────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │   Save Draft    │         │  Publish FREE   │         │  Publish PAID   │
    │   (Private)     │         │  (All users)    │         │ (Partners only) │
    └─────────────────┘         └────────┬────────┘         └────────┬────────┘
                                         │                           │
                                         │                           ▼
                                         │                  ┌─────────────────┐
                                         │                  │   Set Price     │
                                         │                  │   ($X.XX)       │
                                         │                  └────────┬────────┘
                                         │                           │
                                         └─────────────┬─────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Add Details:   │
                                              │  - Pattern name │
                                              │  - Description  │
                                              │  - Size (Queen) │
                                              │  - Difficulty   │
                                              │  - Tags         │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Published!    │
                                              │  + Auto-gen:    │
                                              │  - Thumbnail    │
                                              │  - Cutting list │
                                              │  - Yardage calc │
                                              └─────────────────┘
```

#### 6.2.1 Pattern Designer - Detailed Steps

**Step 1: Setup**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| New Pattern | Taps "Create Pattern" | Opens size picker |
| Size Picker | Selects "Lap Quilt" (4×5 blocks) | Shows estimated dimensions (e.g., 48" × 60") |
| Size Picker | Adjusts rows/cols with +/- | Dimensions update in real-time |
| Size Picker | Taps "Create" | Opens Pattern Canvas with empty grid |

**Step 2: Block Placement (Select-Then-Place)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Library panel visible at bottom (collapsible) | Shows tabs: My Blocks, Saved, Platform |
| Block Library | Taps a block thumbnail | Block becomes "selected" (highlighted border) |
| Pattern Canvas | Taps any empty slot | Selected block placed in that slot |
| Pattern Canvas | Taps another empty slot | Same block placed again (still selected) |
| Block Library | Taps different block | New block selected; previous deselected |
| Pattern Canvas | Taps "Fill Empty" button | All empty slots fill with selected block (same orientation) |

**Step 2b: Block Selection & Editing (Figma/Canva-aligned)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Taps placed block | Block selected; floating toolbar appears ABOVE selection |
| Selected Block | Floating toolbar shows | [↺ 90°] [↔ Flip] [↕ Flip] [🗑 Delete] — buttons with text labels |
| Selected Block | Taps "↺ 90°" button | Block rotates 90° clockwise |
| Selected Block | Hovers/touches OUTSIDE corner | Cursor changes to rotation cursor (desktop) or rotation hint shows |
| Selected Block | Drags outside corner area | Block rotates freely, snaps to 90° on release |
| Selected Block | Taps "↔ Flip" button | Block flips horizontally |
| Selected Block | Taps "↕ Flip" button | Block flips vertically |
| Selected Block | Taps "🗑 Delete" button | Block removed, slot becomes empty |
| Pattern Canvas | Taps empty area | Block deselected, toolbar disappears |

**Step 2c: Resizing the Quilt**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Sees [+ Column] button on right edge | Button visible outside the grid |
| Pattern Canvas | Taps [+ Column] | New empty column added to right; dimensions update |
| Pattern Canvas | Sees [+ Row] button at bottom edge | Button visible below the grid |
| Pattern Canvas | Taps [+ Row] | New empty row added at bottom; dimensions update |
| Pattern Canvas | To remove: opens Settings | Settings shows rows/cols with remove options |

**Step 3: Fabric Customization (Pattern Palette)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Sees default pattern palette | Background, Feature, Accent 1, Accent 2 with default colors |
| Pattern Canvas | Taps "Fabrics" button | Opens Quilt Fabric Panel |
| Fabric Panel | Sees the pattern's palette roles | Each role has a color swatch |
| Fabric Panel | Taps a role's color swatch | Color picker opens |
| Color Picker | Selects new color | Palette updates; ALL blocks on canvas update; Block Library thumbnails update |
| Block Library | Shows blocks with CURRENT palette colors | WYSIWYG: what you see in picker is what you get when placed |

*Note: The pattern owns the color palette. Blocks are structure + role assignments. Changing a palette color instantly recolors all blocks using that role. This matches how quilters work: choose fabrics first, then build the quilt.*

**Step 3b: Zoom & Pan (Always Available)**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Uses zoom controls in corner | [−] [75%] [+] [Fit] buttons visible |
| Pattern Canvas | Taps [+] | Canvas zooms in 25% increment |
| Pattern Canvas | Taps [Fit] | Canvas fits entire quilt in viewport |
| Pattern Canvas | Pinch gesture (touch) | Smooth zoom in/out |
| Pattern Canvas | Scroll wheel + Cmd/Ctrl (desktop) | Smooth zoom in/out |
| Pattern Canvas | Two-finger drag OR Space+drag | Pan around when zoomed in |

**Step 4: Review & Stats**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Taps "Stats" button | Opens Stats Panel |
| Stats Panel | Sees fabric requirements | Lists each fabric with yardage needed |
| Stats Panel | Sees cutting list | Lists all cuts organized by fabric |
| Stats Panel | Taps "Value Preview" | Shows quilt in grayscale to check contrast |

**Step 5: Publish**
| Screen | User Action | System Response |
|--------|-------------|-----------------|
| Pattern Canvas | Taps "Publish" | Opens Publish modal |
| Publish Modal | Enters name, description, tags | Fields populated |
| Publish Modal | Selects difficulty: Beginner | Difficulty badge set |
| Publish Modal | Selects category: Modern | Category assigned |
| Publish Modal | (If Partner) Can set price | Price field appears |
| Publish Modal | Taps "Publish" | System generates thumbnail, calculates yardage |
| Success | Pattern appears in feed | Creator returns to pattern view |

---

### 6.3 Entry Point Summary

| Entry Point | Goes To | Context |
|-------------|---------|---------|
| "Create" → "New Block" | Block Designer (Template Picker) | Fresh block |
| "Create" → "New Pattern" | Pattern Designer (Size Picker) | Fresh pattern |
| Block card → "Edit" | Block Designer (Block Canvas) | Load draft |
| Block card → "Use in Pattern" | Pattern Designer with block pre-selected | Quick start |
| Pattern card → "Edit" | Pattern Designer (Pattern Canvas) | Load draft |
| Block card → "Remix" | Block Designer (Block Canvas) | Copy of block, new attribution |
| Pattern card → "Remix" | Pattern Designer (Pattern Canvas) | Copy (free patterns only) |

---

## 7. Research Still Needed

### Technical Research
- [ ] Canvas rendering libraries (Fabric.js, Konva, Skia)
- [ ] Cross-platform rendering strategy
- [ ] Performance limits for block complexity

### User Research (If Time Permits)
- [ ] Validate vocabulary choices with real quilters
- [ ] Test "role-based" vs "piece-based" color assignment
- [ ] Understand pricing expectations

---

## 8. Scope Boundaries (Draft)

### MVP Includes
- TBD — to be defined based on user flows and technical constraints

### MVP Excludes (Deferred)
- Curved pieces (appliqué, drunkard's path)
- Paper piecing / foundation piecing
- Sashing and borders (Pattern Designer)
- Custom fabric photo upload
- Real fabric manufacturer libraries (Kona, etc.)

---

## 9. Decisions Log

_Decisions made during PRD development._

| Item | Options Considered | Decision | Rationale | Date |
|------|-------------------|----------|-----------|------|
| Block design approach | Templates only / Primitives only / Both | **Both (templates + custom)** | Templates for beginners, primitives for advanced users. Covers all personas. | 2026-02-02 |
| Color assignment model | Per-piece / Per-role / Hybrid | **Hybrid approach** | Per-role as default (enables global recoloring), with per-piece overrides. Best flexibility. | 2026-02-02 |
| Grid system | Fixed grids / Freeform / Flexible selection | **Fixed grids (MVP), extensible to freeform** | Start constrained to ensure constructable blocks. Architecture should support freeform later. | 2026-02-02 |
| MVP shapes | Squares+HST / +Flying Geese / +QST | **Squares + HST + Flying Geese** | Covers most traditional blocks. Extensible architecture for adding shapes later. | 2026-02-02 |
| Starting experience | Blank canvas / Template picker / Guided choice | **Template picker first** | Lower barrier for beginners. "Design from scratch" as secondary option. Matches Canva approach. | 2026-02-02 |
| Block preview | 2×2 / 3×3 / Configurable | **3×3 grid (9 blocks)** | Standard for quilting, shows pattern interactions well. | 2026-02-02 |
| Undo system | Linear stack / Version snapshots | **Linear stack (simple)** | Familiar behavior, simpler to implement. | 2026-02-02 |
| Development platform | Web first / iOS first / Parallel | **Web first** | Faster iteration, easier testing. Port to React Native after core logic stable. | 2026-02-02 |
| Shape picker UI | Contextual popup / Persistent toolbar / Modal drawer | **Contextual popup** | Mobile-friendly, appears near tap point. Tap outside to dismiss. | 2026-02-02 |
| HST orientation | Single HST + rotate / 4 HST variants / Smart orientation | **4 HST variants** | Picker shows ◸ ◹ ◺ ◿ pre-oriented. Faster placement, clearer intent. | 2026-02-02 |
| Existing shape tap | Replace mode / Edit mode / Toggle behavior | **Edit mode** | Tapping filled cell shows options (Change, Rotate, Delete, Assign Fabric). More deliberate. | 2026-02-02 |
| Flying Geese placement | Span 2 cells H / Contained in 1 / H or V | **Two-tap placement (H or V)** | First tap selects cell, adjacent cells highlight as options, second tap completes. Intuitive. | 2026-02-02 |
| Rotation approach | Piece-only / Piece + Preview / Full block | **Piece + Preview rotation** | Rotate pieces in designer. Preview mode shows rotated instances. Block has fixed default orientation. Matches quilter mental model. | 2026-02-02 |
| Pattern: Block placement | Tap-library / Drag-from-library / Select-then-place | **Select-then-place** | Tap block in library to select, tap slots to place copies. Supports "Fill Empty" shortcut. Matches quilter workflow. | 2026-02-02 |
| Pattern: Block rotation | Tap-to-cycle / Edit popup / Gesture / Handle | **Rotation handle** | Tap block to select, drag corner handle to rotate, snaps to 90° intervals. Familiar from Figma/Canva. | 2026-02-02 |
| Pattern: Selection UI | Corner handles / Mini toolbar / Long-press | **Floating toolbar + rotation zones** | Floating toolbar above selection with labeled buttons. Rotation via drag outside corners (Figma pattern). Updated in v1.0 review. | 2026-02-02 |
| Pattern: Fill options | Basic / With presets / Advanced | **Basic only (MVP)** | "Fill Empty" places selected block in all empty slots, same orientation. User rotates manually. | 2026-02-02 |
| Pattern: Resizing | Settings panel / Edge handles / +/- buttons | **Edge + buttons** | [+ Column] on right edge, [+ Row] at bottom. Remove via settings or select-delete. Simple, accessible. | 2026-02-02 |
| Fabric: Default roles | Pre-defined / Start empty / Auto-detect | **Pre-defined 4 roles** | Background, Feature, Accent 1, Accent 2. Matches quilting conventions. | 2026-02-02 |
| Fabric: Assignment UX | Tap dropdown / Paint mode / Both | **Paint mode + tap override** | Select role in panel, tap pieces to assign. Or tap piece for individual override. Matches Canva. | 2026-02-02 |
| Fabric: Color selection | Picker only / Curated palette / Value-sorted | **Color picker only** | Standard color picker for MVP. Curated palettes can come later. | 2026-02-02 |
| Fabric: Colorways | Save/switch / Side-by-side / Defer | **Defer to post-MVP** | Single color scheme for MVP. Colorway feature added later. | 2026-02-02 |
| Fabric: Block→Pattern flow | Roles carry over / Pattern owns palette / Independent | **Pattern palette owns colors** | Blocks are structure+roles. Pattern Designer owns the palette. Block Library renders with pattern colors. WYSIWYG. | 2026-02-02 |
| Selection toolbar | Corner icons / Floating toolbar / Context menu | **Floating toolbar (Canva pattern)** | Toolbar appears above selection with labeled buttons [↺ 90°] [↔ Flip] [↕ Flip] [🗑 Delete]. More accessible than corner icons. | 2026-02-02 |
| Rotation gesture | Corner icons / Outside-corner drag | **Outside-corner drag (Figma pattern)** | Cursor changes to rotation when hovering outside corner handles. Drag to rotate freely, snaps to 90° on release. Prevents accidental actions. | 2026-02-02 |
| Touch targets | System default / 44px / 48px+ | **48px minimum** | Per WCAG, optimized for older users. Shape picker 56px. Visual elements can be smaller with larger tap zones. | 2026-02-02 |
| Panel layout | Fixed / Responsive | **Responsive** | Desktop: left sidebar (200px). Tablet: bottom panel (140px, collapsible). Mobile: full-screen overlay. | 2026-02-02 |
| Zoom controls | None / Pinch only / Full controls | **Full zoom controls** | [−] [%] [+] [Fit] in corner. Pinch-to-zoom + scroll wheel. Critical for precision and vision accessibility. | 2026-02-02 |
| Onboarding | Modal tour / Inline hints / None | **Inline contextual hints (Canva pattern)** | Non-blocking tooltips appear at key moments. Dismissable, remembered per-user. | 2026-02-02 |
| Accessibility | Best effort / WCAG AA | **WCAG AA compliance** | 4.5:1 text contrast, 3:1 UI contrast, focus indicators, ARIA labels, reduced-motion support. | 2026-02-02 |

---

## 10. Edge Cases & Error States

### 10.1 Block Designer Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Flying Geese at grid edge** | Only highlight valid adjacent cells. If no valid pairs exist, show toast: "Not enough space for Flying Geese here." |
| **Tap outside grid** | Deselect any active tool/selection (standard Figma/Canva behavior) |
| **Undo with empty history** | Undo button visually disabled (grayed out) when stack is empty |
| **Navigate away with unsaved changes** | Auto-save draft every 30 seconds. For first-time save (no name yet), show modal: "Save your block before leaving?" [Save Draft] [Discard] [Cancel] |
| **Block name already exists** | Allow duplicate names. Names are for humans; IDs are for the system. |
| **Publish empty block** | Prevent. Show: "Add at least one shape before publishing." |
| **Network failure during save** | Auto-retry 3 times with exponential backoff. If all fail, show: "Couldn't save. Check your connection and try again." [Retry] |

### 10.2 Pattern Designer Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Place block on occupied slot** | Replace directly. Undo is available if accidental. (Matches Figma behavior) |
| **Delete last row/column** | Enforce minimum 2×2 grid. Show toast: "Minimum quilt size is 2×2." |
| **Quilt too large (performance)** | Allow up to 15×15 freely. At 15+, warn: "Quilts larger than 15×15 may run slowly on some devices." Hard cap at 25×25. |
| **Saved block deleted by creator** | User's saved copy persists. When user saves a community block, we store a copy. Original deletion doesn't affect saved copies. Attribution remains. |
| **Publish empty pattern** | Prevent. Show: "Add at least one block before publishing." |

### 10.3 General Error States

| Scenario | Behavior |
|----------|----------|
| **Session timeout** | Silent token refresh. Only show "Session expired" modal if refresh fails. |
| **Same design open in multiple tabs** | Detect conflicts on save. Show: "This design was updated elsewhere." [Reload] [Overwrite] |
| **Storage/quota exceeded** | Show: "Storage full. Delete old drafts to continue." (Generous limits for MVP) |

---

## 11. Open Items

_Items still needing decisions._

| Item | Options | Notes |
|------|---------|-------|
| Auto-save frequency | On every change / Debounced / Manual only | Leaning toward debounced (30s) based on edge cases |

### Resolved Items (moved from Open)

| Item | Decision | Reference |
|------|----------|-----------|
| Rendering technology | **Konva.js (web) + React Native Skia (mobile)** | See [TECH_RESEARCH_RENDERING.md](./TECH_RESEARCH_RENDERING.md) |
| Cross-platform strategy | **Shared core + platform renderers** | ~70% shared TypeScript logic, platform-specific rendering |

---

_Next Steps: Data model design, then implementation._
