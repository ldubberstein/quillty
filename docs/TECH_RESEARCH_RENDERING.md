# Rendering Technology Research

Technical research for Block Designer and Pattern Designer rendering implementation.

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2026-02-02 | Initial research |

---

## 1. Feature Requirements from PRD

Based on [PRD_BLOCK_PATTERN_DESIGNER.md](./PRD_BLOCK_PATTERN_DESIGNER.md), the rendering solution must support:

### Core Drawing Features
| Requirement | Priority | Notes |
|-------------|----------|-------|
| Grid-based canvas (2×2, 3×3, 4×4) | P0 | Fixed grids for MVP |
| Geometric shapes (squares, HST, Flying Geese) | P0 | Sharp vector edges required |
| Shape rotation (90° snap) | P0 | Piece-level and preview rotation |
| Color/fabric fill | P0 | Solid colors MVP, photos later |
| Zoom & pan | P0 | Pinch-to-zoom, scroll wheel, buttons |
| Touch gestures | P0 | 48px+ touch targets, drag rotation |

### Interaction Features
| Requirement | Priority | Notes |
|-------------|----------|-------|
| Object selection | P0 | Single and multi-select |
| Bounding box with handles | P0 | Figma-style rotation zones |
| Drag-and-drop placement | P0 | Select-then-place pattern |
| Undo/redo | P0 | Linear stack |
| Real-time preview | P1 | 3×3 block repeat preview |
| Thumbnail generation | P1 | For publishing |

### Platform Requirements
| Requirement | Priority | Notes |
|-------------|----------|-------|
| Web (Next.js) | P0 | Primary platform |
| iOS (Expo/React Native) | P0 | Must ship together |
| Cross-platform code sharing | P1 | Minimize duplicate logic |
| 60 FPS interactions | P1 | Smooth rotation/zoom |
| Offline-capable | P2 | Local-first editing |

### Scale Expectations
| Metric | Expected Range |
|--------|----------------|
| Shapes per block | 4–64 (2×2 to 8×8 grid) |
| Blocks per pattern | 4–100 (2×2 to 10×10 quilt) |
| Total shapes on screen | 16–6,400 |
| Simultaneous interactions | 1–2 (single user) |

---

## 2. Technology Options Evaluated

### 2.1 Web Canvas Libraries

#### Fabric.js

**Overview:** Feature-rich canvas library focused on object manipulation, written in TypeScript as of v6.

**Strengths:**
- Rich object model with distinct shapes, text, images as entities
- Built-in selection, transformation, and bounding box handling
- SVG import/export support
- Serialization-friendly architecture (great for undo/redo, persistence)
- Active maintenance, TypeScript rewrite in v6
- Promise-based APIs in v6

**Weaknesses:**
- Larger bundle size than alternatives
- Requires more manual memory management
- Text editing built-in (unnecessary for our use case)
- No native React integration (requires wrapper)
- No React Native support

