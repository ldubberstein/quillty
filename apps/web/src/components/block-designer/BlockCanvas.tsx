'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { Group } from 'react-konva';
import { GridLines } from './GridLines';
import { ZoomControls } from './ZoomControls';
import { SquareRenderer } from './SquareRenderer';
import { HstRenderer } from './HstRenderer';
import { FlyingGeeseRenderer } from './FlyingGeeseRenderer';
import { FloatingToolbar } from './FloatingToolbar';
import { PreviewGrid } from './PreviewGrid';
import { EmptyCell } from './EmptyCell';
import { useDragToFill } from '../../hooks';
import { useBlockDesignerStore, useSelectedShapeType, useHoveredCell, useIsPlacingShape } from '@quillty/core';
import type { GridPosition, SquareShape, HstShape, FlyingGeeseShape, Shape, ShapeSelectionType } from '@quillty/core';

/** Canvas sizing constants */
const CANVAS_PADDING = 40;
const MIN_CELL_SIZE = 60;
const MAX_CELL_SIZE = 150;

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
  const getShapeAt = useBlockDesignerStore((state) => state.getShapeAt);
  const clearSelection = useBlockDesignerStore((state) => state.clearSelection);
  const getValidAdjacentCells = useBlockDesignerStore((state) => state.getValidAdjacentCells);
  const startFlyingGeesePlacement = useBlockDesignerStore((state) => state.startFlyingGeesePlacement);
  const completeFlyingGeesePlacement = useBlockDesignerStore((state) => state.completeFlyingGeesePlacement);
  const cancelFlyingGeesePlacement = useBlockDesignerStore((state) => state.cancelFlyingGeesePlacement);
  const assignFabricRole = useBlockDesignerStore((state) => state.assignFabricRole);
  const selectedShapeId = useBlockDesignerStore((state) => state.selectedShapeId);
  const selectShape = useBlockDesignerStore((state) => state.selectShape);
  const removeShape = useBlockDesignerStore((state) => state.removeShape);
  const rotateShape = useBlockDesignerStore((state) => state.rotateShape);
  const flipShapeHorizontal = useBlockDesignerStore((state) => state.flipShapeHorizontal);
  const flipShapeVertical = useBlockDesignerStore((state) => state.flipShapeVertical);

  // Shape library selection
  const selectedShapeType = useSelectedShapeType();
  const hoveredCell = useHoveredCell();
  const isPlacingShape = useIsPlacingShape();
  const selectShapeForPlacement = useBlockDesignerStore((state) => state.selectShapeForPlacement);
  const setHoveredCell = useBlockDesignerStore((state) => state.setHoveredCell);
  const clearShapeSelection = useBlockDesignerStore((state) => state.clearShapeSelection);
  const addShapesBatch = useBlockDesignerStore((state) => state.addShapesBatch);

  const { gridSize, shapes, previewPalette } = block;
  const isPaintMode = mode === 'paint_mode';
  const isPreviewMode = mode === 'preview';

  // Canvas state - start with 0 to force measurement
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

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

  // Handle drag complete callback for batch shape placement
  const handleDragFillComplete = useCallback(
    (cells: GridPosition[]) => {
      if (selectedShapeType && selectedShapeType.type !== 'flying_geese') {
        addShapesBatch(cells, selectedShapeType);
      }
    },
    [selectedShapeType, addShapesBatch]
  );

  // Drag-to-fill hook - enabled for square/HST shapes only (not Flying Geese)
  const dragToFillEnabled = isPlacingShape && selectedShapeType !== null && selectedShapeType.type !== 'flying_geese';
  const {
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
    draggedCells,
    isDragging,
  } = useDragToFill({
    stageToGrid,
    isCellOccupied,
    onDragComplete: handleDragFillComplete,
    enabled: dragToFillEnabled,
  });

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

  // Place a shape at the given position based on the selected shape type
  const placeShapeAt = useCallback(
    (gridPos: GridPosition, shapeType: ShapeSelectionType) => {
      if (shapeType.type === 'square') {
        addSquare(gridPos, 'background');
      } else if (shapeType.type === 'hst') {
        addHst(gridPos, shapeType.variant, 'background', 'background');
      } else if (shapeType.type === 'flying_geese') {
        // Check if there are valid adjacent cells
        const validCells = getValidAdjacentCells(gridPos);
        if (validCells.length === 0) {
          console.warn('Not enough space for Flying Geese here.');
          return;
        }
        // Start two-tap placement mode
        startFlyingGeesePlacement(gridPos);
      }
    },
    [addSquare, addHst, getValidAdjacentCells, startFlyingGeesePlacement]
  );

  // Handle click on empty cell (for placing shapes from library)
  const handleEmptyCellClick = useCallback(
    (row: number, col: number) => {
      const gridPos: GridPosition = { row, col };

      // If in Flying Geese placement mode, handle second tap
      if (mode === 'placing_flying_geese_second' && flyingGeesePlacement) {
        const isValidAdjacent = flyingGeesePlacement.validAdjacentCells.some(
          (cell) => cell.row === row && cell.col === col
        );

        if (isValidAdjacent) {
          completeFlyingGeesePlacement(gridPos);
        } else {
          cancelFlyingGeesePlacement();
        }
        return;
      }

      // If in placing_shape mode with a selected shape type, place the shape
      if (isPlacingShape && selectedShapeType) {
        placeShapeAt(gridPos, selectedShapeType);
      }
    },
    [mode, flyingGeesePlacement, isPlacingShape, selectedShapeType, completeFlyingGeesePlacement, cancelFlyingGeesePlacement, placeShapeAt]
  );

  // Handle hover on empty cell (for ghost preview)
  const handleEmptyCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (isPlacingShape || mode === 'placing_flying_geese_second') {
        setHoveredCell({ row, col });
      }
    },
    [isPlacingShape, mode, setHoveredCell]
  );

  const handleEmptyCellMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  // Handle click on background (outside grid) to clear selection
  const handleBackgroundClick = useCallback(() => {
    clearSelection();
    clearShapeSelection();
    if (mode === 'placing_flying_geese_second') {
      cancelFlyingGeesePlacement();
    }
  }, [clearSelection, clearShapeSelection, mode, cancelFlyingGeesePlacement]);

  // Handle shape click (for paint mode or selection)
  const handleShapeClick = useCallback(
    (shapeId: string, partId?: string) => {
      if (isPaintMode && activeFabricRole) {
        assignFabricRole(shapeId, activeFabricRole, partId);
      } else if (!isPaintMode) {
        // Select the shape when not in paint mode
        selectShape(shapeId);
      }
    },
    [isPaintMode, activeFabricRole, assignFabricRole, selectShape]
  );

  // Get the selected shape for toolbar positioning
  const selectedShape = selectedShapeId
    ? shapes.find((s) => s.id === selectedShapeId)
    : null;

  // Calculate toolbar position based on selected shape
  const getToolbarPosition = useCallback(
    (shape: Shape): { x: number; y: number } => {
      // Calculate shape center in stage coordinates
      const shapeCenterX = gridOffsetX + (shape.position.col + shape.span.cols / 2) * cellSize;
      const shapeTopY = gridOffsetY + shape.position.row * cellSize;

      // Convert to screen coordinates
      return {
        x: shapeCenterX * scale + position.x,
        y: shapeTopY * scale + position.y,
      };
    },
    [gridOffsetX, gridOffsetY, cellSize, scale, position]
  );

  // Toolbar action handlers
  const handleRotate = useCallback(() => {
    if (selectedShapeId) {
      rotateShape(selectedShapeId);
    }
  }, [selectedShapeId, rotateShape]);

  const handleFlipHorizontal = useCallback(() => {
    if (selectedShapeId) {
      flipShapeHorizontal(selectedShapeId);
    }
  }, [selectedShapeId, flipShapeHorizontal]);

  const handleFlipVertical = useCallback(() => {
    if (selectedShapeId) {
      flipShapeVertical(selectedShapeId);
    }
  }, [selectedShapeId, flipShapeVertical]);

  const handleDelete = useCallback(() => {
    if (selectedShapeId) {
      removeShape(selectedShapeId);
    }
  }, [selectedShapeId, removeShape]);

  // Filter shapes by type
  const squareShapes = shapes.filter((s): s is SquareShape => s.type === 'square');
  const hstShapes = shapes.filter((s): s is HstShape => s.type === 'hst');
  const flyingGeeseShapes = shapes.filter((s): s is FlyingGeeseShape => s.type === 'flying_geese');

  // Compute empty cell positions for rendering EmptyCell components
  const getEmptyCellPositions = useCallback((): GridPosition[] => {
    const emptyCells: GridPosition[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (!isCellOccupied({ row, col })) {
          emptyCells.push({ row, col });
        }
      }
    }
    return emptyCells;
  }, [gridSize, isCellOccupied]);

  const emptyCellPositions = getEmptyCellPositions();

  // Check if a cell is a valid Flying Geese target
  const isValidFlyingGeeseTarget = useCallback(
    (row: number, col: number): boolean => {
      if (mode !== 'placing_flying_geese_second' || !flyingGeesePlacement) return false;
      return flyingGeesePlacement.validAdjacentCells.some(
        (cell) => cell.row === row && cell.col === col
      );
    },
    [mode, flyingGeesePlacement]
  );

  // Don't render Stage until we have dimensions
  const hasValidDimensions = dimensions.width > 0 && dimensions.height > 0;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100 overflow-hidden">
      {!hasValidDimensions && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500">Initializing canvas...</div>
        </div>
      )}
      {hasValidDimensions && isPreviewMode && <PreviewGrid />}
      {hasValidDimensions && !isPreviewMode && (
        <>
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable={!isDragging}
            dragBoundFunc={dragBoundFunc}
            onWheel={handleWheel}
            onDragEnd={handleDragEnd}
            onMouseDown={handleDragMouseDown}
            onMouseMove={handleDragMouseMove}
            onMouseUp={handleDragMouseUp}
            onMouseLeave={handleDragMouseUp}
          >
            <Layer>
              {/* Background rect to capture clicks outside the grid */}
              <Rect
                x={0}
                y={0}
                width={dimensions.width / scale}
                height={dimensions.height / scale}
                fill="transparent"
                onClick={handleBackgroundClick}
                onTap={handleBackgroundClick}
              />

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
                  isSelected={shape.id === selectedShapeId}
                  onClick={() => handleShapeClick(shape.id)}
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
                  isSelected={shape.id === selectedShapeId}
                  onClick={(partId) => handleShapeClick(shape.id, partId)}
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
                  isSelected={shape.id === selectedShapeId}
                  onClick={(partId) => handleShapeClick(shape.id, partId)}
                />
              ))}

              {/* Highlight first cell during Flying Geese placement */}
              {mode === 'placing_flying_geese_second' && flyingGeesePlacement && (
                <Rect
                  x={gridOffsetX + flyingGeesePlacement.firstCellPosition.col * cellSize + 2}
                  y={gridOffsetY + flyingGeesePlacement.firstCellPosition.row * cellSize + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill="rgba(59, 130, 246, 0.3)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  listening={false}
                />
              )}

              {/* Empty cells - clickable/hoverable for placement */}
              {emptyCellPositions.map(({ row, col }) => (
                <EmptyCell
                  key={`empty-${row}-${col}`}
                  row={row}
                  col={col}
                  cellSize={cellSize}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                  isHighlighted={isPlacingShape}
                  isHovered={hoveredCell?.row === row && hoveredCell?.col === col}
                  isValidFlyingGeeseTarget={isValidFlyingGeeseTarget(row, col)}
                  onClick={handleEmptyCellClick}
                  onMouseEnter={handleEmptyCellMouseEnter}
                  onMouseLeave={handleEmptyCellMouseLeave}
                />
              ))}

              {/* Ghost preview for shape placement (single cell hover) */}
              {isPlacingShape && !isDragging && hoveredCell && selectedShapeType && !isCellOccupied(hoveredCell) && (
                <Group opacity={0.5} listening={false}>
                  {selectedShapeType.type === 'square' && (
                    <SquareRenderer
                      shape={{
                        id: 'ghost-preview',
                        type: 'square',
                        position: hoveredCell,
                        span: { rows: 1, cols: 1 },
                        fabricRole: 'background',
                      }}
                      cellSize={cellSize}
                      offsetX={gridOffsetX}
                      offsetY={gridOffsetY}
                      palette={previewPalette}
                      isSelected={false}
                    />
                  )}
                  {selectedShapeType.type === 'hst' && (
                    <HstRenderer
                      shape={{
                        id: 'ghost-preview',
                        type: 'hst',
                        position: hoveredCell,
                        span: { rows: 1, cols: 1 },
                        variant: selectedShapeType.variant,
                        fabricRole: 'background',
                        secondaryFabricRole: 'background',
                      }}
                      cellSize={cellSize}
                      offsetX={gridOffsetX}
                      offsetY={gridOffsetY}
                      palette={previewPalette}
                      isSelected={false}
                    />
                  )}
                  {/* Flying Geese doesn't show ghost preview - uses two-tap flow */}
                </Group>
              )}

              {/* Drag-to-fill preview - show cells that will be filled */}
              {isDragging && draggedCells.map(({ row, col }) => (
                <Rect
                  key={`drag-preview-${row}-${col}`}
                  x={gridOffsetX + col * cellSize + 2}
                  y={gridOffsetY + row * cellSize + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3B82F6"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              ))}
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

          {/* Floating toolbar for selected shape */}
          {selectedShape && !isPaintMode && (
            <FloatingToolbar
              position={getToolbarPosition(selectedShape)}
              canRotate={selectedShape.type === 'hst' || selectedShape.type === 'flying_geese'}
              canFlip={selectedShape.type === 'hst' || selectedShape.type === 'flying_geese'}
              onRotate={handleRotate}
              onFlipHorizontal={handleFlipHorizontal}
              onFlipVertical={handleFlipVertical}
              onDelete={handleDelete}
              onDismiss={clearSelection}
            />
          )}
        </>
      )}
    </div>
  );
}
