# Border Design Research

## Overview

This document captures user and competitive research on quilt border design to inform Quillty's border feature implementation.

---

## 1. User Research: How Quilters Design Borders

### 1.1 Key Decision Points

When designing borders, quilters face several fundamental questions:

1. **To border or not to border?** - Not all quilts need borders; many antique quilts have none
2. **How many borders?** - Single, double, or multiple layered borders
3. **What width(s)?** - Proportional sizing is crucial
4. **What style?** - Plain, pieced, appliqué, etc.
5. **Which fabrics?** - Color, pattern, contrast considerations
6. **Corner treatment?** - Butted (squared) vs. mitered vs. cornerstones
7. **Does the border frame or extend?** - Frame the quilt or continue the design outward

### 1.2 When Borders Are Decided

**Timing varies by quilter:**

- **Pre-planning approach**: Some quilters plan borders from the start, especially for:
  - Medallion quilts (built outward from center)
  - Round robin quilts (collaborative border additions)
  - Quilts with specific size requirements (bed sizing)

- **Post-completion approach**: Many quilters finish the quilt center first, then:
  - Audition fabrics by laying strips alongside the finished top
  - Take photos to evaluate proportions at smaller scale
  - Experiment with different widths and combinations

- **Iterative approach**: Some revisit border decisions even after initial choices based on backing fabric selection

### 1.3 Border Purposes

| Purpose | Description |
|---------|-------------|
| **Framing** | Creates visual frame around the design, like a picture frame |
| **Size adjustment** | Easiest way to reach desired dimensions (bed sizing) |
| **Design balance** | Calms busy quilts or adds interest to simple ones |
| **Edge protection** | Adds durability to vulnerable outer edges |
| **Design extension** | Continues pattern elements from the center |
| **Squaring up** | Helps correct slightly wonky quilt tops |

---

## 2. Standard Border Types

### 2.1 By Construction Method

| Type | Description | Best For |
|------|-------------|----------|
| **Butted (Lapped)** | Squared corners; sides attached first, then top/bottom | Beginners; allover prints |
| **Mitered** | 45° angled corners like a picture frame | Stripes; directional prints; formal look |
| **Cornerstone** | Square blocks at corners in contrasting fabric | Adding color accent; visual structure |

### 2.2 By Design Style

| Style | Description | Complexity |
|-------|-------------|------------|
| **Plain/Solid** | Single fabric strip; clean, minimalist | Simple |
| **Floating** | Same fabric as quilt interior; "floats" the design | Simple |
| **Pieced** | Smaller fabric pieces sewn into patterns | Medium-Complex |
| **Piano Key** | Narrow strips side-by-side (like piano keys) | Medium |
| **Sawtooth** | Triangles forming zigzag pattern | Medium |
| **Flying Geese** | Triangle units pointing one direction | Medium |
| **Appliqué** | Shapes sewn onto border fabric | Complex |
| **Scalloped** | Curved edges | Complex |
| **Prairie Points** | Folded triangles along edge | Complex |
| **Sashed** | Matches interior sashing style | Varies |

### 2.3 Layered/Multiple Borders

Common configurations:

