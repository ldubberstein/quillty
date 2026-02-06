# Fabric Block Coloring in Pattern Designer: Research Findings

## Executive Summary

This document presents research on how quilting design software handles fabric/color selection at the block level within patterns, with a focus on user workflows for iterating on fabric choices. The research was conducted to inform the development of per-block fabric coloring in Quillty's pattern designer.

**Key Finding:** Users need the ability to color individual blocks differently within a pattern, and existing tools address this with varying levels of sophistication. The most common pain points center around tedious recoloring workflows, lack of undo history, and difficulty comparing colorway alternatives.

---

## Research Iteration 1: Industry Landscape

### Major Quilting Design Tools

| Tool | Platform | Pricing | Block Coloring Approach |
|------|----------|---------|------------------------|
| **Electric Quilt 8 (EQ8)** | Windows/Mac | $199 one-time | Most comprehensive: multiple coloring tools, modifier keys for alternating blocks |
| **PreQuilt** | Web | Free/$50/year | Play-based randomization, quick colorway iteration |
| **Quiltography** | iPad | Free/$9.99 | Camera fabric scanning, stash library integration |
| **Quilt Creator** | iOS/Android | Free | Simple touch-to-color, undo/redo support |
| **PatternJam** | Web | Free tier | Web-based, fabric image upload |

### EQ8: The Industry Standard

EQ8 is considered "the leading quilt-design software in the world" and provides the most comprehensive fabric coloring tools:

**Core Coloring Tools:**
1. **Paintbrush Tool** - Paints individual patches with selected fabric
2. **Drag and Drop** - Drag fabric swatches directly onto patches
3. **Spraycan Tool** - Replaces matching patches within a single block
4. **Swap Color Tool** - Global find/replace for fabrics across entire quilt

**Alternating Block Shortcuts (Key Feature):**
- `Ctrl/Cmd + Paintbrush click` - Recolor same patch in ALL blocks
- `Alt/Option + Paintbrush click` - Recolor same patch in ALTERNATING blocks only
- `Alt/Option + drag` - Drag fabric to alternating blocks

**Fabric Library:**
- Ships with 6,200+ fabrics from major manufacturers
- Import custom fabrics via scan/photo
- Fabric scaling and straightening tools

### PreQuilt: Modern Web-Based Approach

PreQuilt takes a more exploratory, "play-based" approach:

**Key Features:**
- Randomize colors, blocks, and orientation with one click
- "Magic Quad" feature for design exploration
- Digital color cards for Kona, Art Gallery, Riley Blake, Free Spirit
- Quick colorway iteration for A/B comparisons

**Philosophy:** Less about precise control, more about rapid exploration and happy accidents.

### Quiltography: Mobile-First Design

**Unique Approach:**
- Automatic fabric scanning picks up to 5 dominant colors
- Direct camera integration for stash photography
- Built-in stash library for fabric inventory management

---

## Research Iteration 2: User Pain Points & Complaints

### Common Frustrations

**1. Learning Curve & Non-Intuitive Interfaces**
> "It doesn't quite do what I think it will do, or it doesn't quite do it the way I think it should"
> — EQ8 user forum

Many users describe quilting software as having steep learning curves. Interface changes between versions cause adaptation problems for experienced users.

**2. Color/Fabric Preservation Issues**
Users report frustration when editing a block causes loss of applied colors:
> "If you made a change to an EasyDraw block, the coloring would be messed up when switching to the Color tab"

This was addressed in EQ8 but remains a concern with some tools.

**3. Digital vs. Real Fabric Mismatch**
- Some apps only support solid colors, not fabric prints
- Manual color-matching to manufacturer swatches (Kona, Bella Solids) is tedious
- Screen calibration affects color accuracy
- Printed fabric patterns may look different at different scales

**4. Limited Undo/History**
Many simpler apps lack robust undo functionality, making experimentation risky.

