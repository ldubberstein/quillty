# Quilting Technique Reference

Research document cataloguing quilting techniques relevant to the Quillty block designer. Each technique is documented with properties important for software implementation alongside traditional quilting knowledge.

**Source data:** `public-domain-quilt-blocks-summary.csv` (731 public-domain quilt blocks)

## Technique Relationships

```
square (plain patch)
├── hst (Half-Square Triangle) ─── 1 diagonal cut ─── 2 triangles
│   └── qst (Quarter-Square Triangle) ─── 2 diagonal cuts ─── 4 triangles
├── flying_geese ─── 1 large + 2 small triangles in 2:1 rectangle
├── strip_piecing ─── rectangles joined side-by-side
├── diamond_piecing ─── 45° or 60° rotated squares/rhombi
├── curved_piecing ─── arcs and curves (Drunkard's Path, Orange Peel, etc.)
├── applique ─── fabric shapes applied on top of background
├── paper_piecing ─── fabric sewn onto printed paper templates
│   └── foundation_piecing ─── variant using reusable foundations
├── english_paper_piecing ─── hand-sewn over paper templates (often hexagons)
└── folded_fabric ─── 3D folded elements (prairie points, cathedral windows)
```

QST is a direct derivative of HST. A QST unit is traditionally constructed by combining two HST units and cutting diagonally in the opposite direction. This is why the CSV dataset does not list QST as a separate technique — blocks using QST are categorized under `hst`. In the Quillty software, QST is a distinct unit primitive because its geometry (4 triangles meeting at center) differs fundamentally from HST (2 triangles on a diagonal).

---

## Property Schema

Each technique section below documents the following properties:

| Property | Description | Why Software Needs It |
|---|---|---|
| **Technique ID** | Machine identifier (e.g., `hst`) | Database key, unit type discriminator |
| **Display Name** | Human-readable name | UI labels |
| **Description** | What the technique is and how it works | Tooltips, help text |
| **Relationship** | Parent/child/sibling techniques | Unit picker organization |
| **Grid Span** | How many cells the unit occupies (e.g., 1×1, 1×2) | Layout engine collision detection |
| **Span Consistent?** | Whether span is always the same or varies by variant | Placement validation logic |
| **Independently Colorable Patches** | Named sub-regions with independent fabric roles | Palette system, fabric role assignment |
| **Geometric Variants** | Distinct orientations/configurations | Unit picker options, preset selection |
| **Symmetry Type** | Rotational and reflective symmetry | Determines distinct rotation states |
| **Rotation Behavior** | How 90° rotation is achieved | Store transform operations |
| **Flip Behavior (H/V)** | What horizontal/vertical flip does | Store transform operations |
| **Placement Mode** | UI interaction: single-tap, two-tap, drag | Placement state machine |
| **Batch Placement** | Whether shift-click fill is supported | UI feature flag |
| **Has Curves** | Whether technique involves curved seams | Rendering path: polygon vs arc/bezier |
| **Physical Construction** | How a quilter makes this unit | Sizing formulas, help content |
| **Sizing Formula** | Cut size from finished size | Future: cut list generation |
| **Common Finished Sizes** | Typical dimensions in inches | Default presets |
| **Grain Line Notes** | Bias edges, stretch risk | Future: construction guidance |
| **Difficulty** | Beginner / Intermediate / Advanced | Filtering, progressive disclosure |
| **Sub-variations** | Shapes, sizes, methods within technique | Whether variants are needed |
| **Prevalence** | Count of blocks using this technique in dataset | Implementation prioritization |
| **Implementation Status** | Current state in Quillty codebase | Tracking |

---

## Section Guide

Each technique is documented under five standard sections. The goal is to capture enough detail during research that implementation can proceed without guesswork.

### Identity

Establishes *what* the technique is: name, ID, description, lineage to related techniques, prevalence in the dataset, difficulty, and implementation status. This drives prioritization and unit-picker organization.

Key question: *How does this technique relate to others, and how important is it?*

### Software Properties

Defines *how the unit behaves* in the block designer: grid span, colorable regions, geometric variants, symmetry, rotation/flip behavior, placement interaction mode, and batch support. This section directly drives the unit's state model, store operations, and UI interactions.

Key question: *What does the store need to track, and what user interactions does the unit support?*

### Geometry

Specifies the *exact geometric definitions*: points, lines, arcs, or curves that define the unit's regions within a cell. Should include ASCII diagrams of all variants, coordinate calculations, and rendering notes (polygon vs. bezier path). This section drives the rendering engine.

Key question: *Given a cell's pixel dimensions, what are the exact paths to draw?*

### Physical Construction

Documents *how a quilter physically makes this unit*: construction methods, sizing formulas (cut size from finished size), common finished sizes, and grain line considerations. This informs help content, sizing presets, and future cut-list generation.

Key question: *What does a quilter need to know to actually produce this unit?*

### Sub-variations

Catalogs *distinct variants within the technique* that may require separate software treatment — different configurations, construction methods, or sub-types. This determines whether one shape implementation suffices or whether multiple variants need separate geometry, state, or UI handling.

Key question: *Are there meaningfully different forms of this technique that need distinct implementation?*

### References

Links core references for understanding the block's behavior — authoritative quilting tutorials, geometry explanations, or construction guides. Max 3 per technique. Prioritize references that clarify geometry or construction details relevant to software implementation over general quilting content.

---

## HST (Half-Square Triangle)

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `hst` |
| **Display Name** | Half-Square Triangle |
| **Abbreviation** | HST |
| **Description** | A square divided by a single diagonal line into two right triangles. The most fundamental and versatile piecing unit in quilting — nearly every traditional block uses HSTs. |
| **Relationship** | Parent of QST. Sibling to Flying Geese (which uses HST-like triangles in a 2:1 rectangle). |
| **Prevalence** | 482 of 731 blocks (66%) |
| **Difficulty** | Beginner |
| **Implementation Status** | Fully implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | 1×1 (always) |
| **Span Consistent?** | Yes — always occupies exactly 1 cell |
| **Independently Colorable Patches** | 2: `primary` (triangle filling the named corner), `secondary` (opposite triangle) |
| **Geometric Variants** | 4 orientations: `nw` (◸), `ne` (◹), `sw` (◺), `se` (◿) — named by which corner the primary triangle fills |
| **Symmetry Type** | None per-unit (each variant is asymmetric). The 4 variants form a complete set under rotation. |
| **Rotation Behavior** | Variant cycling: `nw → ne → se → sw → nw` (90° clockwise) |
| **Flip Behavior (H)** | Swap left/right: `nw ↔ ne`, `sw ↔ se` |
| **Flip Behavior (V)** | Swap top/bottom: `nw ↔ sw`, `ne ↔ se` |
| **Placement Mode** | Single-tap (select variant in unit picker, click cell to place) |
| **Batch Placement** | Yes — shift-click fills rectangular range |
| **Has Curves** | No |

### Geometry

The diagonal divides a square cell into two right triangles. Each variant determines which diagonal is used and which triangle is "primary":

```
nw (◸)              ne (◹)              sw (◺)              se (◿)
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│╲ primary │         │ primary╱│         │╱secondary│         │secondary╲│
│  ╲       │         │      ╱  │         │  ╱       │         │       ╲  │
│    ╲     │         │    ╱    │         │╱         │         │         ╲│
│      ╲   │         │  ╱     │         │ primary  │         │  primary │
│secondary╲│         │╱secondary         │         │         │         │
└─────────┘         └─────────┘         └─────────┘         └─────────┘
```

