'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { GridLines } from './GridLines';
import { ZoomControls } from './ZoomControls';
import { ShapePicker, type ShapeSelection } from './ShapePicker';
import { SquareRenderer } from './SquareRenderer';
import { HstRenderer } from './HstRenderer';
import { FlyingGeeseRenderer } from './FlyingGeeseRenderer';
import { useBlockDesignerStore } from '@quillty/core';
import type { GridPosition, SquareShape, HstShape, FlyingGeeseShape } from '@quillty/core';

/** Canvas sizing constants */
const CANVAS_PADDING = 40;
const MIN_CELL_SIZE = 60;
const MAX_CELL_SIZE = 150;

/** State for shape picker popup */
interface PickerState {
  /** Screen position where picker should appear */
  screenPosition: { x: number; y: number };
  /** Grid position of the tapped cell */
  gridPosition: GridPosition;
}

export function BlockCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get block and actions from store
  const block = useBlockDesignerStore((state) => state.block);
  const mode = useBlockDesignerStore((state) => state.mode);
  const flyingGeesePlacement = useBlockDesignerStore((state) => state.flyingGeesePlacement);
  const activeFabricRole = useBlockDesignerStore((state) => state.activeFabricRole);
  const addSquare = useBlockDesignerStore((state) => state.addSquare);
  const addHst = useBlockDesignerStore((state) => state.addHst);
  const isCellOccupied = useBlockDesignerStore((state) => state.isCellOccupied);
  const clearSelection = useBlockDesignerStore((state) => state.clearSelection);
  const getValidAdjacentCells = useBlockDesignerStore((state) => state.getValidAdjacentCells);
  const startFlyingGeesePlacement = useBlockDesignerStore((state) => state.startFlyingGeesePlacement);
  const completeFlyingGeesePlacement = useBlockDesignerStore((state) => state.completeFlyingGeesePlacement);
  const cancelFlyingGeesePlacement = useBlockDesignerStore((state) => state.cancelFlyingGeesePlacement);
  const assignFabricRole = useBlockDesignerStore((state) => state.assignFabricRole);

  const { gridSize, shapes, previewPalette } = block;
  const isPaintMode = mode === 'paint_mode';

  // Canvas state - start with 0 to force measurement
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Shape picker state
  const [pickerState, setPickerState] = useState<PickerState | null>(null);

  // Calculate cell size based on available space
  const availableSize = Math.min(dimensions.width, dimensions.height) - CANVAS_PADDING * 2;
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, availableSize / gridSize));
  const gridPixelSize = cellSize * gridSize;

  // Center the grid
  const gridOffsetX = (dimensions.width - gridPixelSize) / 2;
  const gridOffsetY = (dimensions.height - gridPixelSize) / 2;

  // Calculate dynamic zoom limits based on screen size
  const minScale = dimensions.height > 0
    ? Math.max(0.1, (dimensions.height * 0.5) / gridPixelSize)
    : 0.25;
  const maxScale = 3;

  // Helper to constrain position after zoom to keep grid in bounds
  const constrainPosition = useCallback(
    (pos: { x: number; y: number }, currentScale: number) => {
      const scaledGridSize = gridPixelSize * currentScale;
      const scaledOffsetX = gridOffsetX * currentScale;
      const scaledOffsetY = gridOffsetY * currentScale;

      const gridLeft = scaledOffsetX + pos.x;
      const gridRight = gridLeft + scaledGridSize;
      const gridTop = scaledOffsetY + pos.y;
      const gridBottom = gridTop + scaledGridSize;

      const minVisible = Math.min(scaledGridSize * 0.2, 100);

      let newX = pos.x;
      let newY = pos.y;

      if (gridRight < minVisible) {
        newX = minVisible - (scaledOffsetX + scaledGridSize);
      }
      if (gridLeft > dimensions.width - minVisible) {
        newX = dimensions.width - minVisible - scaledOffsetX;
      }
      if (gridBottom < minVisible) {
        newY = minVisible - (scaledOffsetY + scaledGridSize);
      }
      if (gridTop > dimensions.height - minVisible) {
        newY = dimensions.height - minVisible - scaledOffsetY;
      }

      return { x: newX, y: newY };
    },
    [gridPixelSize, gridOffsetX, gridOffsetY, dimensions.width, dimensions.height]
  );

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((s) => {
      const newScale = Math.min(s + 0.25, maxScale);
      setPosition((pos) => constrainPosition(pos, newScale));
      return newScale;
    });
  }, [maxScale, constrainPosition]);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s - 0.25, minScale);
      setPosition((pos) => constrainPosition(pos, newScale));
      return newScale;
    });
  }, [minScale, constrainPosition]);

  const handleZoomFit = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomChange = useCallback((newScale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    setScale(clampedScale);
    setPosition((pos) => constrainPosition(pos, clampedScale));
  }, [minScale, maxScale, constrainPosition]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    const constrainedPos = constrainPosition(newPos, clampedScale);

    setScale(clampedScale);
    setPosition(constrainedPos);
  }, [scale, position, minScale, maxScale, constrainPosition]);

  // Handle drag
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, []);

  // Drag bounds
  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      const scaledGridSize = gridPixelSize * scale;
      const gridLeft = gridOffsetX * scale + pos.x;
      const gridRight = gridLeft + scaledGridSize;
      const gridTop = gridOffsetY * scale + pos.y;
      const gridBottom = gridTop + scaledGridSize;

      const minVisible = Math.min(scaledGridSize * 0.2, 100);

      let newX = pos.x;
      let newY = pos.y;

      if (gridRight < minVisible) {
        newX = minVisible - (gridOffsetX * scale + scaledGridSize);
      }
      if (gridLeft > dimensions.width - minVisible) {
        newX = dimensions.width - minVisible - gridOffsetX * scale;
      }
      if (gridBottom < minVisible) {
        newY = minVisible - (gridOffsetY * scale + scaledGridSize);
      }
      if (gridTop > dimensions.height - minVisible) {
        newY = dimensions.height - minVisible - gridOffsetY * scale;
      }

      return { x: newX, y: newY };
    },
    [scale, gridPixelSize, gridOffsetX, gridOffsetY, dimensions.width, dimensions.height]
  );

  // Convert stage coordinates to grid position
  const stageToGrid = useCallback(
    (stageX: number, stageY: number): GridPosition | null => {
      // Convert to local grid coordinates
      const localX = stageX - gridOffsetX;
      const localY = stageY - gridOffsetY;

      // Check if within grid bounds
      if (localX < 0 || localY < 0 || localX >= gridPixelSize || localY >= gridPixelSize) {
        return null;
      }

      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);

      // Validate bounds
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
        return null;
      }

      return { row, col };
    },
    [gridOffsetX, gridOffsetY, gridPixelSize, cellSize, gridSize]
  );

  // Convert stage position to screen position
  const stageToScreen = useCallback(
    (stageX: number, stageY: number): { x: number; y: number } => {
      return {
        x: stageX * scale + position.x,
        y: stageY * scale + position.y,
      };
    },
    [scale, position]
  );

  // Handle click on grid area (for placing shapes)
  const handleGridClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen position to stage position (accounting for zoom/pan)
      const stageX = (pointer.x - position.x) / scale;
      const stageY = (pointer.y - position.y) / scale;

      // Convert to grid position
      const gridPos = stageToGrid(stageX, stageY);

      // If clicked outside grid, dismiss picker, cancel placement, and clear selection
      if (!gridPos) {
        setPickerState(null);
        if (mode === 'placing_flying_geese_second') {
          cancelFlyingGeesePlacement();
        }
        clearSelection();
        return;
      }

      // If in Flying Geese placement mode, handle second tap
      if (mode === 'placing_flying_geese_second' && flyingGeesePlacement) {
        // Check if tapped cell is a valid adjacent cell
        const isValidAdjacent = flyingGeesePlacement.validAdjacentCells.some(
          (cell) => cell.row === gridPos.row && cell.col === gridPos.col
        );

        if (isValidAdjacent) {
          completeFlyingGeesePlacement(gridPos);
        } else {
          // Tapped same cell or non-adjacent - cancel
          cancelFlyingGeesePlacement();
        }
        return;
      }

      // If cell is occupied, do nothing (edit mode will come in iteration 1.8)
      if (isCellOccupied(gridPos)) {
        setPickerState(null);
        return;
      }

      // Show shape picker near the tap point
      // Calculate the center of the tapped cell
      const cellCenterX = gridOffsetX + gridPos.col * cellSize + cellSize / 2;
      const cellCenterY = gridOffsetY + gridPos.row * cellSize;
      const screenPos = stageToScreen(cellCenterX, cellCenterY);

      setPickerState({
        screenPosition: screenPos,
        gridPosition: gridPos,
      });
    },
    [position, scale, stageToGrid, stageToScreen, isCellOccupied, clearSelection, gridOffsetX, gridOffsetY, cellSize, mode, flyingGeesePlacement, cancelFlyingGeesePlacement, completeFlyingGeesePlacement]
  );

  // Handle shape selection from picker
  const handleSelectShape = useCallback(
    (selection: ShapeSelection) => {
      if (!pickerState) return;

      if (selection.type === 'square') {
        addSquare(pickerState.gridPosition, 'feature');
        setPickerState(null);
      } else if (selection.type === 'hst') {
        addHst(pickerState.gridPosition, selection.variant, 'feature', 'background');
        setPickerState(null);
      } else if (selection.type === 'flying_geese') {
        // Check if there are valid adjacent cells
        const validCells = getValidAdjacentCells(pickerState.gridPosition);
        if (validCells.length === 0) {
          // No valid adjacent cells - show feedback (could add toast later)
          console.warn('Not enough space for Flying Geese here.');
          setPickerState(null);
          return;
        }
        // Start two-tap placement mode
        startFlyingGeesePlacement(pickerState.gridPosition);
        setPickerState(null);
      }
    },
    [pickerState, addSquare, addHst, getValidAdjacentCells, startFlyingGeesePlacement]
  );

  // Handle picker dismissal
  const handleDismissPicker = useCallback(() => {
    setPickerState(null);
  }, []);

  // Handle shape click (for paint mode)
  const handleShapeClick = useCallback(
    (shapeId: string) => {
      if (isPaintMode && activeFabricRole) {
        assignFabricRole(shapeId, activeFabricRole);
      }
      // In non-paint mode, could open edit popup (future iteration)
    },
    [isPaintMode, activeFabricRole, assignFabricRole]
  );

  // Filter shapes by type
  const squareShapes = shapes.filter((s): s is SquareShape => s.type === 'square');
  const hstShapes = shapes.filter((s): s is HstShape => s.type === 'hst');
  const flyingGeeseShapes = shapes.filter((s): s is FlyingGeeseShape => s.type === 'flying_geese');

  // Don't render Stage until we have dimensions
  const hasValidDimensions = dimensions.width > 0 && dimensions.height > 0;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100 overflow-hidden">
      {!hasValidDimensions && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500">Initializing canvas...</div>
        </div>
      )}
      {hasValidDimensions && (
        <>
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable
            dragBoundFunc={dragBoundFunc}
            onWheel={handleWheel}
            onDragEnd={handleDragEnd}
          >
            <Layer>
              <GridLines
                gridSize={gridSize}
                cellSize={cellSize}
                offsetX={gridOffsetX}
                offsetY={gridOffsetY}
              />

              {/* Render square shapes */}
              {squareShapes.map((shape) => (
                <SquareRenderer
                  key={shape.id}
                  shape={shape}
                  cellSize={cellSize}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                  palette={previewPalette}
                  onClick={isPaintMode ? () => handleShapeClick(shape.id) : undefined}
                />
              ))}

              {/* Render HST shapes */}
              {hstShapes.map((shape) => (
                <HstRenderer
                  key={shape.id}
                  shape={shape}
                  cellSize={cellSize}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                  palette={previewPalette}
                  onClick={isPaintMode ? () => handleShapeClick(shape.id) : undefined}
                />
              ))}

              {/* Render Flying Geese shapes */}
              {flyingGeeseShapes.map((shape) => (
                <FlyingGeeseRenderer
                  key={shape.id}
                  shape={shape}
                  cellSize={cellSize}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                  palette={previewPalette}
                  onClick={isPaintMode ? () => handleShapeClick(shape.id) : undefined}
                />
              ))}

              {/* Highlight cells during Flying Geese placement */}
              {mode === 'placing_flying_geese_second' && flyingGeesePlacement && (
                <>
                  {/* First cell highlight (selected) */}
                  <Rect
                    x={gridOffsetX + flyingGeesePlacement.firstCellPosition.col * cellSize + 2}
                    y={gridOffsetY + flyingGeesePlacement.firstCellPosition.row * cellSize + 2}
                    width={cellSize - 4}
                    height={cellSize - 4}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  {/* Valid adjacent cells highlight (glowing) */}
                  {flyingGeesePlacement.validAdjacentCells.map((cell) => (
                    <Rect
                      key={`adjacent-${cell.row}-${cell.col}`}
                      x={gridOffsetX + cell.col * cellSize + 2}
                      y={gridOffsetY + cell.row * cellSize + 2}
                      width={cellSize - 4}
                      height={cellSize - 4}
                      fill="rgba(34, 197, 94, 0.2)"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  ))}
                </>
              )}

              {/* Invisible rect to capture clicks on the entire grid area */}
              {/* Only render when NOT in paint mode, so shape clicks work */}
              {!isPaintMode && (
                <Rect
                  x={gridOffsetX}
                  y={gridOffsetY}
                  width={gridPixelSize}
                  height={gridPixelSize}
                  fill="transparent"
                  onClick={handleGridClick}
                  onTap={handleGridClick}
                />
              )}
            </Layer>
          </Stage>

          <ZoomControls
            scale={scale}
            minScale={minScale}
            maxScale={maxScale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomFit={handleZoomFit}
            onZoomChange={handleZoomChange}
          />

          {/* Flying Geese placement mode indicator */}
          {mode === 'placing_flying_geese_second' && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Tap a highlighted cell to place Flying Geese
              <button
                onClick={cancelFlyingGeesePlacement}
                className="ml-3 text-blue-100 hover:text-white underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Paint mode indicator */}
          {isPaintMode && activeFabricRole && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-white/50"
                style={{
                  backgroundColor:
                    previewPalette.roles.find((r) => r.id === activeFabricRole)?.color ?? '#CCC',
                }}
              />
              Tap shapes to paint with{' '}
              {previewPalette.roles.find((r) => r.id === activeFabricRole)?.name ?? 'fabric'}
            </div>
          )}

          {/* Shape picker popup */}
          {pickerState && (
            <ShapePicker
              position={pickerState.screenPosition}
              onSelectShape={handleSelectShape}
              onDismiss={handleDismissPicker}
            />
          )}
        </>
      )}
    </div>
  );
}