- **Inner + Outer**: Narrow inner border (often 1") frames the quilt; wider outer border completes
- **Three-border**: Often follows Fibonacci proportions (e.g., 2", 3", 5")
- **Accent strip**: Very thin contrasting strip between borders (flange)
- **Mixed styles**: Plain inner with pieced outer, or vice versa

---

## 3. Border Sizing & Proportions

### 3.1 Mathematical Approaches

**Golden Ratio (1.618:1)**
- Each border 1.6× larger than the previous
- Example with 8" total: 1.5" → 2.5" → 4"

**Fibonacci Sequence**
- 1, 1, 2, 3, 5, 8, 13...
- Use consecutive numbers for border widths
- Example: 2", 3", 5" borders

**Block-Based Rules**
- Outer border = 1/4 to 1/2 of block size
- Example: 12" blocks → 3" to 6" outer border
- If using sashing, border can match sashing width

### 3.2 Size Guidelines

| Quilt Type | Recommended Total Border Width |
|------------|-------------------------------|
| Small wall quilt | Less than 6" total |
| Throw/lap quilt | 6-8" total |
| Bed quilt | Up to 12-14" total |

**Key principle**: Borders should complement, never overwhelm the center design.

### 3.3 Corner Treatment Decision Guide

| Scenario | Recommended Corner |
|----------|-------------------|
| Striped fabric | Mitered |
| Border prints | Mitered |
| Directional patterns | Mitered |
| Allover prints | Butted |
| Beginner quilter | Butted |
| Want to add accent color | Cornerstone |
| Quilt has sashing with cornerstones | Cornerstone |

---

## 4. User Pain Points & Challenges

### 4.1 Common Frustrations

1. **Proportion anxiety**: "How wide should my borders be?"
2. **Wavy/wonky borders**: Result of "slap and sew" method
3. **Border overwhelms center**: Wrong width or contrast
4. **Pieced border math**: Making pieced borders fit exactly
5. **Corner alignment**: Especially with multiple borders
6. **Fabric quantity uncertainty**: How much to buy?
7. **Decision paralysis**: Too many options

### 4.2 Mistakes to Avoid

- Border too wide relative to quilt center
- Using high-contrast fabric that pulls attention from center
- Not measuring quilt center before cutting borders
- Stretching borders while sewing (causes waves)
- Not pressing thoroughly before adding borders

---

## 5. Competitive Analysis

### 5.1 EQ8 (Electric Quilt 8) - Desktop Software

**Border Features:**
- Preview every border style before selection
- Design center first, then preview while adding borders
- Long Horizontal/Long Vertical options
- Auto Borders feature
- Rotary cutting guides for borders
- Yardage calculations including borders

**Strengths:** Comprehensive, industry standard
**Weaknesses:** Desktop only, steep learning curve, expensive ($249)

### 5.2 Quiltography - iPad App

**Border Features:**
- Add borders comprised of blocks
- Pieced borders (set any block as border)
- Cornerstones option
- On-point border settings

**Strengths:** Mobile, intuitive touch interface, 180+ block templates
**Weaknesses:** Border options described as "basically zero" by some users; limited to simple single borders; iPad only

**User Feedback:** "If it were making only very traditional quilts with just one 5-inch border, I wouldn't have any complaints... the border options are basically zero."

### 5.3 PreQuilt - Web App

**Features:**
- Fabric visualization with real fabric swatches
- Randomization tools
- Color card presets for major manufacturers
- Block editor

**Strengths:** Web-based, fabric import, free tier
**Weaknesses:** No specific advanced border tools mentioned; free version can't save designs

### 5.4 My Quilt Planner

**Border Features:**
- Automatic quilt layout with multiple borders
- Sashing options
- Autofill borders with quilting designs

**Strengths:** Good for longarm/machine quilting layout
**Weaknesses:** Focused on quilting patterns, not piecing design

### 5.5 Competitive Gap Analysis

| Feature | EQ8 | Quiltography | PreQuilt | **Opportunity for Quillty** |
|---------|-----|--------------|----------|----------------------------|
| Multiple borders | ✅ | Limited | Unknown | ✅ Strong need |
| Border preview | ✅ | ✅ | ✅ | Expected |
| Pieced borders | ✅ | ✅ | Unknown | Differentiator |
| Cornerstone support | ✅ | ✅ | Unknown | Expected |
| Mitered corners | ✅ | ❌ | Unknown | Differentiator |
| Auto-sizing/ratios | ✅ | ❌ | ❌ | **Key differentiator** |
| Mobile-first | ❌ | ✅ | ✅ | Expected |
| Real-time preview | ❌ | ✅ | ✅ | Expected |

---

## 6. Key Research Insights

### 6.1 User Needs Summary

1. **Flexibility**: Support for no border, single, and multiple borders
2. **Guidance**: Help with proportions (Golden Ratio, Fibonacci suggestions)
3. **Visualization**: Preview borders on actual quilt design before committing
4. **Multiple styles**: Plain, pieced, cornerstones at minimum
5. **Corner options**: Butted, mitered, cornerstone
6. **Size targeting**: Work backward from desired final size
7. **Fabric estimation**: How much fabric needed for borders

### 6.2 Design Principles for Quillty

1. **Progressive disclosure**: Start simple, reveal complexity as needed
2. **Smart defaults**: Suggest proportional sizes based on quilt/block dimensions
3. **Non-destructive**: Easy to experiment, undo, try alternatives
4. **Visual-first**: Show don't tell; real-time preview is essential
5. **Educate subtly**: Surface best practices without overwhelming

---

## 7. Proposed Border Design Flow

### 7.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUILT CENTER COMPLETE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: BORDER INTENT                                          │
│  ─────────────────────                                          │
│  "What's your goal?"                                            │
│                                                                 │
│  ○ No border (skip to binding)                                  │
│  ○ Simple frame (single border)                                 │
│  ○ Layered borders (multiple)                                   │
│  ○ Reach specific size (size-driven)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: BORDER CONFIGURATION                                   │
│  ────────────────────────────                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  + Add Border                                           │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Border 1 (Inner)                                       │    │
│  │  ├─ Style: [Plain ▼] [Pieced ▼]                         │    │
│  │  ├─ Width: [2.0"] [Auto-suggest: Golden Ratio]          │    │
│  │  ├─ Fabric: [Select fabric swatch]                      │    │
│  │  └─ ⚙️ Advanced: Corners, Piecing pattern               │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Border 2 (Outer)                            [× Remove] │    │
│  │  ├─ Style: [Plain ▼]                                    │    │
│  │  ├─ Width: [3.25"] [Suggested based on Border 1]        │    │
│  │  └─ Fabric: [Select fabric swatch]                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Corner Style (applies to all): [Butted ▼] [Mitered] [Stone]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: LIVE PREVIEW                                           │
│  ───────────────────                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │              ┌───────────────────────┐                  │    │
│  │              │    ┌───────────┐      │                  │    │
│  │              │    │           │      │                  │    │
│  │              │    │   QUILT   │      │  ← Live preview  │    │
│  │              │    │   CENTER  │      │    with borders  │    │
│  │              │    │           │      │                  │    │
│  │              │    └───────────┘      │                  │    │
│  │              └───────────────────────┘                  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Final Size: 64" × 80"    Border adds: 10" total                │
│                                                                 │
│  [← Back]                              [Apply Borders →]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Detailed Feature Specifications

#### 7.2.1 Border Intent Selection

| Intent | Flow |
|--------|------|
| **No border** | Skip directly to binding/finishing |
| **Simple frame** | Single border config; width + fabric |
| **Layered borders** | Multi-border config with add/remove |
| **Reach specific size** | Enter target dimensions; auto-calculate border widths |

#### 7.2.2 Border Configuration Panel

**For each border layer:**

| Setting | Options | Smart Default |
|---------|---------|---------------|
| **Style** | Plain, Pieced (with pattern picker) | Plain |
| **Width** | Manual input or suggested | Golden Ratio from previous |
| **Fabric** | Fabric picker from palette | Suggest contrasting/complementary |
| **Corners** | Butted, Mitered, Cornerstone | Based on fabric type |

**Smart suggestions:**
- If first border: suggest 1/4 of block size
- If subsequent: suggest Golden Ratio (1.6× previous)
- If striped fabric selected: prompt for mitered corners
- If cornerstone selected: show cornerstone fabric picker

#### 7.2.3 Cornerstone Configuration (when selected)

```
┌─────────────────────────────────────────┐
│  Cornerstone Settings                   │
│  ─────────────────────                  │
│                                         │
│  Fabric: [Select swatch]                │
│                                         │
│  Style:                                 │
│  ○ Solid (matches border width)         │
│  ○ Pieced (select block)                │
│     └─ Block: [Half-Square Triangle ▼]  │
│                                         │
└─────────────────────────────────────────┘
```

#### 7.2.4 Size-Driven Mode

When user selects "Reach specific size":

```
┌─────────────────────────────────────────────────────────────────┐
│  Target Size Calculator                                         │
│  ──────────────────────                                         │
│                                                                 │
│  Current quilt center: 48" × 60"                                │
│                                                                 │
│  Target final size:                                             │
│  Width: [68"] inches    Height: [80"] inches                    │
│                                                                 │
│  ── Or select bed size: ──                                      │
│  [Twin] [Full] [Queen] [King] [Custom]                          │
│                                                                 │
│  Border needed: 10" per side (width) × 10" per side (height)    │
│                                                                 │
│  Suggested border configuration:                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Option A: Single 10" border                            │    │
│  │  Option B: 4" inner + 6" outer (Fibonacci)              │    │
│  │  Option C: 2" + 3" + 5" (Fibonacci triple)              │    │
│  │  Option D: 2.5" + 4" + 6.5" (Golden Ratio)              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Pieced Border Options

When "Pieced" style selected:

**Pre-built pieced border patterns:**
- Piano Keys (rectangles)
- Flying Geese
- Sawtooth (half-square triangles)
- Checkerboard
- Nine-patch chain
- Custom (use any block from library)

**Configuration:**
- Unit size (auto-calculated to fit border length evenly)
- Direction (for directional patterns)
- Color scheme (inherit from quilt or custom)

### 7.4 Preview Interactions

| Interaction | Result |
|-------------|--------|
| Tap border in preview | Select that border for editing |
| Pinch zoom | Zoom preview in/out |
| Long-press fabric area | Quick-swap fabric |
| Drag width slider | Real-time width adjustment |
| Tap corner | Toggle corner style |

### 7.5 Entry Points

Users can access border design from:

1. **Quilt completion flow**: Prompted after finishing quilt center
2. **Settings/Options panel**: "Edit Borders" option
3. **Direct manipulation**: Tap edge of quilt in design view
4. **Size adjustment flow**: When adjusting quilt dimensions

---

## 8. Implementation Recommendations

### 8.1 MVP (Phase 1)

- Single plain border with width control
- Cornerstone option
- Live preview
- Basic fabric selection
- Final size display

### 8.2 Phase 2

- Multiple borders (up to 3-4)
- Golden Ratio / Fibonacci suggestions
- Size-driven mode with bed size presets
- Mitered corner option

### 8.3 Phase 3

- Pieced borders (piano key, sawtooth, flying geese)
- Custom pieced borders using block library
- Fabric estimation/yardage calculations
- Border templates/presets

---

## 9. Open Questions for User Testing

1. Do users prefer to design borders during quilt creation or after?
2. How important is mathematical guidance (ratios) vs. visual intuition?
3. What pieced border patterns are most commonly used?
4. How often do quilters use mitered corners in reality?
5. Is size-driven mode a common workflow?
6. Do users want border "presets" they can save and reuse?

---

## 10. Sources

### User Research & Guides
- [APQS: 7 Types of Quilt Borders](https://www.apqs.com/7-types-of-quilt-borders-to-elevate-your-quilting-projects/)
- [National Quilters Circle: All About Quilt Borders](https://www.nationalquilterscircle.com/post/all-about-quilt-borders)
- [MadamSew: Planning Borders for Quilts](https://madamsew.com/blogs/sewing-blog/planning-borders-for-quilts)
- [GE Designs: All About Quilt Borders](https://gequiltdesigns.com/blogs/the-quilters-toolkit/all-about-quilt-borders)
- [Phoebe Moon: Choosing a Border for Your Quilt](https://phoebemoon.com/choosing-a-border-for-your-quilt/)
- [Quilting Jetgirl: Quilt Design Decisions - Borders](https://quiltingjetgirl.com/2015/09/12/quilt-design-decisions-borders/)
- [Snuggles Quilts: Planning a Quilt Border](https://snugglesquilts.com/planning-a-quilt-border-plain-pieced-combinations/)
- [Snuggles Quilts: To Border or Not to Border](https://snugglesquilts.com/to-border-or-not-to-border/)

### Sizing & Proportions
- [Designed to Quilt: How to Calculate Quilt Borders](https://designedtoquilt.com/calculate-quilt-borders/)
- [Cobwebs and Caviar: Golden Ratio for Quilt Borders](https://cobwebsandcaviar.com/quilt-borders-and-the-golden-ratio/)
- [Quilter's Paradise: Border Calculator](https://www.quiltersparadiseesc.com/Calculators/Border%20Calculator.php)
- [Designed to Quilt: Quilt Border Calculator](https://designedtoquilt.com/quilt-border-calculator/)
- [Generations Quilt Patterns: How to Calculate Quilt Borders](https://www.generations-quilt-patterns.com/how-to-calculate-quilt-borders.html)

### Border Techniques
- [Craftsy: Mitered Corners on Quilt Borders](https://www.craftsy.com/post/mitered-quilt-borders)
- [National Quilters Circle: Mitering Made Easy](https://www.nationalquilterscircle.com/post/mitering-made-easy)
- [Jaybird Quilts: Mitered Multiple Borders Tutorial](http://www.jaybirdquilts.com/2009/08/mitered-multiple-borders-tutorial.html)
- [Stacey Lee Creative: Sashing and Borders with Cornerstones](https://www.stacey-lee.com/2022/09/30/sashing-and-borders/)
- [SewCanShe: How to Add Quilt Borders the Correct Way](https://sewcanshe.com/how-to-add-quilt-borders-the-correct-way/)

### Competitive Analysis
- [Quilter's Review: Electric Quilt 8 Review](https://www.quiltersreview.com/electric-quilt-8/)
- [Quiltography App Store](https://apps.apple.com/us/app/quiltography-quilt-design-made-simple/id585991997)
- [Quiltineering: Quiltography App Review](https://www.quiltineering.com/quiltography-app-review/)
- [PreQuilt](https://prequilt.com/)
- [Designed to Quilt: Best Quilting Apps](https://designedtoquilt.com/best-quilting-apps/)

### Pain Points & Challenges
- [APQS: How to Tackle Wavy Borders](https://www.apqs.com/how-to-tackle-wavy-borders/)
- [Stash Bandit: Quilt Borders - What Not to Do](https://stashbandit.net/quilt-borders-what-not-to-do/)
- [Missouri Star Forum: Multiple Borders Discussion](https://forum.missouriquiltco.com/forum/we-don-t-know-much-but-we-know-quilters/quilting-questions/2028941-multiple-borders-attach-all-borders-together-first)