**Triangle calculation** (from `geometry/hst.ts`):
- Each variant returns two triangles defined by 3 points each
- Points use pixel coordinates: `(0,0)` = top-left, `(width, height)` = bottom-right
- The diagonal always connects two opposite corners
- Rendered as Konva `Line` with `closed={true}`

### Physical Construction

**Traditional method (2-at-a-time):**
1. Cut two squares of contrasting fabric
2. Place right sides together
3. Draw diagonal line on wrong side of lighter fabric
4. Sew 1/4" seam on both sides of drawn line
5. Cut on drawn line → yields 2 HST units
6. Press seam toward darker fabric, trim to size

**Sizing formula:**
- `Cut size = Finished size + 7/8"` (traditional, exact)
- `Cut size = Finished size + 1"` (common practice, trim to size for accuracy)
- Example: For a 3" finished HST, cut two 3-7/8" squares (or 4" and trim)

**8-at-a-time method:**
- `Cut size = (Finished size × 2) + 2"`
- Yields 8 HSTs from 2 large squares

**Common finished sizes:** 1", 1.5", 2", 2.5", 3", 3.5", 4", 5", 6"

**Grain line notes:**
- Traditional 2-at-a-time: outer edges are on grain (stable)
- 4-at-a-time and 8-at-a-time: outer edges are on bias (stretch risk, requires careful handling)
- Always press and square-up HST units before incorporating into blocks

### Sub-variations

None. HST is a fundamental piecing unit — its 4 orientations (`nw`, `ne`, `sw`, `se`) are already represented as geometric variants in Software Properties. The different construction methods (2-at-a-time, 4-at-a-time, 8-at-a-time) produce identical finished units and do not affect the software shape. No additional variant types are needed.

### References

- [How to Make the Perfect Half Square Triangle](https://www.generations-quilt-patterns.com/half-square-triangle.html) — Geometry, diagonal cut mechanics, and construction methods
- [HST Tutorial and Maths Formula](https://www.blossomheartquilts.com/2012/07/hst-tutorial-and-maths-formula/) — Sizing formulas (7/8" rule) and 8-at-a-time method math
- [All About Half Square Triangles (without bias edges)](https://slightlybiasedquilts.com/2021/02/all-about-half-square-triangles-how-to-make-them-without-bias-edges.html) — Grain line differences across construction methods

### Quillty Implementation Files

| File | Purpose |
|---|---|
| `packages/core/src/block-designer/types.ts` | `HstUnit` interface, `HstVariant` type |
| `packages/core/src/block-designer/schemas.ts` | `HstUnitSchema`, `HstVariantSchema` |
| `packages/core/src/block-designer/geometry/hst.ts` | `getHstTriangles()`, `triangleToFlatPoints()`, `HST_VARIANT_INFO` |
| `packages/core/src/block-designer/store.ts` | `addHst()`, rotation/flip logic |
| `apps/web/src/components/block-designer/BlockCanvas.tsx` | HST rendering on canvas |
| `apps/web/src/components/block-designer/ShapeThumbnail.tsx` | HST variant options in unit picker |

---

## QST (Quarter-Square Triangle)

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `qst` |
| **Display Name** | Quarter-Square Triangle |
| **Abbreviation** | QST |
| **Description** | A square divided by both diagonals into four right triangles meeting at the center point. Creates an X or hourglass pattern depending on coloring. Derived from HST — traditionally made by combining two HST units. |
| **Relationship** | Child of HST. A QST is geometrically equivalent to two HSTs overlaid with perpendicular diagonals. |
| **Prevalence** | Not tracked separately in dataset (subsumed under `hst`'s 482 count). Common in pinwheel, hourglass, and broken dishes blocks. |
| **Difficulty** | Beginner–Intermediate |
| **Implementation Status** | Fully implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | 1×1 (always) |
| **Span Consistent?** | Yes — always occupies exactly 1 cell |
| **Independently Colorable Patches** | 4: `top`, `right`, `bottom`, `left` — named by compass direction from center |
| **Geometric Variants** | None. The geometry is always the same (both diagonals, 4 triangles at center). Visual variety comes entirely from how the 4 parts are colored. |
| **Symmetry Type** | 2-fold rotational symmetry (180° rotation of geometry is identical). Also has both diagonal mirror symmetries and both axial mirror symmetries. |
| **Rotation Behavior** | Color cycling (not variant cycling): `top → right → bottom → left → top` (90° clockwise). Because geometry is fixed, rotation moves the colors around the shape. |
| **Flip Behavior (H)** | Swap `left ↔ right` (top and bottom unchanged) |
| **Flip Behavior (V)** | Swap `top ↔ bottom` (left and right unchanged) |
| **Placement Mode** | Single-tap (click cell to place, then color individual parts) |
| **Batch Placement** | Yes — shift-click fills rectangular range |
| **Has Curves** | No |

### Geometry

Both diagonals of the square divide it into 4 triangles, all meeting at the center point:

```
┌─────────────────┐
│╲      top      ╱│
│  ╲           ╱  │
│    ╲       ╱    │
│      ╲   ╱      │
│ left   ╳  right │
│      ╱   ╲      │
│    ╱       ╲    │
│  ╱           ╲  │
│╱    bottom     ╲│
└─────────────────┘
```

**Triangle calculation** (from `geometry/qst.ts`):
- Center point: `cx = width/2`, `cy = height/2`
- Top triangle: `(0,0) → (width,0) → (cx,cy)`
- Right triangle: `(width,0) → (width,height) → (cx,cy)`
- Bottom triangle: `(width,height) → (0,height) → (cx,cy)`
- Left triangle: `(0,height) → (0,0) → (cx,cy)`
- All 4 triangles share the center point as one vertex

### Why No Variants?

Unlike HST (which has 4 geometrically distinct orientations), QST's geometry is invariant under rotation — cutting both diagonals produces the same physical shape regardless of orientation. The visual patterns (hourglass, pinwheel, bowtie) are achieved entirely through color assignment:

| Pattern | Top | Right | Bottom | Left |
|---|---|---|---|---|
| Hourglass | A | B | A | B |
| Pinwheel (CW) | A | B | C | D |
| Bowtie | A | B | A | B |
| X pattern | A | B | A | B |
| Solid | A | A | A | A |

Rotation of a QST is equivalent to cycling the color assignments, which is why the store implements rotation as `{ top: left, right: top, bottom: right, left: bottom }` rather than changing a variant enum.

### Physical Construction

**Method 1: From two HST units (most common)**
1. Make 2 oversized HST units using contrasting fabrics
2. Place HSTs right sides together with seams nested (opposite color triangles facing)
3. Draw diagonal perpendicular to existing seam
4. Sew 1/4" on both sides of drawn line
5. Cut on line → yields 2 QST units
6. Press and trim to size

**Sizing formula (from HST method):**
- `HST cut size = Finished QST size + 1-1/4"` (yields oversized HSTs to trim)
- `Cut size = Finished size + 1-1/4"` (for the initial squares before making HSTs)
- Example: For a 4" finished QST, cut initial squares at 5-1/4"

**Method 2: From 4 individual triangles (traditional)**
1. Cut a square, then cut on both diagonals to yield 4 quarter-square triangles
2. The long side (hypotenuse) of each triangle is on the straight grain
3. Sew 4 triangles together, matching at center point

**Sizing formula (from individual triangles):**
- `Cut size = Finished size + 1-1/4"`
- Each square yields 4 triangles

**Key difference from HST grain line:**
- HST: short sides of triangle are on the outer edge → straight grain on outside (stable)
- QST: long side (hypotenuse) of triangle is on the outer edge → straight grain on outside (stable)
- This grain line difference is the defining geometric distinction between HST and QST triangles

**Common finished sizes:** 2", 3", 4", 5", 6"

**Grain line notes:**
- Method 1 (from HSTs): Bias edges are internal, straight grain on outer edges — preferred method for stability
- Method 2 (individual triangles): Requires careful handling of bias-cut edges during assembly
- QST units have a center seam intersection (4 seams meeting) which adds bulk — press seams open or use a pinwheel press

### Sub-variations

None. QST is a fundamental piecing unit with fixed geometry (both diagonals, 4 triangles meeting at center). Visual variety comes entirely from color assignment — see the coloring patterns table in "Why No Variants?" above. The two construction methods (from HSTs vs. from individual triangles) produce identical finished units. No additional variant types are needed.

### References

- [Quarter Square Triangles: The Complete Guide](https://www.bonjourquilts.com/quarter-square-triangles/) — QST geometry, both construction methods, and sizing formulas
- [Half Square Triangles and Quarter Square Triangles](https://www.guidelines4quilting.com/pages/half-square-triangles-and-quarter-square-triangles) — HST vs QST grain line differences and geometric distinctions
- [Quilt Block Basics: Quarter Square Triangles](https://villarosaquilts.com/2023/04/20/quilt-block-basics-quarter-square-triangles-qsts/) — Step-by-step construction from HSTs with trimming guidance

### Quillty Implementation Files

| File | Purpose |
|---|---|
| `packages/core/src/block-designer/types.ts` | `QstUnit` interface, `QstPatchId` type, `QstPatchRoles` interface |
| `packages/core/src/block-designer/schemas.ts` | `QstUnitSchema`, `QstPatchRolesSchema`, `QstPatchIdSchema` |
| `packages/core/src/block-designer/geometry/qst.ts` | `getQstTriangles()` |
| `packages/core/src/block-designer/geometry/qst.test.ts` | Geometry unit tests |
| `packages/core/src/block-designer/store.ts` | `addQst()`, rotation (color cycling), flip logic |
| `packages/core/src/block-designer/store.test.ts` | Store operation tests for QST |
| `apps/web/src/components/block-designer/QstRenderer.tsx` | QST rendering component |
| `apps/web/src/components/block-designer/BlockCanvas.tsx` | QST case in canvas rendering |
| `apps/web/src/components/block-designer/ShapeThumbnail.tsx` | QST option in unit picker |
| `apps/web/src/components/pattern-designer/BlockInstanceRenderer.tsx` | QST rendering in patterns |
| `apps/web/src/components/pattern-designer/BlockThumbnail.tsx` | QST rendering in block library |

---

## Strip Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `strip_piecing` |
| **Display Name** | Strip Piecing |
| **Description** | A square cell divided into N parallel rectangular strips of equal width. Strips run either horizontally or vertically, and each strip is independently colorable. This is the most common rectangular subdivision technique — used in Rail Fence, Nine Patch strip sets, Album blocks, and many other traditional patterns. The term "strip piecing" in quilting also refers to a broader construction *method* (sewing long strips into sets, then cross-cutting), but in the block designer it represents the resulting geometric unit. |
| **Relationship** | Standalone technique. Sibling to HST (both subdivide a single cell into colorable regions). The construction method overlaps with Log Cabin, but Log Cabin's spiral geometry makes it a separate unit type. |
| **Prevalence** | 99 of 731 blocks (14%) — the second most common technique after HST. Dataset blocks are overwhelmingly Nine Patch and Four Patch grid types at beginner difficulty with 2–4 colors. |
| **Difficulty** | Beginner |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | 1×1 (always) |
| **Span Consistent?** | Yes — always occupies exactly 1 cell. The strips subdivide the cell internally. |
| **Independently Colorable Patches** | Equal to the number of strips: 2-strip has 2 patches, 3-strip has 3 patches. Patches are named positionally: for horizontal strips `strip1` (top) through `stripN` (bottom); for vertical strips `strip1` (left) through `stripN` (right). |
| **Geometric Variants** | Defined by orientation × strip count: `h2` (horizontal, 2 strips), `h3` (horizontal, 3 strips), `v2` (vertical, 2 strips), `v3` (vertical, 3 strips). Optionally `h4`/`v4` for 4-strip units. **Design note:** different strip counts have different numbers of colorable patches — this is a new pattern not present in HST/QST/Flying Geese (where patch count is fixed). This may warrant treating each strip count as a separate unit rather than variants of one unit. |
| **Symmetry Type** | Bilateral symmetry along the axis parallel to the strips. A horizontal 3-strip has mirror symmetry on the vertical axis (left–right). Rotating 180° preserves geometry but reverses strip order. |
| **Rotation Behavior** | 90° CW rotation swaps orientation (h↔v) and reverses strip order: `h3{strip1,strip2,strip3}` → `v3{strip3,strip2,strip1}`. This is because the top strip becomes the rightmost column after rotation, which is `strip3` in left-to-right naming. |
| **Flip Behavior (H)** | Horizontal flip mirrors across the vertical axis. For **horizontal** strips: no change (strips are horizontal bands — left–right mirror has no effect). For **vertical** strips: reverses strip order (`strip1 ↔ stripN`). |
| **Flip Behavior (V)** | Vertical flip mirrors across the horizontal axis. For **horizontal** strips: reverses strip order (`strip1 ↔ stripN`). For **vertical** strips: no change (strips are vertical bands — top–bottom mirror has no effect). |
| **Placement Mode** | Single-tap (select variant in unit picker, click cell to place) |
| **Batch Placement** | Yes — shift-click fills rectangular range |
| **Has Curves** | No |

### Geometry

Each variant divides a square cell into N equal-width parallel rectangles. The dividing lines are evenly spaced along the axis perpendicular to the strip direction.

**2-strip horizontal (h2):**

```
┌─────────────────┐
│                  │
│     strip1       │
│                  │
├──────────────────┤
│                  │
│     strip2       │
│                  │
└─────────────────┘
```

**3-strip horizontal (h3):**

```
┌─────────────────┐
│     strip1       │
├──────────────────┤
│     strip2       │
├──────────────────┤
│     strip3       │
└─────────────────┘
```

**2-strip vertical (v2):**

```
┌────────┬────────┐
│        │        │
│ strip1 │ strip2 │
│        │        │
└────────┴────────┘
```

**3-strip vertical (v3):**

```
┌─────┬──────┬─────┐
│     │      │     │
│ s1  │  s2  │ s3  │
│     │      │     │
└─────┴──────┴─────┘
```

**Rectangle calculation (general formula):**
- **Horizontal, N strips:** `strip_i` = rectangle from `(0, (i-1) × height/N)` to `(width, i × height/N)`
- **Vertical, N strips:** `strip_i` = rectangle from `((i-1) × width/N, 0)` to `(i × width/N, height)`
- Points use pixel coordinates: `(0,0)` = top-left, `(width, height)` = bottom-right
- Rendered as Konva `Rect` or `Line` with `closed={true}`

### Physical Construction

**Standard strip piecing method:**
1. Cut fabric strips to the calculated width (see sizing formula below)
2. Sew strips together lengthwise using a scant 1/4" seam
3. Press seams to one side (toward darker fabric) or press open to reduce bulk
4. Cross-cut the assembled strip set into square units at the desired finished size + 1/2"
5. Trim and square up each unit

**Sizing formula:**
- `Strip cut width = (Finished unit size / N) + 1/2"` where N = number of strips
- Example: For a 3" finished 3-strip unit → each strip is cut at 1-1/2" wide (1" finished + 1/2" seam allowance)
- `Cross-cut width = Finished unit size + 1/2"`

**Common finished sizes:** 1", 1.5", 2", 2.5", 3", 4", 6"

**Grain line notes:**
- Strips are cut on the straight grain (parallel to selvage) — all edges are on grain, no bias
- This makes strip piecing the most dimensionally stable of all piecing techniques
- Press seams in alternating directions across strip sets to allow seam nesting during block assembly
- When pressing, use a dry iron with firm pressure to avoid stretching

### Sub-variations

**Equal-width strips (the core unit)** — 2, 3, or 4 equal parallel strips in horizontal or vertical orientation. This covers Rail Fence, Album blocks, Nine Patch strip elements, Brickwork, and most of the 99 blocks in the dataset. This is what the `strip_piecing` unit should implement.

**Unequal-width strips** — Strips of varying widths within a single cell (e.g., Chinese Coins, some Courthouse Steps elements). Would require a different patch definition where each strip has an independent width parameter. Not needed for initial implementation — could be a future variant or separate unit.

**The following are sometimes categorized under "strip piecing" because they use strip piecing as a construction *method*, but they are geometrically distinct shape types requiring their own implementations:**

| Variation | Why It's Separate |
|---|---|
| **Log Cabin** | Strips spiral around a center square in sequential order — fundamentally different topology from parallel strips. Requires ordered/spiral placement logic. |
| **Courthouse Steps** | Symmetric variant of Log Cabin — strips added in opposing pairs around a center. Same spiral topology issue. |
| **Bargello** | Variable-width cross-cuts from strip sets, offset vertically to create wave patterns. This is a quilt-level composition pattern, not a block-level shape. |
| **Seminole** | Angled (45°) cuts through strip sets producing parallelograms — non-rectangular geometry requiring a different primitive entirely. |

These should be tracked as separate technique entries if/when prioritized for implementation.

### References

- [Strip Piecing Quilts 101](https://www.diaryofaquilter.com/strip-piecing-basics/) — Fundamental technique: cutting, sewing, pressing, and cross-cutting strip sets
- [Rail Fence Quilt Blocks — a Strip Piecing Tutorial](https://newquilters.com/rail-fence-quilt-blocks-strip-piecing-tutorial/) — Rail Fence construction with 2–6 strips, sizing, and contrast guidance
- [Quarter Inch Seam Allowance](https://www.generations-quilt-patterns.com/seam-allowance.html) — Seam allowance precision and the "scant 1/4" concept critical to strip accuracy

---

## Appliqué

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `applique` |
| **Display Name** | Appliqué |
| **Description** | Fabric shapes layered ON TOP of a background fabric and stitched down — fundamentally different from piecing, where shapes are joined edge-to-edge. Appliqué unlocks organic forms (curves, circles, leaves, flowers) that are impossible with piecing alone. The background fabric is always a separate piece beneath the applied shapes. In the dataset, appliqué blocks are overwhelmingly floral/nature themes on nine_patch grids with 4-fold rotational symmetry. |
| **Relationship** | Standalone technique, distinct from all piecing techniques. Often combined with HST (14 blocks in dataset) or curved piecing (5 blocks). The combination of appliqué + piecing creates blocks where some cells are pieced and others carry appliqué motifs on top of the grid. |
| **Prevalence** | 90 of 731 blocks (12%) — the third most common technique. Dataset breakdown: 94% nine_patch grid, 77% rotational_4 symmetry, 72% use 4 colors, 79% advanced difficulty, 0% beginner. |
| **Difficulty** | Advanced |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | Not grid-cell-based. Appliqué motifs are positioned within the block by coordinates, not by occupying grid cells. The underlying block may use a grid (nine_patch) for pieced elements, but appliqué shapes float on top of the grid as an overlay layer. **Design note:** this is a fundamentally different placement model from all other units, which occupy specific grid cells. |
| **Span Consistent?** | N/A — appliqué shapes are sized and positioned freely, not snapped to cells. |
| **Independently Colorable Patches** | Variable per motif. At minimum: 1 background + 1 motif patch. Complex blocks have multiple overlapping layers (e.g., stem + leaves + petals + flower center). Typical dataset blocks use 3–4 colors total. Each appliqué piece and the background are independently colorable. |
| **Geometric Variants** | Not orientation-based like HST. Variants are **motif templates** — distinct outlines (circle, heart, leaf, petal, stem, etc.) rather than rotations of one geometry. Each template is a separate path definition. |
| **Symmetry Type** | Block-level: 77% of dataset blocks have rotational_4 symmetry (motif repeated/rotated in each quadrant). Motif-level: individual shapes may have bilateral symmetry (leaf, heart) or radial symmetry (flower, circle), or be asymmetric. |
| **Rotation Behavior** | Free rotation — not limited to 90° increments. Motifs can be rotated to any angle. For blocks with rotational_4 symmetry, the motif in each quadrant is rotated 90° from the previous. |
| **Flip Behavior (H)** | Mirrors the motif shape. Relevant for asymmetric motifs (e.g., a leaf curving left becomes a leaf curving right). Symmetric motifs (circles, hearts) are unchanged by flip. |
| **Flip Behavior (V)** | Same as H flip but on the other axis. Relevant for the same asymmetric motifs. |
| **Placement Mode** | Template placement: select a motif template, then position, scale, and rotate within the block. **Design note:** this requires a different interaction model than the tap-to-place system used by piecing units — likely drag-to-position with handles for scale/rotate. |
| **Batch Placement** | No — each appliqué piece is individually positioned. However, symmetry tools (replicate motif with rotational_4 symmetry) would automate the most common pattern. |
| **Has Curves** | Yes — curves are the defining characteristic. Most appliqué shapes use bezier curves or arcs, not straight lines. Rendering requires SVG-style paths, not simple polygons. |

### Geometry

Appliqué geometry is fundamentally different from piecing geometry. Rather than subdividing a cell into regions with straight cuts, appliqué defines **closed curved paths** that are layered on a background.

**Rendering model:**

```
┌─────────────────────────┐
│                         │
│    ╭───╮    background  │  Layer 0: Background (full cell/block)
│   ╱     ╲              │
│  │  ●●●  │  ← motif    │  Layer 1+: Appliqué motifs (on top)
│   ╲     ╱              │
│    ╰───╯               │
│                         │
└─────────────────────────┘
```

**Key differences from piecing units:**

| Aspect | Piecing (HST, QST, etc.) | Appliqué |
|---|---|---|
| **Primitives** | Straight-line polygons (triangles, rectangles) | Curved paths (bezier, arcs, freeform) |
| **Positioning** | Grid-cell-based (`position: {row, col}`) | Coordinate-based (`position: {x, y}` within block) |
| **Coverage** | Units tile the cell completely (no gaps) | Motifs float on background (gaps show background) |
| **Layering** | No overlap — units subdivide the cell | Overlapping — z-order determines visibility |
| **Path definition** | Computed from cell dimensions + variant | Defined by template path data (SVG-like) |

**Common motif geometries:**

- **Circle/oval** — Single arc path. Used for berries, dots, flower centers.
- **Heart** — Two symmetric arcs meeting at a point. Bilateral symmetry.
- **Leaf** — Pointed oval with optional center vein line. Bilateral symmetry.
- **Petal** — Teardrop or rounded shape. Often arranged radially to form flowers.
- **Stem/vine** — Thin curved strip (bias tape). Can follow any path.
- **Flower (composite)** — Multiple petals arranged around a center circle. Radial symmetry.

**Path representation:** Motif templates should be defined as normalized SVG-like paths (coordinates in 0–1 range) that are scaled to the desired size at render time. This allows templates to be resolution-independent.

### Physical Construction

**Standard appliqué method (needle-turn):**
1. Trace template shape onto fabric wrong side
2. Cut fabric with seam allowance beyond traced line
3. Position shape on background fabric
4. Using the needle tip, turn seam allowance under along the traced line
5. Stitch with small, invisible appliqué stitches (blind hem stitch)
6. Press flat

**Fusible/raw-edge method:**
1. Trace template onto paper-backed fusible web (note: trace mirror image)
2. Fuse web to wrong side of appliqué fabric
3. Cut on traced line — no seam allowance needed
4. Peel paper backing, position on background, fuse with iron
5. Machine stitch around edges (blanket stitch, zigzag, or straight stitch)

**Seam allowances:**
- Needle-turn: `3/16"` (smaller than piecing — less bulk to turn)
- Fusible/raw-edge: `0"` (cut on the line — no turn)
- Standard piecing: `1/4"` (for any pieced portions of the block)

**Sizing:** Appliqué motifs do not follow fixed sizing formulas like pieced units. Size is proportional to the block — a motif in a 12" block is roughly twice the size of the same motif in a 6" block. Templates are drawn at actual finished size.

**Common finished block sizes:** 12" (standard), 6" (mini), 18" (large). Individual motifs within blocks range from 1"–8" depending on the design.

**Grain line notes:**
- Background fabric should be cut on grain for stability
- Appliqué pieces: grain line is less critical when using fusible web (adhesive stabilizes the fabric)
- For needle-turn: convex curves are easier to turn than concave curves; place grain line along the longest dimension of the motif
- Stems/vines are cut on the bias (45°) for flexibility around curves

### Sub-variations

**Construction method variations (geometrically identical results — same shape, different edge treatment):**

| Method | Edge Treatment | Seam Allowance | Software Impact |
|---|---|---|---|
| **Needle-turn** | Turned under, hand-stitched | 3/16" | None — same finished shape |
| **Fusible (turned-edge)** | Turned under, fused + stitched | 1/4" | None — same finished shape |
| **Raw-edge** | Unfinished, machine-stitched | 0" | None — same finished shape |

These share identical geometry. The construction method only affects template generation (different seam allowances for cutting templates) and does not require separate software shapes.

**Geometrically distinct variations (require separate modeling):**

| Variation | How It Differs | Software Implication |
|---|---|---|
| **Reverse appliqué** | Top layer is CUT AWAY to reveal layer beneath — a subtraction model instead of addition. The visible region is a hole in the top fabric. | Requires inverted rendering: the "cutout" is what's removed, not what's added. Layer hierarchy with cutout masking. |
| **Hawaiian appliqué** | Single large motif cut from folded fabric (4-fold or 8-fold), creating enforced radial symmetry. Covers most of the block. | Could be modeled as a symmetry-constrained design mode: user draws 1/4 or 1/8 of the motif, software mirrors it. |
| **Stained glass appliqué** | Colored fabric regions separated by bias tape "leading" lines, mimicking stained glass windows. Two-layer system: color regions + divider lines. | Requires a linear path element (bias tape) as a separate layer on top of colored regions. |

**Scope for initial implementation:** Standard appliqué (additive, template-based motifs on a background) covers the vast majority of the 90 blocks in the dataset. Reverse, Hawaiian, and stained glass are niche variations that can be deferred.

### References

- [Appliqué vs. Piecing](https://sherriquiltsalot.com/2019/08/21/applique-vs-piecing/) — Core distinction between appliqué and piecing, when to use each
- [Raw Edge Appliqué Tutorial](https://suzyquilts.com/raw-edge-applique-tutorial/) — Fusible/raw-edge method with detailed construction steps and seam allowance guidance
- [Stained Glass Appliqué](https://kathykwylie.com/2013/10/stained-glass-applique/) — Bias tape technique showing the geometrically distinct stained glass variation

---

## Curved Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `curved_piecing` |
| **Display Name** | Curved Piecing |
| **Description** | Two fabric pieces joined edge-to-edge along a curved seam, so they tile completely with no gaps. One piece has a convex (outward-bowing) curve, the other has a matching concave (inward) curve. Unlike appliqué (which layers shapes on top of a background), curved piecing divides a cell into two interlocking regions — the "curved HST." The dominant pattern is the Drunkard's Path: a quarter-circle arc dividing a square into a convex pie piece and a concave L-shape. |
| **Relationship** | Sibling to HST — both divide a 1×1 cell into 2 colorable parts with 4 orientations, but curved piecing uses an arc instead of a straight diagonal. Distinct from appliqué (edge-to-edge vs. layered). Sometimes combined with appliqué (5 blocks) or HST (1 block) in the dataset. |
| **Prevalence** | 36 of 731 blocks (5%). Dataset breakdown: 64% "other" grid type, 25% nine_patch. 78% rotational_4 symmetry. 78% intermediate, 22% advanced, 0% beginner. Most blocks use 2–3 colors. The Drunkard's Path family (Drunkard's Path, Rob Peter to Pay Paul, Wonder of the World, Fool's Puzzle, Hearts and Gizzards, etc.) accounts for roughly half of all curved piecing blocks — all 16 pieces, 2 colors. Fan variations are the other major group (asymmetric, 4–5 colors). |
| **Difficulty** | Intermediate |
| **Implementation Status** | Not implemented |

### Software Properties

The properties below describe the **Drunkard's Path unit** — the fundamental curved piecing unit and the clear implementation target. Other curved patterns (Fan, Double Wedding Ring, Orange Peel) are documented under Sub-variations.

| Property | Value |
|---|---|
| **Grid Span** | 1×1 (always) |
| **Span Consistent?** | Yes — always occupies exactly 1 cell. The arc divides the cell into two interlocking pieces. |
| **Independently Colorable Patches** | 2: `pie` (convex quarter-circle piece) and `background` (concave L-shape). Named by geometry, not position, since the "pie" is always the smaller curved piece regardless of which corner it occupies. |
| **Geometric Variants** | 4 orientations: `nw`, `ne`, `sw`, `se` — named by which corner the pie (quarter-circle) fills. Identical naming convention to HST. |
| **Symmetry Type** | None per-unit (each variant is asymmetric). The 4 variants form a complete set under rotation — identical behavior to HST. |
| **Rotation Behavior** | Variant cycling: `nw → ne → se → sw → nw` (90° CW). Same cycle as HST. |
| **Flip Behavior (H)** | Swap left/right: `nw ↔ ne`, `sw ↔ se`. Same as HST. |
| **Flip Behavior (V)** | Swap top/bottom: `nw ↔ sw`, `ne ↔ se`. Same as HST. |
| **Placement Mode** | Single-tap (select variant in unit picker, click cell to place) |
| **Batch Placement** | Yes — shift-click fills rectangular range |
| **Has Curves** | Yes — the defining characteristic. Rendering requires arc/bezier path, not straight-line polygon. |

### Geometry

A quarter-circle arc divides the cell into two pieces. The arc's center is at one corner of the cell, and the arc sweeps 90° between the two adjacent edges.

**Arc parameters:**
- **Center:** The corner specified by the variant (e.g., `nw` → top-left corner at `(0, 0)`)
- **Radius:** A fraction of the cell width. Typical ratio: `r = 0.6W` to `r = 0.7W` where `W` = cell width. **Design note:** the exact ratio could be fixed or configurable; `r ≈ 0.667W` (2/3) is a common traditional proportion.
- **Arc sweep:** 90° — from one adjacent edge to the other

**Variant diagrams (nw and ne shown — sw and se are vertical mirrors):**

```
nw (pie in top-left)          ne (pie in top-right)
┌────╮                        ╭────┐
│ pie ╲                      ╱ pie │
│      ╲                    ╱      │
│       ╲                  ╱       │
│        ╲ background     ╱        │
│         ╲              ╱         │
│  background ╲        ╱ background│
└─────────────┘        └───────────┘
```

**Path calculation for `nw` variant (pie in top-left):**
- Arc center: `(0, 0)`
- Arc radius: `r` (e.g., `0.667 × width`)
- **Pie piece:** Move to `(r, 0)` → arc CW to `(0, r)` → line to `(0, 0)` → close
- **Background (L-shape):** Move to `(r, 0)` → line to `(width, 0)` → line to `(width, height)` → line to `(0, height)` → line to `(0, r)` → arc CCW to `(r, 0)` → close

**Path calculation for `ne` variant (pie in top-right):**
- Arc center: `(width, 0)`
- **Pie piece:** Move to `(width - r, 0)` → arc CCW to `(width, r)` → line to `(width, 0)` → close
- **Background:** Move to `(0, 0)` → line to `(width - r, 0)` → arc CW to `(width, r)` → line to `(width, height)` → line to `(0, height)` → close

**`sw` and `se` variants** follow the same pattern with arc centers at `(0, height)` and `(width, height)` respectively.

**Rendering:** Requires SVG-like arc commands or bezier curve approximation. A quarter-circle can be approximated by a single cubic bezier with control points at `0.5523 × r` from the endpoints (the standard circle-to-bezier approximation). Konva supports `Arc` shapes natively, or use `Path` with arc commands.

**Comparison to HST:**

| Property | HST | Drunkard's Path |
|---|---|---|
| **Dividing line** | Straight diagonal | Quarter-circle arc |
| **Variants** | nw, ne, sw, se | nw, ne, sw, se |
| **Parts** | primary, secondary | pie, background |
| **Rotation/flip** | Identical cycle | Identical cycle |
| **Rendering** | Straight-line polygon | Arc/bezier path |

The only software difference is the rendering path. State model, store operations, rotation/flip, and placement are all identical to HST.

### Physical Construction

**Sewing curved seams:**
1. Cut both pieces using templates with 1/4" seam allowance
2. Mark center points on both curved edges (fold in half, finger-press)
3. Pin pieces right sides together at center, then at each end
4. Add additional pins every 1/4"–1/2" along the curve
5. Sew with concave piece on top (the L-shape), convex piece on bottom — the shorter concave edge on top eases naturally
6. Sew slowly, adjusting fabric frequently to prevent puckering
7. Clip seam allowance on concave piece (small notches every 1/4") to allow the seam to lie flat
8. Press seam toward the concave (L-shape) piece

**Why it's intermediate difficulty:**
- Requires matching convex and concave curves precisely
- Bias-cut edges on curves are prone to stretching
- Must sew slowly and pin frequently (unlike straight seams)
- Clipping the concave seam allowance requires care to avoid cutting through

**Sizing formula:**
- `Cut size = Finished size + 1/2"` (standard 1/4" seam allowance on each side)
- Arc templates must include 1/4" seam allowance measured perpendicular to the curve at all points
- Some quilters use 3/8" seam allowance on curves for more ease, then trim to 1/4" after sewing

**Common finished sizes:** 3", 4", 6" (most common for Drunkard's Path units)

**Grain line notes:**
- Curved edges are partially on bias — the arc crosses grain at varying angles
- Pin well and handle gently to prevent stretching along the curve
- Press seams toward the concave piece to reduce bulk
- Starching fabric before cutting helps stabilize bias-cut curved edges

### Sub-variations

**Drunkard's Path (the core unit)** — Quarter-circle arc, 2 patches, 4 orientations. This is the fundamental curved piecing unit and covers the largest block family in the dataset. The many named variants (Rob Peter to Pay Paul, Wonder of the World, Fool's Puzzle, Hearts and Gizzards, Love Ring, Old Maid's Puzzle, etc.) are all the **same geometric unit** arranged in different rotational patterns with different color assignments. This is what the `curved_piecing` unit should implement.

**The following are geometrically distinct curved patterns requiring separate implementations:**

| Variation | Geometry | Pieces | Grid | Why Separate |
|---|---|---|---|---|
| **Fan / Grandmother's Fan** | Multiple wedge-shaped arcs radiating from one corner. Typically 4–6 wedges plus a quarter-circle center and a background. | 6–10 | 1×1 | Multi-piece radial subdivision, not a simple 2-part arc. Each wedge is independently colorable. Asymmetric (no rotational symmetry). |
| **Orange Peel** | Vesica piscis (lens shape) formed by two opposing quarter-circle arcs. The intersection creates a convex lens and two concave background pieces. | 3 | 1×1 | Two arcs instead of one. 3 colorable parts. Often done as appliqué in the dataset. |
| **Double Wedding Ring** | Interlocking circular rings built from many small curved and angled pieces. Rings span across multiple block units. | 100s | Multi-cell | Fundamentally different scale — a quilt-level composition pattern, not a block-level shape. Each ring spans multiple cells. |
| **Winding Ways** | S-curves or circular arcs that create an optical illusion of overlapping circles. | 3–4 | 1×1 | Different curve topology (S-curve rather than quarter-circle). Creates different optical effect. |
| **New York Beauty** | Composite: curved arcs framing paper-pieced radiating spikes. Combines curved piecing with foundation paper piecing. | 15–25+ | 1×1 | Multi-technique hybrid. Extremely complex geometry. Not in dataset. |

**Implementation priority:** Drunkard's Path first (covers the largest block family, identical state model to HST). Fan is the second priority (6 blocks in dataset, asymmetric, distinct geometry). Orange Peel and Winding Ways are lower priority. Double Wedding Ring and New York Beauty are complex niche patterns.

### References

- [Curved Piecing 101](https://www.guiltyquiltystudio.com/post/curved-piecing-101) — Fundamentals of sewing convex/concave curves, pinning and easing techniques
- [Drunkard's Path Basics](https://www.freshlypieced.com/blog/piecing-101-drunkards-path-basics) — Drunkard's Path unit geometry, orientations, and pattern variations
- [Making Templates and Piecing Quarter Circles](https://www.simplegeometricquilting.com/blog/piecing-curves-technique-tutorial) — Template creation with seam allowances for curved pieces

---

## Diamond Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `diamond_piecing` |
| **Display Name** | Diamond Piecing |
| **Description** | Piecing with rhombus-shaped pieces (parallelograms with four equal sides and non-90° angles). The canonical diamond block is the LeMoyne Star: 8 diamonds radiating from a center point, with 4 squares and 4 triangles filling the gaps. Diamonds create striking star patterns but require Y-seams (set-in seams) where 3+ pieces meet at non-orthogonal angles. Diamonds do NOT fit a standard rectangular grid — all 17 dataset blocks use "other" grid type. |
| **Relationship** | Standalone technique. Related to HST in that both create angular patterns, but diamonds use non-90° angles and require Y-seams. The on-point square (a square rotated 45°) is visually similar but geometrically distinct — it has 90° angles and requires no Y-seams. Rarely combined with other techniques (only 2 blocks: 1 with appliqué, 1 with HST). Note: Tumbling Blocks uses `english_paper_piecing`, not `diamond_piecing`, despite being made of 60° diamonds. |
| **Prevalence** | 17 of 731 blocks (2%). Dataset breakdown: 100% "other" grid type, 100% rotational_4 symmetry, 76% intermediate / 24% advanced, 0% beginner. Categories: 10 star blocks, 7 geometric blocks. Colors: 2–5, most commonly 3. Piece counts range from 8 (LeMoyne Star) to 72 (Broken Star). |
| **Difficulty** | Intermediate–Advanced |
| **Implementation Status** | Not implemented |

### Software Properties

Diamond piecing presents a fundamental modeling challenge: diamonds don't tile a rectangular grid. The LeMoyne Star (the simplest and most common diamond block) is best modeled as a **block-level template** with individually colorable pieces, rather than as cell-level units placed on a grid.

| Property | Value |
|---|---|
| **Grid Span** | Not grid-cell-based. Diamond blocks do not decompose into rectangular grid cells. A LeMoyne Star is a single composition of 16 pieces (8 diamonds + 4 squares + 4 triangles) that fills the entire block. **Design note:** this is similar to appliqué's positioning challenge — diamonds need either a specialized grid, block-level templates, or free positioning. |
| **Span Consistent?** | N/A — the diamond is not a grid-cell unit. A diamond block is a single template that fills the entire block area. |
| **Independently Colorable Patches** | **LeMoyne Star (8-piece):** 8 diamonds + 4 corner squares + 4 side triangles = 16 independently colorable patches. More complex blocks (Lone Star, Star of Bethlehem) have 64–72+ colorable patches. Each diamond, square, and triangle is individually colorable. |
| **Geometric Variants** | Two distinct diamond angles: **45° diamond** (angles 45°/135°, used in 8-pointed stars — the primary implementation target) and **60° diamond** (angles 60°/120°, used in hexagonal/tumbling blocks — categorized under `english_paper_piecing` in the dataset). On-point squares (90° angles, rotated 45°) are visually similar but geometrically simpler and don't require Y-seams. |
| **Symmetry Type** | Block-level: rotational_4 (100% of dataset). The 8-pointed star has 8-fold rotational symmetry (D₈ dihedral group), but the 4-fold is what the dataset tracks. Individual 45° diamonds have 2-fold rotational symmetry (180° rotation returns to the same shape). |
| **Rotation Behavior** | Block-level: 90° rotation of the entire star composition. Individual diamonds: rotating a single diamond 90° changes it to a different orientation within the star — but diamonds are typically not individually rotated; the block is designed as a complete template. |
| **Flip Behavior (H)** | Mirrors the entire block composition. For symmetric star blocks, flip produces the same result (star is symmetric). For asymmetric color assignments, flip reverses the color pattern. |
| **Flip Behavior (V)** | Same as H flip for symmetric stars. |
| **Placement Mode** | Block template: the entire diamond block is a pre-composed template. The user selects a diamond block type (LeMoyne Star, Lone Star, etc.) and then assigns colors to individual pieces within the template. **Design note:** this is fundamentally different from the tap-to-place cell system. Diamond blocks are likely a "block library" feature rather than a "unit picker" feature. |
| **Batch Placement** | No — each diamond block is a unique composition. |
| **Has Curves** | No |

### Geometry

#### The 45° Diamond (Rhombus)

A 45° diamond is a rhombus with interior angles of 45° and 135°. All four sides are equal length.

```
        ╱╲
       ╱  ╲         45° angle at top and bottom
      ╱    ╲        135° angle at left and right
     ╱  45° ╲
    ╱        ╲
   ╳ 135°     ╳
    ╲        ╱
     ╲      ╱
      ╲    ╱
       ╲  ╱
        ╲╱
```

**For a diamond with side length s:**
- Short diagonal: `d₁ = 2s × sin(22.5°) ≈ 0.765s`
- Long diagonal: `d₂ = 2s × cos(22.5°) ≈ 1.848s`
- Ratio long:short ≈ 2.414:1

#### LeMoyne Star Composition (8-Pointed Star)

The LeMoyne Star is composed of 16 pieces arranged within a square block:

```
┌───────────────────────┐
│╲         ╱╲         ╱│
│  ╲  d1  ╱  ╲  d2  ╱  │
│ sq ╲  ╱  ╱╲  ╲  ╱ sq │
│     ╳  ╱ d8╲  ╳     │
│    ╱ ╲╱     ╲╱ ╲    │
│ d4╱   ╳center╳   ╲d5│
│  ╱   ╱╲     ╱╲   ╲  │
│ ╱  ╱  d7╲ ╱d6 ╲  ╲ │
│╱ ╱      ╳      ╲ ╲│
│╱  d3  ╱  ╲  d6  ╲  │
│sq   ╱      ╲    sq│
└───────────────────────┘
```

*(Simplified — the actual geometry has 8 diamonds radiating from center, 4 corner squares, 4 side triangles)*

**Components:**
- **8 diamonds** — radiating from the center, each with its acute (45°) angle pointing inward. Adjacent diamonds share edges. The 8 acute angles meet at the center (8 × 45° = 360°).
- **4 corner squares** — fill the gaps in each corner of the block between diamond points.
- **4 side triangles** — fill the gaps on each side between diamond points. Each is a right isosceles triangle.

**Y-seam junctions:**
- **Center point:** All 8 diamonds meet at the center — the primary Y-seam junction.
- **Corner junctions:** Each corner square is set in between two adjacent diamond obtuse angles — 4 Y-seam junctions.
- **Side junctions:** Each side triangle is set in between two diamond obtuse angles — 4 Y-seam junctions.
- **Total Y-seam points:** 9 (1 center + 4 corners + 4 sides)

**Vertex coordinates for a unit block (W = 1):** Require trigonometric calculations based on the diamond side length and the 45° angle. The exact coordinates depend on whether the star points touch the block edges (full-width star) or are inset. These calculations should be deferred to the geometry implementation file.

**Rendering:** All pieces are straight-line polygons (diamonds are quadrilaterals, squares are quadrilaterals, triangles are triangles). No curves required. Rendered as Konva `Line` with `closed={true}`.

### Physical Construction

**Y-seam (set-in seam) technique:**
1. Mark 1/4" seam intersections on the wrong side of all pieces at every Y-seam junction point
2. When sewing two pieces together, stitch from 1/4" mark to 1/4" mark — **do not sew into the seam allowance**
3. Backstitch at each start/stop point to secure
4. Set in the third piece: align, pin, and sew from the Y-junction 1/4" mark outward in each direction
5. Press seams in a consistent rotation direction to distribute bulk evenly at the center

**Why Y-seams are required:**
- At the star center, 8 pieces meet at a point where the angles are 45° — not 90°
- Standard straight-through seams would lock the seam allowances and prevent the third (and subsequent) pieces from being inserted
- Stopping 1/4" from the edge leaves the junction flexible for additional pieces

**Sizing formula:**
- `Diamond cut size = Finished diamond side length + 1/2"` (1/4" seam allowance on each side)
- `Corner square cut size = Finished square side + 1/2"`
- `Side triangle cut size = Finished triangle short side + 7/8"` (same formula as HST — they are right isosceles triangles)

**Common finished block sizes:** 6", 9", 12", 14", 16" (for LeMoyne Star). Lone Star/Star of Bethlehem: 12"–24"+.

**Grain line notes:**
- **Critical challenge:** Most diamond edges are on the bias (the 45° angle cuts diagonally across the fabric grain)
- Bias edges stretch easily — handle with care, starch before cutting, and avoid pulling while sewing
- Place the straight grain along one pair of opposite sides to stabilize at least two edges
- The setting squares and triangles should have straight grain on their outer edges (the block perimeter)
- Press seams in a consistent rotational direction at the star center to distribute bulk

### Sub-variations

**45° diamond / 8-pointed star (the core implementation target):**

| Block | Diamonds | Total Pieces | Colors | Difficulty |
|---|---|---|---|---|
| **LeMoyne Star** | 8 | 16 (8d + 4sq + 4tri) | 2–3 | Intermediate |
| **Diamond Star / Texas Star** | 8–24 | 24–32 | 3 | Intermediate |
| **Lone Star** | 64 | 72+ | 5 | Advanced |
| **Star of Bethlehem** | 64 | 72+ | 5 | Advanced |
| **Broken Star** | 72 | 80+ | 4 | Advanced |

The LeMoyne Star is the simplest and should be implemented first. Lone Star and Star of Bethlehem are the same star with more diamonds per ray (concentric color bands), making them scalable extensions of the LeMoyne Star geometry.

**60° diamond / hexagonal patterns:**
- Angles: 60° and 120°
- Used in Tumbling Blocks / Baby Blocks (3D cube illusion using 3 diamonds)
- Requires a hexagonal or triangular coordinate system — does NOT fit rectangular grids
- Categorized under `english_paper_piecing` in the dataset, not `diamond_piecing`
- Deferred — would require a different grid system entirely

**On-point square (45°-rotated square):**
- Not a true diamond — has 90° angles
- Does not require Y-seams
- Can be modeled with the existing grid system (a square rotated 45° within a cell)
- Lower implementation complexity than true diamonds

### References

- [Y-Seams: 60 Degree Diamond Stars Tutorial](https://www.diaryofaquilter.com/y-seams-60-degree-diamond-stars-tutorial/) — Y-seam construction technique with step-by-step photos and the critical 1/4" stop rule
- [LeMoyne Star Quilt Block & History](https://www.quiltingdaily.com/block-friday-lemoyne-star-quilt-block-fons-porter/) — LeMoyne Star geometry, piece breakdown, and construction method
- [Cutting 45 Degree Diamonds and Parallelograms](https://www.canuckquilter.com/2023/04/cutting-45-degree-diamonds-and.html) — Diamond angle geometry, cutting techniques, and grain line placement

---

## Flying Geese

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `flying_geese` |
| **Display Name** | Flying Geese |
| **Description** | TODO |
| **Relationship** | TODO |
| **Prevalence** | 12 of 731 blocks (2%) |
| **Difficulty** | TODO |
| **Implementation Status** | Fully implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | TODO |
| **Span Consistent?** | TODO |
| **Independently Colorable Patches** | TODO |
| **Geometric Variants** | TODO |
| **Symmetry Type** | TODO |
| **Rotation Behavior** | TODO |
| **Flip Behavior (H)** | TODO |
| **Flip Behavior (V)** | TODO |
| **Placement Mode** | TODO |
| **Batch Placement** | TODO |
| **Has Curves** | No |

### Geometry

TODO

### Physical Construction

TODO

### Sub-variations

TODO — directions, no-waste methods, 4-at-a-time construction

---

## English Paper Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `english_paper_piecing` |
| **Display Name** | English Paper Piecing (EPP) |
| **Description** | TODO |
| **Relationship** | TODO |
| **Prevalence** | 11 of 731 blocks (2%) |
| **Difficulty** | TODO |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | TODO |
| **Span Consistent?** | TODO |
| **Independently Colorable Patches** | TODO |
| **Geometric Variants** | TODO |
| **Symmetry Type** | TODO |
| **Rotation Behavior** | TODO |
| **Flip Behavior (H)** | TODO |
| **Flip Behavior (V)** | TODO |
| **Placement Mode** | TODO |
| **Batch Placement** | TODO |
| **Has Curves** | No |

### Geometry

TODO

### Physical Construction

TODO

### Sub-variations

TODO — template shapes (hexagons, diamonds, pentagons, octagons, tumblers, clamshells), grid type implications (hex grid vs square grid)

---

## Paper Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `paper_piecing` |
| **Display Name** | Paper Piecing (FPP) |
| **Description** | TODO |
| **Relationship** | TODO |
| **Prevalence** | 10 of 731 blocks (1%) |
| **Difficulty** | TODO |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | TODO |
| **Span Consistent?** | TODO |
| **Independently Colorable Patches** | TODO |
| **Geometric Variants** | TODO |
| **Symmetry Type** | TODO |
| **Rotation Behavior** | TODO |
| **Flip Behavior (H)** | TODO |
| **Flip Behavior (V)** | TODO |
| **Placement Mode** | TODO |
| **Batch Placement** | TODO |
| **Has Curves** | TODO |

### Geometry

TODO

### Physical Construction

TODO

### Sub-variations

TODO — numbered section patterns, single-foundation vs multi-section, mirror/flip considerations for asymmetric designs

---

## Foundation Piecing

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `foundation_piecing` |
| **Display Name** | Foundation Piecing |
| **Description** | TODO |
| **Relationship** | TODO |
| **Prevalence** | 4 of 731 blocks (<1%) |
| **Difficulty** | TODO |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | TODO |
| **Span Consistent?** | TODO |
| **Independently Colorable Patches** | TODO |
| **Geometric Variants** | TODO |
| **Symmetry Type** | TODO |
| **Rotation Behavior** | TODO |
| **Flip Behavior (H)** | TODO |
| **Flip Behavior (V)** | TODO |
| **Placement Mode** | TODO |
| **Batch Placement** | TODO |
| **Has Curves** | TODO |

### Geometry

TODO

### Physical Construction

TODO

### Sub-variations

TODO — foundation material (paper, fabric, interfacing), permanent vs removable foundation, relationship to paper piecing

---

## Folded Fabric

### Identity

| Property | Value |
|---|---|
| **Technique ID** | `folded_fabric` |
| **Display Name** | Folded Fabric |
| **Description** | TODO |
| **Relationship** | TODO |
| **Prevalence** | 1 of 731 blocks (<1%) |
| **Difficulty** | TODO |
| **Implementation Status** | Not implemented |

### Software Properties

| Property | Value |
|---|---|
| **Grid Span** | TODO |
| **Span Consistent?** | TODO |
| **Independently Colorable Patches** | TODO |
| **Geometric Variants** | TODO |
| **Symmetry Type** | TODO |
| **Rotation Behavior** | TODO |
| **Flip Behavior (H)** | TODO |
| **Flip Behavior (V)** | TODO |
| **Placement Mode** | TODO |
| **Batch Placement** | TODO |
| **Has Curves** | TODO |

### Geometry

TODO

### Physical Construction

TODO

### Sub-variations

TODO — types (prairie points, cathedral windows, yo-yos, Somerset patchwork), 3D vs flat representation challenges