**5. Alternating Block Coloring is Tedious**
Without special tools (like EQ8's Alt+click), coloring alternating blocks requires clicking each block individually—a major time sink for large quilts.

**6. Colorway Comparison Difficulty**
Users want to compare multiple color schemes side-by-side, but most tools don't support multiple concurrent versions.

### The "Love/Hate Relationship"
> "I have a very love/hate relationship with EQ. There are so many things I love and so many things that could be amazing but just aren't"
> — Quilting Forum User

This sentiment is common: the tools are powerful but fall short of user expectations in specific workflows.

---

## Research Iteration 3: User Workflow Patterns

### How Quilters Iterate on Fabric Choices

**Phase 1: Initial Pull**
1. Start with a "focus fabric" (usually a large print)
2. Pull coordinates based on colors in the focus fabric
3. Consider value (light/medium/dark), scale, and design variety

**Phase 2: Digital Mockup**
1. Import fabrics or select approximate colors
2. Place initial color assignments
3. Step back (literally or via photo) to evaluate

**Phase 3: Iteration Cycle**
1. Identify problem areas (too much of one color, lost contrast, muddy sections)
2. Swap fabrics—often trying 3-5 alternatives per position
3. Consider block-level variation (not all blocks need identical coloring)
4. Take photos to compare iterations

**Phase 4: Refinement**
1. Fine-tune individual blocks for visual balance
2. Check that the design "reads" correctly at a distance
3. Verify sufficient value contrast

### Key Insight: Block-Level Variation is Common

Experienced quilters often want:
- **Scrappy looks** - Each block uses different fabrics from the same color family
- **Gradients** - Blocks transition from one colorway to another across the quilt
- **Focal points** - Center blocks might have different treatment than border blocks
- **Value variation** - Some blocks emphasized with higher contrast

This is distinct from the simpler use case of "all blocks use the same colors."

---

## Current Quillty Architecture Analysis

### Existing Fabric/Color Model

**Palette Structure:**
```typescript
interface FabricRole {
  id: string;         // e.g., 'background', 'feature', 'accent1'
  name: string;       // Human-readable name
  color: string;      // Hex color
}

type Palette = FabricRole[];
```

**How Blocks Reference Colors:**
- Shapes store `fabricRole` IDs (not colors directly)
- This indirection allows palette changes to propagate automatically

### Block Designer vs Pattern Designer

| Aspect | Block Designer | Pattern Designer |
|--------|---------------|------------------|
| **Palette Owner** | Block (`previewPalette`) | Pattern (`palette`) |
| **Rendering** | Uses block's palette | Uses pattern's palette |
| **Editing UI** | FabricPanel | PalettePanel |

**Current Limitation:** All instances of a block in a pattern share the pattern's single palette. No per-block overrides exist.

### BlockInstance Schema (Current)
```typescript
interface BlockInstance {
  id: UUID;
  blockId: UUID;
  position: GridPosition;
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  // NO fabric override capability
}
```

---

## Design Considerations for Per-Block Coloring

### Approach Options

**Option A: Per-Instance Palette Overrides**
```typescript
interface BlockInstance {
  // ...existing fields
  paletteOverrides?: Record<FabricRoleId, string>;
}
```
- Pros: Simple, granular control, can override any role
- Cons: Could get complex with many overrides per block

**Option B: Named Colorway Variants**
```typescript
interface Pattern {
  palettes: Record<string, Palette>;  // 'default', 'alternate', 'accent'
}

interface BlockInstance {
  paletteId?: string;  // Which palette to use
}
```
- Pros: Reusable colorways, easy to apply consistently
- Cons: Less flexible for truly unique blocks

**Option C: Hybrid Approach**
- Support both named colorways AND per-instance overrides
- Named colorways for common alternating patterns
- Overrides for one-off adjustments

### UX Patterns from Research

**From EQ8:**
- Modifier keys (Ctrl, Alt) for scope control
- Spraycan for "same fabric in this block"
- Swap tool for global find/replace

**From PreQuilt:**
- Randomization as a discovery tool
- Quick iteration without commitment
- Visual colorway comparison

**From User Complaints:**
- Robust undo/history is essential
- Preserve work when making changes
- Make alternating-block coloring efficient

---

## Recommendations for Quillty

### Must-Have Features

1. **Per-block color override** - Allow individual blocks to deviate from pattern palette
2. **Alternating block shortcuts** - Efficient way to color every-other-block
3. **Undo/redo support** - Essential for experimentation
4. **Visual feedback** - Clear indication when a block has custom colors

### Nice-to-Have Features

1. **Named colorways** - Define "Colorway A" and "Colorway B" for easy assignment
2. **Global swap** - Replace one color with another across all blocks
3. **Randomize** - Apply random palette variations for scrappy looks
4. **Comparison mode** - View two colorway options side-by-side

### Interaction Design Suggestions

1. **Select block → Edit colors** - Click a block instance to enter per-block color mode
2. **Paint mode with modifiers** - Similar to EQ8's Ctrl/Alt patterns
3. **Color picker with role awareness** - Show which role is being overridden
4. **Reset to default** - Easy way to remove per-block overrides

---

## Sources

### Quilting Software
- [Electric Quilt 8 (EQ8)](https://electricquilt.com/online-shop/category/electric-quilt-8-eq8/)
- [EQ8 Coloring and Recoloring Tutorial](https://doyoueq.com/blog/2019/02/design-discover-coloring-and-recoloring/)
- [EQ8 Coloring Quilts and Blocks](https://support.electricquilt.com/articles/coloring-quilts/)
- [PreQuilt](https://prequilt.com/)
- [Quiltography](https://www.quiltography.co.uk/)
- [Quilt Creator App](https://play.google.com/store/apps/details?id=com.crochetdesigns.quiltblockcreator)

### User Discussions & Reviews
- [Missouri Star Quilt Forum - EQ8 Discussion](https://forum.missouriquiltco.com/forum/we-don-t-know-much-but-we-know-quilters/general-discussion/2095042-does-anyone-use-eq8-electric-quilt)
- [Quiltingboard - EQ8 Discussion](https://www.quiltingboard.com/main-f1/eq8-not-t306667.html)
- [Electric Quilt 8 Review - Quilters Review](https://www.quiltersreview.com/electric-quilt-8/)
- [Best Quilting Apps - Designed to Quilt](https://designedtoquilt.com/best-quilting-apps/)

### Fabric Selection Guidance
- [Choosing Fabric for a Quilt - Diary of a Quilter](https://www.diaryofaquilter.com/choosing-fabric-for-a-quilt/)
- [How to Pick Fabrics - Shannon Fraser Designs](https://shannonfraserdesigns.ca/2024/05/23/how-to-pick-fabrics-and-basic-colour-theory-for-quilters/)
- [Fabric Value, Scale, and Placement - Leila Gardunia](https://www.leilagardunia.com/blog/how-to-choose-fabric-for-your-quilt)
- [Suzy Quilts - PreQuilt Patterns](https://suzyquilts.com/best-way-to-pick-fabric-for-a-quilt/)

---

## Additional Research: Data Models & Touch Patterns

### The Figma Component/Instance Model

Figma's approach to component instances provides a valuable pattern for per-block coloring:

**Core Concepts:**
1. **Main Component** = Block definition (the template)
2. **Instance** = BlockInstance (a usage of that block in a pattern)
3. **Overrides** = Per-instance property changes that don't break the link

**How Overrides Work:**
- Instances inherit all properties from the main component
- You can override specific properties (fill, stroke, text) without "detaching"
- Changes to the main component propagate to instances, *except* for overridden properties
- Example: If instance has color override of green, and main component changes to red, instance stays green

**Visual Indication of Overrides:**
- Users have requested visual indicators showing which properties are overridden
- Similar to Adobe InDesign/Affinity Publisher which show dots or badges on overridden properties
- Key UX: "Reset to default" option to remove individual overrides

**When to Detach (Create New Block):**
- Detach when you need to change *structure* (add/remove shapes)
- Keep as instance when only changing *properties* (colors, sizes)
- Detaching breaks the link permanently—instance becomes independent

### Applying Figma's Model to Quillty

| Figma Concept | Quillty Equivalent | Behavior |
|--------------|-------------------|----------|
| Main Component | Block (in library) | Defines shapes and structure |
| Instance | BlockInstance (in pattern) | Uses block in a specific position |
| Property Override | `paletteOverrides` | Changes color without breaking link |
| Detach | "Save as New Block" | Creates independent block copy |

**Key Insight:** Color overrides should NOT require creating a new block. The block structure (shapes, roles) stays linked; only the color resolution changes.

---

### Mobile/Touch Interaction Patterns

Research from Procreate and iOS design guidelines informs touch-friendly color interactions:

**Procreate Color Filling:**
- **Drag and drop**: Tap color, drag to canvas, drop to fill
- **Tap and hold**: Hold on canvas with finger to invoke color picker (eyedropper)
- **Precision mode**: Drag + hold longer for more precise fill threshold
- **Quick swap**: Tap and hold active color to swap between current and previous

**iOS/iPad Design Guidelines:**
- Touch targets: Minimum 44×44 pixels
- Visual feedback: Color changes, shadows, or animations on touch
- Gesture affordances: Visual cues suggesting available gestures
- Drag-and-drop: Reduces task completion time by ~30%
- Sidebar patterns: Collapsible panels for more canvas space

**Recommended Touch Interactions for Quillty:**

| Gesture | Action |
|---------|--------|
| **Tap block** | Select block instance |
| **Tap selected block** | Enter block color edit mode |
| **Tap color swatch + tap shape** | Apply color to that shape in selected block |
| **Drag color swatch to shape** | Apply color (more discoverable) |
| **Long press on shape** | Show color picker for that shape |
| **Two-finger tap** | Undo |
| **Swipe left on block** | Reset to default colors |

---

### Question: Does Per-Block Override Maintain the Pattern?

**Yes, overrides maintain the block's structure/pattern.**

The override model works at the *color resolution* level, not the shape level:

```
Block Definition (unchanged):
├── Square with fabricRole='background'
├── HST with fabricRole='feature' + secondaryRole='accent1'
└── previewPalette: { background: #FFF, feature: #000, accent1: #888 }

Pattern:
├── palette: { background: #F5F5DC, feature: #2C3E50, accent1: #8B4513 }
└── instances:
    ├── Instance A: { position: [0,0], paletteOverrides: {} }          → uses pattern palette
    └── Instance B: { position: [0,1], paletteOverrides: { feature: '#FF0000' } } → feature is red
```

**What users see:**
- Instance A: feature shapes are navy (#2C3E50)
- Instance B: feature shapes are red (#FF0000), but background and accent1 still come from pattern palette

**Visual distinction:** The block's "design" (which shapes, which roles) is unchanged. Only the color mapping differs.

---

### Question: When Should a User Create a New Block?

**Create new block when:**
- Changing the *structure* (different shapes, different role assignments)
- Creating a fundamentally different design variant
- Wanting the design available in block library for other patterns

**Use per-instance override when:**
- Same block structure, just different colors
- Temporary or pattern-specific color variations
- Quick experimentation ("what if this block was blue instead?")

**UX Recommendation: "Save as New Block" option**

When a user has a heavily customized instance, offer:
1. **Keep as override** (default) - Changes stay with this pattern only
2. **Save as new block** - Creates a new block in library with these colors as the new default palette

This matches Figma's "Detach instance" → "Create component" workflow.

---

### Visual Indication of Overridden Blocks

**Problem:** Users need to know which blocks have custom colors vs. using pattern defaults.

**Options from industry:**

1. **Badge/dot indicator** (Adobe InDesign style)
   - Small colored dot in corner of block indicating "has overrides"
   - Click dot to see/reset overrides

2. **Border highlight**
   - Subtle border color change for customized blocks
   - e.g., blocks with overrides have a thin accent border

3. **Sidebar list**
   - Panel showing all instances with overrides
   - Quick navigation and bulk reset

4. **Hover tooltip**
   - On hover, show "Custom colors: feature → red"

**Recommendation for Quillty:**
- Small indicator badge (corner dot or icon) for blocks with overrides
- Selection reveals override details in sidebar panel
- "Reset to pattern palette" action easily accessible

---

## Updated Data Model Recommendation

Based on research, the recommended approach:

```typescript
interface BlockInstance {
  id: UUID;
  blockId: UUID;
  position: GridPosition;
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;

  // NEW: Per-instance color overrides
  // Maps fabricRoleId → hex color
  // If a role is not in this map, use pattern's palette
  paletteOverrides?: Record<string, string>;
}
```

**Color Resolution Logic:**
```typescript
function getColorForShape(
  pattern: Pattern,
  instance: BlockInstance,
  roleId: string
): string {
  // 1. Check instance overrides first
  if (instance.paletteOverrides?.[roleId]) {
    return instance.paletteOverrides[roleId];
  }
  // 2. Fall back to pattern palette
  return getColor(pattern.palette, roleId);
}
```

This approach:
- ✅ Maintains block structure (no detachment needed)
- ✅ Allows granular per-role overrides
- ✅ Falls back gracefully to pattern palette
- ✅ Easy to reset (just clear overrides)
- ✅ Compatible with undo/redo (just track override changes)

---

## Sources (Additional)

### Design System & Component Models
- [Figma Component Overrides](https://www.figma.com/blog/figma-feature-highlight-component-overrides/)
- [Guide to Components in Figma](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma)
- [Detach Instance from Component](https://help.figma.com/hc/en-us/articles/360038665754-Detach-an-instance-from-the-component)
- [Component Variants Best Practices](https://supercharge.design/articles/component-variants-and-instances-in-ux-ui-design-a-guide)

### Mobile/Touch Patterns
- [Procreate Gestures Handbook](https://help.procreate.com/procreate/handbook/interface-gestures/gestures)
- [Procreate Color Fill](https://help.procreate.com/articles/4rymuZ-fill-an-area)
- [iOS Human Interface Guidelines - iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- [Material Design Gestures](https://m1.material.io/patterns/gestures.html)

---

*Research conducted: February 2026*
*Document version: 2.0 - Added data model research, touch patterns, and override visual indicators*