**React Integration:**
- [fabricjs-react](https://github.com/asotog/fabricjs-react) provides hooks and components
- Uncontrolled component pattern recommended

**Performance:**
- SVG-based rendering engine may struggle with very large object counts
- Good for <5,000 objects
- Serialization is a strength for undo/redo

**Verdict:** Strong candidate for web-only, but no path to React Native.

---

#### Konva.js / react-konva

**Overview:** High-performance canvas library with scene graph architecture, built-in React bindings.

**Strengths:**
- Scene graph architecture (layers, groups, hierarchy)
- Dirty region detection for efficient repaints
- First-class React support via [react-konva](https://www.npmjs.com/package/react-konva)
- Built-in TypeScript support
- Excellent touch/gesture support with [multi-touch examples](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html)
- Smaller bundle than Fabric.js
- Layer-based rendering (separate static/dynamic content)
- [Transformer](https://konvajs.org/docs/select_and_transform/Basic_demo.html) for selection/rotation/resize

**Weaknesses:**
- No SVG export (dealbreaker for some, not for us)
- Text editing requires custom implementation
- Default rotation handle is "lollipop" style (outdated)
- No React Native support

**Performance:**
- Optimized for frequent updates and animations
- Layer caching for static content
- Can handle thousands of objects with proper optimization
- Tips: disable event listening on static layers, cache complex shapes

**Verdict:** Best web canvas library for our needs, but no React Native path.

---

#### Paper.js

**Overview:** Vector graphics scripting framework, originally from Adobe Scriptographer.

**Strengths:**
- Powerful bezier curve and vector math
- Scene graph / DOM structure
- SVG import/export
- Symbol system for repeated elements (useful for quilt blocks)

**Weaknesses:**
- Less active development than Fabric/Konva
- No React integration out of box
- Heavier learning curve
- No touch gesture support built-in
- No React Native support

**Verdict:** Not recommended. Overkill for our geometric shapes, lacking in interaction features.

---

#### PixiJS

**Overview:** WebGL-first 2D rendering engine, game-engine heritage.

**Strengths:**
- Extremely high performance (GPU-accelerated)
- WebGL with Canvas fallback
- WebGPU support in v8
- Can render 10,000+ objects at 60 FPS

**Weaknesses:**
- Game-focused, not design-tool focused
- No built-in selection/transformation tools
- Would require building interaction layer from scratch
- Overkill for our scale (max ~6,400 shapes)

**Verdict:** Not recommended. Performance benefits don't justify the missing interaction features.

---

### 2.1b Additional Libraries Evaluated

#### Weave.js (New - January 2026)

**Overview:** Open-source library from Inditex for building collaborative canvas applications. Built on top of Konva.js.

**Strengths:**
- Built specifically for design/moodboard applications
- Real-time collaboration via Yjs/CRDT out of the box
- React integration with custom reconciler
- Production-tested at Inditex
- MIT licensed, fully open source

**Weaknesses:**
- Very new (released January 2026)
- Smaller community than Konva directly
- Adds abstraction layer over Konva
- Collaboration features we don't need for MVP
- No React Native support

**Verdict:** Interesting for future collaboration features, but too new and adds unnecessary complexity for MVP. We can use Konva directly and add Weave.js later if we need real-time collaboration.

**Links:** [GitHub](https://github.com/InditexTech/weavejs) | [Docs](https://inditextech.github.io/weavejs/)

---

#### tldraw

**Overview:** Infinite canvas SDK used by tldraw.com whiteboard. 33.3k GitHub stars.

**Strengths:**
- Excellent infinite canvas implementation
- Real-time collaboration built-in
- Active development, large community
- DOM-based (easier integration)

**Weaknesses:**
- **Hand-drawn aesthetic** — not suitable for precise geometric quilting shapes
- Watermark required unless you purchase business license
- Focused on sketching/wireframing, not precise design
- No React Native support

**Verdict:** Not recommended. Hand-drawn style conflicts with quilting's need for precise geometric shapes.

---

#### Excalidraw

**Overview:** Virtual whiteboard for hand-drawn diagrams. 74.8k GitHub stars. Used by Google Cloud, Meta, Notion.

**Strengths:**
- Massive community and adoption
- End-to-end encrypted collaboration
- Embeddable React component
- Shape libraries system

**Weaknesses:**
- **Hand-drawn aesthetic** — shapes intentionally look sketchy
- Not designed for precise geometric work
- No object snapping or alignment tools
- No React Native support

**Verdict:** Not recommended. Same issue as tldraw — the hand-drawn style is antithetical to quilting's precise geometry.

---

#### Polotno SDK

**Overview:** "Canva-like" design editor SDK built on Konva. Used in production by many companies.

**Strengths:**
- Full-featured design editor out of the box
- Templates, text, images, filters, exports, undo/redo
- React components ready to use
- Built on Konva (same foundation we'd use)
- Would save significant development time

**Weaknesses:**
- **NOT open source** — Freemium/proprietary license
- Requires license key for production
- Less customization flexibility
- No React Native support
- Cost for commercial use

**Verdict:** Would be ideal if it were open source. Not recommended due to proprietary licensing and cost. We're better off building on Konva directly.

---

#### Two.js

**Overview:** Renderer-agnostic 2D drawing API (WebGL, Canvas, SVG).

**Strengths:**
- Flexible rendering backends
- Can output to SVG for print
- Lightweight

**Weaknesses:**
- No selection/transformation UI
- No React integration
- Low-level — would need to build everything
- Less active than Konva/Fabric

**Verdict:** Not recommended. Too low-level for our needs.

---

#### Rough.js

**Overview:** Library for sketchy, hand-drawn style graphics. Used by Excalidraw.

**Strengths:**
- Beautiful hand-drawn aesthetic
- Small bundle (~9kB)

**Weaknesses:**
- **Hand-drawn style** — wrong aesthetic for quilting
- No interaction handling

**Verdict:** Not recommended. Wrong aesthetic entirely.

---

#### Pts.js

**Overview:** Library for creative coding and data visualization.

**Strengths:**
- TypeScript
- Good for generative art

**Weaknesses:**
- Abstract "space, form, point" model — steep learning curve
- Not designed for design tools
- No interaction handling

**Verdict:** Not recommended. Wrong use case.

---

### 2.1c Full Library Comparison Matrix

| Library | GitHub ⭐ | Selection UI | Precise Shapes | React | React Native | License | Verdict |
|---------|----------|--------------|----------------|-------|--------------|---------|---------|
| **Konva.js** | 11.2k | ✅ Transformer | ✅ Yes | ✅ react-konva | ❌ No | MIT | ✅ **Best for web** |
| **Fabric.js** | 30.9k | ✅ Built-in | ✅ Yes | ⚠️ Wrapper | ❌ No | MIT | Good alternative |
| **Weave.js** | ~1k | ✅ Via Konva | ✅ Yes | ✅ Yes | ❌ No | MIT | Too new for MVP |
| **tldraw** | 33.3k | ✅ Built-in | ❌ Hand-drawn | ✅ Yes | ❌ No | Apache 2.0* | Wrong aesthetic |
| **Excalidraw** | 74.8k | ✅ Built-in | ❌ Hand-drawn | ✅ Yes | ❌ No | MIT | Wrong aesthetic |
| **Polotno** | N/A | ✅ Full editor | ✅ Yes | ✅ Yes | ❌ No | **Proprietary** | Not open source |
| **Paper.js** | 14.5k | ❌ Manual | ✅ Yes | ❌ No | ❌ No | MIT | Less active |
| **PixiJS** | 44.8k | ❌ Manual | ✅ Yes | ⚠️ @pixi/react | ❌ No | MIT | Game-focused |
| **Two.js** | 8.3k | ❌ Manual | ✅ Yes | ❌ No | ❌ No | MIT | Too low-level |
| **Rough.js** | 20k | ❌ None | ❌ Hand-drawn | ❌ No | ❌ No | MIT | Wrong aesthetic |
| **RN Skia** | 7.5k | ❌ Manual | ✅ Yes | ✅ Native | ✅ **Yes** | MIT | ✅ **Best for mobile** |

*tldraw requires paid license to remove watermark

**Key Insight:** For precise geometric design tools, only **Konva.js** and **Fabric.js** provide both the selection/transformation UI and sharp vector shapes we need. For React Native, **Skia** is the only production-ready option.

---

### 2.2 React Native Rendering

#### React Native Skia

**Overview:** Shopify's high-performance graphics library bringing Skia (Chrome/Flutter's engine) to React Native.

**Strengths:**
- GPU-accelerated, 60+ FPS
- 100% identical rendering on iOS and Android
- **Web support via CanvasKit WebAssembly**
- Expo integration with official template
- Canvas-like drawing API
- Active development by Shopify
- Production-ready (used by Shopify, many others)

**Weaknesses:**
- CanvasKit WASM is 2.9MB gzipped (significant initial load)
- No built-in selection/transformation UI (must build custom)
- Requires React Native 0.79+ and React 19+
- Web loading requires special setup (WithSkiaWeb or LoadSkiaWeb)

**Cross-Platform Reality:**
- Same drawing code works on iOS, Android, and Web
- But: No built-in interaction handling (selection, dragging, rotation)
- Must build interaction layer manually

**Verdict:** Best option for true cross-platform rendering, but requires building UI interactions from scratch.

---

#### Alternative RN Options

| Library | Status | Notes |
|---------|--------|-------|
| react-native-canvas | Limited | WebView-based, poor performance |
| react-native-svg | Good for simple | Not suitable for complex interactions |
| expo-gl | WebGL | Too low-level for our needs |

**Verdict:** React Native Skia is the clear winner for native mobile rendering.

---

### 2.3 SVG vs Canvas Decision

| Factor | SVG | Canvas |
|--------|-----|--------|
| Element count | Good up to ~3,000 | Good up to 10,000+ |
| Sharp geometric shapes | ✅ Excellent | ✅ Good (with care) |
| Zoom quality | ✅ Vector, perfect | ⚠️ Requires redraw at new scale |
| Touch interaction | ✅ Native DOM events | ⚠️ Requires hit testing |
| React integration | ✅ Native JSX | ⚠️ Requires library |
| Export to image | ⚠️ Requires conversion | ✅ Native toDataURL |
| Cross-platform | ❌ Web only | ✅ Via Skia |

**Our Scale:** Max 6,400 shapes (10×10 quilt of 8×8 blocks) — manageable for both.

**Decision:** Canvas (via Konva/Skia) for cross-platform consistency and interaction handling.

---

## 3. Cross-Platform Architecture Options

### Option A: Separate Implementations

```
┌─────────────────────────────────────────────────────────────┐
│                         WEB                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Konva.js                          │    │
│  │              (react-konva components)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MOBILE (iOS)                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                React Native Skia                     │    │
│  │              (custom components)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

SHARED (packages/core):
- Block data model (TypeScript)
- Pattern data model (TypeScript)
- Geometry calculations (pure functions)
- Color/fabric logic (pure functions)
- Undo/redo state management
- Validation rules
```

**Pros:**
- Best-in-class library for each platform
- Konva's built-in Transformer for web
- Can optimize each platform independently

**Cons:**
- Two rendering implementations to maintain
- Subtle visual differences possible
- More testing surface area

**Effort:** High initial, medium ongoing

---

### Option B: React Native Skia Everywhere

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB + MOBILE                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Native Skia                       │    │
│  │         (CanvasKit WASM for web)                     │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │        Custom Interaction Layer              │    │    │
│  │  │  - Selection handling                        │    │    │
│  │  │  - Transformer (rotation, resize)            │    │    │
│  │  │  - Touch gesture detection                   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

SHARED (100%):
- All rendering code
- All interaction handling
- Block/Pattern data models
- Geometry calculations
```

**Pros:**
- Single rendering codebase
- Pixel-perfect cross-platform consistency
- All interaction code shared

**Cons:**
- 2.9MB WASM download for web (first load)
- Must build selection/transformer from scratch
- Less mature than Konva for web design tools
- Higher upfront investment

**Effort:** Very high initial, low ongoing

---

### Option C: Shared Logic + Platform Renderers (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                     packages/core                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SHARED BUSINESS LOGIC                   │    │
│  │                                                      │    │
│  │  - BlockModel, PatternModel (data structures)        │    │
│  │  - GeometryEngine (shape math, hit testing)          │    │
│  │  - RenderInstructions (platform-agnostic commands)   │    │
│  │  - InteractionStateMachine (selection, drag, etc.)   │    │
│  │  - UndoManager (command pattern)                     │    │
│  │  - FabricPalette (color management)                  │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ RenderInstructions
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     packages/web        │     │    packages/mobile      │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │   KonvaRenderer   │  │     │  │   SkiaRenderer    │  │
│  │                   │  │     │  │                   │  │
│  │ Interprets render │  │     │  │ Interprets render │  │
│  │ instructions into │  │     │  │ instructions into │  │
│  │ Konva components  │  │     │  │ Skia components   │  │
│  └───────────────────┘  │     │  └───────────────────┘  │
│                         │     │                         │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │ KonvaInteraction  │  │     │  │ SkiaInteraction   │  │
│  │                   │  │     │  │                   │  │
│  │ Maps DOM events   │  │     │  │ Maps touch events │  │
│  │ to shared state   │  │     │  │ to shared state   │  │
│  │ machine           │  │     │  │ machine           │  │
│  └───────────────────┘  │     │  └───────────────────┘  │
└─────────────────────────┘     └─────────────────────────┘
```

**Pros:**
- Best library for each platform (Konva's Transformer, Skia's performance)
- Shared business logic and state management (~70% code share)
- Can test core logic platform-independently
- Easier to start (use Konva's existing features)
- Can migrate to Option B later if needed

**Cons:**
- Two thin rendering adapters
- Small risk of visual inconsistencies (mitigated by shared render instructions)

**Effort:** Medium initial, low ongoing

---

## 4. Detailed Library Comparison

### Selection & Transformation

| Feature | Konva | Fabric.js | Skia | Our Need |
|---------|-------|-----------|------|----------|
| Built-in selection | ✅ Transformer | ✅ Built-in | ❌ Manual | Required |
| Rotation handles | ✅ Customizable | ✅ Built-in | ❌ Manual | Required |
| Rotation outside corner | ⚠️ Custom | ❌ No | ❌ Manual | PRD requirement |
| Flip H/V | ✅ scaleX/Y | ✅ flipX/Y | ✅ scale | Required |
| Snap to angles | ✅ Transformer option | ✅ Options | ❌ Manual | Required (90°) |
| Multi-select | ✅ Transformer | ✅ ActiveSelection | ❌ Manual | Post-MVP |
| Touch dragging | ✅ Built-in | ✅ Built-in | ❌ Manual | Required |

### Touch & Gesture Support

| Feature | Konva | Fabric.js | Skia | Our Need |
|---------|-------|-----------|------|----------|
| Touch events | ✅ Native | ✅ Native | ✅ Native | Required |
| Pinch-to-zoom | ✅ Example code | ⚠️ Manual | ⚠️ Manual | Required |
| Multi-touch | ✅ Supported | ✅ Supported | ✅ Supported | Required |
| Gesture detection | ⚠️ Hammer.js | ⚠️ Manual | ⚠️ Manual | Required |

### Performance Characteristics

| Metric | Konva | Fabric.js | Skia (Web) | Skia (Native) |
|--------|-------|-----------|------------|---------------|
| 1,000 shapes | ✅ 60 FPS | ✅ 60 FPS | ✅ 60 FPS | ✅ 60 FPS |
| 5,000 shapes | ⚠️ 30-60 FPS | ⚠️ 20-40 FPS | ✅ 60 FPS | ✅ 60 FPS |
| Initial load | Fast | Fast | 2.9MB WASM | Fast |
| Memory usage | Medium | Higher | Lower | Lower |

### Developer Experience

| Factor | Konva | Fabric.js | Skia |
|--------|-------|-----------|------|
| TypeScript | ✅ Built-in | ✅ v6 | ✅ Built-in |
| React integration | ✅ react-konva | ⚠️ Wrapper | ✅ Native RN |
| Documentation | ✅ Excellent | ✅ Good | ✅ Good |
| Examples | ✅ Many | ✅ Many | ⚠️ Growing |
| Community | Active | Active | Active |
| GitHub Stars | 11.2k | 30.9k | 7.5k |
| npm weekly | 400k | 500k | 150k |

---

## 5. Recommendation

### Primary Recommendation: Option C (Shared Logic + Platform Renderers)

**Web:** Konva.js via react-konva
**Mobile:** React Native Skia
**Shared:** packages/core with data models, geometry, state machine

### Rationale

1. **Fastest time to MVP on web**: Konva's Transformer provides selection, rotation, and resize out of the box. This saves 2-4 weeks of building custom interaction handling.

2. **Best native mobile experience**: React Native Skia is the gold standard for custom graphics on mobile, with GPU acceleration and identical iOS/Android rendering.

3. **Maximum code sharing**: The shared core package (~70% of logic) can be thoroughly tested independently of platform rendering.

4. **Risk mitigation**: If we find issues with either renderer, we can swap without rewriting business logic.

5. **Future flexibility**: If React Native Skia's web support matures further, we can migrate web to use it too (Option B) with the same shared core.

### Architecture Diagram

```
quillty/
├── packages/
│   ├── core/                      # Shared logic (100% cross-platform)
│   │   ├── src/
│   │   │   ├── models/
│   │   │   │   ├── Block.ts       # Block data structure
│   │   │   │   ├── Pattern.ts     # Pattern data structure
│   │   │   │   └── Palette.ts     # Fabric palette
│   │   │   ├── geometry/
│   │   │   │   ├── shapes.ts      # HST, FlyingGeese geometry
│   │   │   │   ├── grid.ts        # Grid calculations
│   │   │   │   ├── hitTest.ts     # Point-in-shape tests
│   │   │   │   └── transform.ts   # Rotation, flip transforms
│   │   │   ├── render/
│   │   │   │   └── instructions.ts # Platform-agnostic render commands
│   │   │   ├── interaction/
│   │   │   │   ├── stateMachine.ts # Selection, drag, rotate states
│   │   │   │   └── gestures.ts     # Gesture recognition logic
│   │   │   ├── history/
│   │   │   │   └── undoManager.ts  # Command pattern undo/redo
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── web/                       # Web-specific rendering
│   │   ├── src/
│   │   │   ├── renderer/
│   │   │   │   ├── KonvaCanvas.tsx     # Main canvas component
│   │   │   │   ├── KonvaBlock.tsx      # Block rendering
│   │   │   │   ├── KonvaShape.tsx      # Shape primitives
│   │   │   │   └── KonvaTransformer.tsx # Selection UI
│   │   │   ├── hooks/
│   │   │   │   ├── useBlockDesigner.ts
│   │   │   │   └── usePatternDesigner.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── mobile/                    # Mobile-specific rendering
│       ├── src/
│       │   ├── renderer/
│       │   │   ├── SkiaCanvas.tsx      # Main canvas component
│       │   │   ├── SkiaBlock.tsx       # Block rendering
│       │   │   ├── SkiaShape.tsx       # Shape primitives
│       │   │   └── SkiaTransformer.tsx # Selection UI (custom)
│       │   ├── hooks/
│       │   │   ├── useBlockDesigner.ts
│       │   │   └── usePatternDesigner.ts
│       │   └── index.ts
│       └── package.json
│
├── apps/
│   ├── web/                       # Next.js app
│   │   └── ... uses @quillty/web
│   └── mobile/                    # Expo app
│       └── ... uses @quillty/mobile
```

---

## 6. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- [ ] Set up packages/core with TypeScript
- [ ] Implement Block and Pattern data models
- [ ] Implement basic geometry (Square, HST)
- [ ] Implement render instruction format
- [ ] Unit tests for geometry calculations

### Phase 2: Web Renderer (Week 2-3)
- [ ] Set up packages/web with react-konva
- [ ] Implement KonvaCanvas with zoom/pan
- [ ] Implement KonvaShape for primitives
- [ ] Implement KonvaTransformer (customize for Figma-style rotation)
- [ ] Wire up event handling to core state machine

### Phase 3: Block Designer Web (Week 3-4)
- [ ] Template picker UI
- [ ] Shape placement (tap cell → shape picker)
- [ ] Fabric assignment (paint mode)
- [ ] Preview mode (3×3 repeat)
- [ ] Save/publish flow

### Phase 4: Pattern Designer Web (Week 4-5)
- [ ] Block library panel
- [ ] Select-then-place interaction
- [ ] Floating toolbar
- [ ] Resize controls
- [ ] Stats panel

### Phase 5: Mobile Renderer (Week 5-6)
- [ ] Set up packages/mobile with Skia
- [ ] Port rendering from Konva instructions to Skia
- [ ] Implement SkiaTransformer (custom)
- [ ] Touch gesture handling

### Phase 6: Mobile Integration (Week 6-7)
- [ ] Block Designer on mobile
- [ ] Pattern Designer on mobile
- [ ] Cross-platform testing

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Konva Transformer doesn't match PRD exactly | Medium | Low | Customize or build custom transformer layer |
| Skia custom transformer takes longer than expected | Medium | Medium | Start with simpler interaction, iterate |
| Visual inconsistencies between platforms | Low | Medium | Shared render instruction format ensures consistency |
| Performance issues on older devices | Low | Medium | Use layer caching, simplify for performance mode |
| Skia web WASM load time affects UX | Medium | Low | Lazy load, show skeleton, cache aggressively |

---

## 8. Alternative Considered: Full React Native Skia

If we were to go with Option B (Skia everywhere), here's what we'd need to build:

### Custom Transformer Component (~2-3 weeks)

```typescript
// Pseudo-code for custom Skia transformer
interface TransformerProps {
  selected: Shape[];
  onRotate: (angle: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onDelete: () => void;
}

// Would need to implement:
// 1. Bounding box calculation
// 2. Corner handle rendering
// 3. Rotation zone hit detection
// 4. Drag-to-rotate with 90° snap
// 5. Floating toolbar positioning
// 6. Touch and mouse event handling
```

This is significant work but would give us 100% code sharing. **Consider migrating to this approach post-MVP** if maintaining two renderers becomes burdensome.

---

## 9. Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Web rendering | **Konva.js** | Best-in-class selection/transformation, React bindings |
| Mobile rendering | **React Native Skia** | GPU-accelerated, cross-platform, Expo support |
| Architecture | **Shared core + platform renderers** | Balance of code sharing and platform optimization |
| SVG vs Canvas | **Canvas** | Better cross-platform story, sufficient for our scale |
| When to reconsider | Post-MVP | If Skia web matures or maintenance burden is high |

---

## 10. References

### Libraries
- [Konva.js](https://konvajs.org/) - Canvas framework
- [react-konva](https://github.com/konvajs/react-konva) - React bindings
- [React Native Skia](https://shopify.github.io/react-native-skia/) - Mobile graphics
- [Fabric.js](https://fabricjs.com/) - Alternative canvas library

### Research Sources
- [Konva vs Fabric comparison](https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f)
- [Konva performance tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- [React Native Skia web support](https://shopify.github.io/react-native-skia/docs/getting-started/web/)
- [SVG vs Canvas 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025)
- [Rebuilding rotation UX in React Konva](https://dev.to/zhuojg/killing-the-lollipop-rebuilding-rotation-ux-in-react-konva-1lo7)
- [Fabric.js v6 upgrade guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-60/)

---

## Document Info

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial research and recommendation |
