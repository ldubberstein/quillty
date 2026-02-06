# Quillty - Prioritized Technical Recommendations

## P0 — Completed

- [x] **Wire unit registry into store** — Replace hardcoded type switches in `store.ts` (rotateUnit, flipUnit*, assignFabricRole, removeRole) with registry-driven bridge functions via `unit-bridge.ts`
- [x] **Wire unit registry into renderers** — Replace hardcoded per-type render functions in `BlockInstanceRenderer.tsx`, `BlockThumbnail.tsx`, `PreviewGrid.tsx` with `getUnitTrianglesWithColors()` from bridge
- [x] **Wire unit registry into role extraction** — Replace per-type role extraction in `InstanceColorPanel.tsx`, `InstanceToolbar.tsx`, `operations.ts` with `getAllRoleIds()` / `unitUsesRole()` (also fixes missing QST support in InstanceToolbar)
- [x] **Add server-side validation** — `.superRefine()` on `CreateBlockInputSchema` for bounds, overlaps, ID uniqueness, role references, and FG span-direction consistency

## P1 — High Value

- [ ] **Normalize unit data model** — All units should use `patchRoles: Record<string, FabricRoleId>` instead of type-specific fields (`fabricRole`, `secondaryFabricRole`, `patchFabricRoles`). This eliminates the bridge's `toUnitConfig`/`configToUnitUpdate` mapping entirely. Requires a DB migration and updated Zod schemas.
- [ ] **Wire registry into BlockCanvas interactive renderers** — The per-type renderers (`SquareRenderer`, `HstRenderer`, `FlyingGeeseRenderer`, `QstRenderer`) still have hardcoded geometry. They handle interactive behaviors (click, hover, paint-by-patch) that go beyond pure rendering. Refactor to use `getTriangles()` from registry while preserving click target per-patch.
- [ ] **Generate ShapeThumbnail from registry** — `UNIT_OPTIONS` in `ShapeThumbnail.tsx` is hardcoded. The registry has `thumbnail` definitions but only one per unit type (not per-variant for HST). Either add per-variant thumbnails to `UnitDefinition` or generate variant thumbnails dynamically from `getTriangles()`.
- [ ] **Add server-side validation to UpdateBlockInputSchema** — Currently only `CreateBlockInputSchema` has `.superRefine()`. Updates need cross-field validation too, but it's harder because `gridSize` and `designData` are independently optional (may need to fetch current gridSize from DB).

## P2 — Medium Value

- [ ] **Add 2D grid index for O(1) position lookups** — `isCellOccupied()` currently scans all units linearly. A `Map<string, unitId>` occupancy grid would give O(1) lookups. Matters at larger grid sizes (8×8+).
- [ ] **Generic UnitRoleState in undo operations** — `extractRolesFromUnit` in `history/operations.ts` still uses type-specific `UnitRoleState` fields (`fabricRole`, `secondaryFabricRole`, `patchFabricRoles`, `qstPatchFabricRoles`). Normalizing to generic `patchRoles` would eliminate this (depends on P1 data model normalization).
- [ ] **Ghost preview rendering via registry** — `BlockCanvas.tsx` ghost preview (lines 580-700) creates per-type mock units. Could use `getUnitTrianglesWithColors` with fabricated units for a generic ghost preview renderer.
- [ ] **Simplify BlockCanvas type filters** — Lines 399-402 filter units into per-type arrays for the interactive renderers. Once P1 interactive renderer refactor is done, these can use a single generic iteration.

## P3 — Low Priority / Future

- [ ] **Bundle-split shape definitions** — Shape definitions are currently all imported eagerly via `import './shapes'` side-effect. For tree-shaking, each shape could be lazy-loaded. Low priority since there are only 4 shapes.
- [ ] **Registry-driven placement logic** — `placeUnitAt()` in `BlockCanvas.tsx` has per-type placement logic (addSquare, addHst, addQst, startFlyingGeesePlacement). The registry has `placementMode` and `validatePlacement` that could drive generic placement.
- [ ] **Add `UpdateBlockInputSchema` cross-field validation** — Need to validate design_data against gridSize even in partial updates. May require a helper that accepts an existing block for context.
