'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import type Konva from 'konva';
import { EmptySlot } from './EmptySlot';
import { PatternGridLines } from './PatternGridLines';
import { BlockInstanceRenderer } from './BlockInstanceRenderer';
import { BorderRenderer } from './BorderRenderer';
import { ZoomControls } from '../block-designer/ZoomControls';
import { FloatingToolbar } from '../block-designer/FloatingToolbar';
import { useDragToFill, useRotationKeyboard } from '../../hooks';
import {
  usePatternDesignerStore,
  useGridSize,
  useSelectedLibraryBlockId,
  usePatternPalette,
  usePreviewingGridResize,
  useGridResizePosition,
  useBorderConfig,
  useTotalBorderWidth,
  usePlacementRotation,
} from '@quillty/core';
import type { GridPosition, Shape, BlockInstance } from '@quillty/core';

/** Canvas sizing constants */
const CANVAS_PADDING = 40;
const MIN_CELL_SIZE = 60;
const MAX_CELL_SIZE = 120;

/**
 * Helper to extract shapes from a block
 * Handles both direct shapes array and API format with design_data JSON
 */
function getBlockShapes(block: { shapes?: Shape[]; design_data?: unknown }): Shape[] {
  // Direct shapes array (from core Block type)
  if (block.shapes && Array.isArray(block.shapes)) {
    return block.shapes;
  }

  // API format: design_data is a JSON object with shapes
  if (block.design_data) {
    try {
      const designData =
        typeof block.design_data === 'string'
          ? JSON.parse(block.design_data)
          : block.design_data;
      return designData.shapes ?? [];
    } catch {
      return [];
    }
  }

  return [];
}

export function PatternCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get state and actions from store
  const gridSize = useGridSize();
  const selectedLibraryBlockId = useSelectedLibraryBlockId();
  const palette = usePatternPalette();
  const mode = usePatternDesignerStore((state) => state.mode);
  const blockInstances = usePatternDesignerStore((state) => state.pattern.blockInstances);
  const blockCache = usePatternDesignerStore((state) => state.blockCache);
  const selectedBlockInstanceId = usePatternDesignerStore((state) => state.selectedBlockInstanceId);
  const isPreviewingFillEmpty = usePatternDesignerStore((state) => state.isPreviewingFillEmpty);
  const previewingGridResize = usePreviewingGridResize();
  const gridResizePosition = useGridResizePosition();
  const borderConfig = useBorderConfig();
  const totalBorderWidth = useTotalBorderWidth();
  const placementRotation = usePlacementRotation();
  const physicalSize = usePatternDesignerStore((state) => state.pattern.physicalSize);
  const addBlockInstance = usePatternDesignerStore((state) => state.addBlockInstance);
  const addBlockInstancesBatch = usePatternDesignerStore((state) => state.addBlockInstancesBatch);
  const isPositionOccupied = usePatternDesignerStore((state) => state.isPositionOccupied);
  const clearSelections = usePatternDesignerStore((state) => state.clearSelections);
  const selectBlockInstance = usePatternDesignerStore((state) => state.selectBlockInstance);
  const rotateBlockInstance = usePatternDesignerStore((state) => state.rotateBlockInstance);
  const flipBlockInstanceHorizontal = usePatternDesignerStore((state) => state.flipBlockInstanceHorizontal);
  const flipBlockInstanceVertical = usePatternDesignerStore((state) => state.flipBlockInstanceVertical);
  const removeBlockInstance = usePatternDesignerStore((state) => state.removeBlockInstance);

  const { rows, cols } = gridSize;
  const isPlacingBlock = mode === 'placing_block' && selectedLibraryBlockId !== null;

  // Enable R key for rotation (placement mode and editing selected blocks)
  useRotationKeyboard();

  // Canvas state
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Hover state for ghost preview
  const [hoveredSlot, setHoveredSlot] = useState<{ row: number; col: number } | null>(null);

  // Calculate cell size based on available space, accounting for borders
  // Border size in grid units = totalBorderWidth (inches) / blockSizeInches
  // This tells us how many "cells" worth of space borders need on each side
  const borderGridUnits = borderConfig?.enabled
    ? (totalBorderWidth / physicalSize.blockSizeInches) * 2
    : 0;

  const availableWidth = dimensions.width - CANVAS_PADDING * 2;
  const availableHeight = dimensions.height - CANVAS_PADDING * 2;
  // Account for border space when calculating cell size
  const cellSizeByWidth = availableWidth / (cols + borderGridUnits);
  const cellSizeByHeight = availableHeight / (rows + borderGridUnits);
  const naturalCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, naturalCellSize));

  // Grid dimensions in pixels
  const gridPixelWidth = cellSize * cols;
  const gridPixelHeight = cellSize * rows;

  // Calculate pixels per inch based on cell size and block size
  const pixelsPerInch = cellSize / physicalSize.blockSizeInches;

  // Calculate border size in pixels
  const borderPixels = borderConfig?.enabled ? totalBorderWidth * pixelsPerInch : 0;

  // Total canvas content dimensions (grid + borders)
  const totalContentWidth = gridPixelWidth + borderPixels * 2;
  const totalContentHeight = gridPixelHeight + borderPixels * 2;

  // Center the entire content (grid + borders)
  const contentOffsetX = (dimensions.width - totalContentWidth) / 2;
  const contentOffsetY = (dimensions.height - totalContentHeight) / 2;

  // Grid offset is content offset plus border width
  const gridOffsetX = contentOffsetX + borderPixels;
  const gridOffsetY = contentOffsetY + borderPixels;

  // Calculate dynamic zoom limits
  const minScale = dimensions.height > 0
    ? Math.max(0.1, Math.min(
        (dimensions.height * 0.5) / gridPixelHeight,
        (dimensions.width * 0.5) / gridPixelWidth
      ))
    : 0.25;
  const maxScale = 3;

  // Helper to constrain position after zoom
  const constrainPosition = useCallback(
    (pos: { x: number; y: number }, currentScale: number) => {
      const scaledGridWidth = gridPixelWidth * currentScale;
      const scaledGridHeight = gridPixelHeight * currentScale;
      const scaledOffsetX = gridOffsetX * currentScale;
      const scaledOffsetY = gridOffsetY * currentScale;

      const gridLeft = scaledOffsetX + pos.x;
      const gridRight = gridLeft + scaledGridWidth;
      const gridTop = scaledOffsetY + pos.y;
      const gridBottom = gridTop + scaledGridHeight;

      const minVisible = Math.min(Math.min(scaledGridWidth, scaledGridHeight) * 0.2, 100);

      let newX = pos.x;
      let newY = pos.y;

      if (gridRight < minVisible) {
        newX = minVisible - (scaledOffsetX + scaledGridWidth);
      }
      if (gridLeft > dimensions.width - minVisible) {
        newX = dimensions.width - minVisible - scaledOffsetX;
      }
      if (gridBottom < minVisible) {
        newY = minVisible - (scaledOffsetY + scaledGridHeight);
      }
      if (gridTop > dimensions.height - minVisible) {
        newY = dimensions.height - minVisible - scaledOffsetY;
      }

      return { x: newX, y: newY };
    },
    [gridPixelWidth, gridPixelHeight, gridOffsetX, gridOffsetY, dimensions.width, dimensions.height]
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
      const scaledGridWidth = gridPixelWidth * scale;
      const scaledGridHeight = gridPixelHeight * scale;
      const gridLeft = gridOffsetX * scale + pos.x;
      const gridRight = gridLeft + scaledGridWidth;
      const gridTop = gridOffsetY * scale + pos.y;
      const gridBottom = gridTop + scaledGridHeight;

      const minVisible = Math.min(Math.min(scaledGridWidth, scaledGridHeight) * 0.2, 100);

      let newX = pos.x;
      let newY = pos.y;

      if (gridRight < minVisible) {
        newX = minVisible - (gridOffsetX * scale + scaledGridWidth);
      }
      if (gridLeft > dimensions.width - minVisible) {
        newX = dimensions.width - minVisible - gridOffsetX * scale;
      }
      if (gridBottom < minVisible) {
        newY = minVisible - (gridOffsetY * scale + scaledGridHeight);
      }
      if (gridTop > dimensions.height - minVisible) {
        newY = dimensions.height - minVisible - gridOffsetY * scale;
      }

      return { x: newX, y: newY };
    },
    [scale, gridPixelWidth, gridPixelHeight, gridOffsetX, gridOffsetY, dimensions.width, dimensions.height]
  );

  // Convert stage coordinates to grid position
  const stageToGrid = useCallback(
    (stageX: number, stageY: number): GridPosition | null => {
      // Convert to local grid coordinates
      const localX = stageX - gridOffsetX;
      const localY = stageY - gridOffsetY;

      // Check if within grid bounds
      if (localX < 0 || localY < 0 || localX >= gridPixelWidth || localY >= gridPixelHeight) {
        return null;
      }

      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);

      // Validate bounds
      if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return null;
      }

      return { row, col };
    },
    [gridOffsetX, gridOffsetY, gridPixelWidth, gridPixelHeight, cellSize, rows, cols]
  );

  // Handle drag complete callback for batch block placement
  const handleDragFillComplete = useCallback(
    (cells: GridPosition[]) => {
      if (selectedLibraryBlockId) {
        addBlockInstancesBatch(selectedLibraryBlockId, cells, placementRotation);
      }
    },
    [selectedLibraryBlockId, addBlockInstancesBatch, placementRotation]
  );

  // Drag-to-fill hook - enabled when placing blocks
  const {
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
    draggedCells,
    isDragging,
  } = useDragToFill({
    stageToGrid,
    isCellOccupied: isPositionOccupied,
    onDragComplete: handleDragFillComplete,
    enabled: isPlacingBlock,
  });

  // Handle slot click
  const handleSlotClick = useCallback(
    (row: number, col: number) => {
      const pos: GridPosition = { row, col };

      // If we're in placing mode and have a selected library block
      if (isPlacingBlock && selectedLibraryBlockId) {
        addBlockInstance(selectedLibraryBlockId, pos, placementRotation);
        return;
      }

      // If clicking an occupied slot, select the block instance there
      if (isPositionOccupied(pos)) {
        const instanceAtPos = blockInstances.find(
          (b) => b.position.row === row && b.position.col === col
        );
        if (instanceAtPos) {
          selectBlockInstance(instanceAtPos.id);
        }
        return;
      }
    },
    [isPlacingBlock, selectedLibraryBlockId, addBlockInstance, placementRotation, isPositionOccupied, blockInstances, selectBlockInstance]
  );

  // Handle click on background (outside grid)
  const handleBackgroundClick = useCallback(() => {
    clearSelections();
  }, [clearSelections]);

  // Handle slot hover for ghost preview
  const handleSlotMouseEnter = useCallback((row: number, col: number) => {
    if (isPlacingBlock) {
      setHoveredSlot({ row, col });
    }
  }, [isPlacingBlock]);

  const handleSlotMouseLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  // Calculate toolbar position for selected block instance
  const getToolbarPosition = useCallback(
    (instance: BlockInstance): { x: number; y: number } => {
      // Calculate block center in stage coordinates
      const blockCenterX = gridOffsetX + (instance.position.col + 0.5) * cellSize;
      const blockTopY = gridOffsetY + instance.position.row * cellSize;

      // Convert to screen coordinates
      return {
        x: blockCenterX * scale + position.x,
        y: blockTopY * scale + position.y,
      };
    },
    [gridOffsetX, gridOffsetY, cellSize, scale, position]
  );

  // Get the selected block instance
  const selectedInstance = selectedBlockInstanceId
    ? blockInstances.find((b) => b.id === selectedBlockInstanceId)
    : null;

  // Toolbar action handlers
  const handleRotate = useCallback(() => {
    if (selectedBlockInstanceId) {
      rotateBlockInstance(selectedBlockInstanceId);
    }
  }, [selectedBlockInstanceId, rotateBlockInstance]);

  const handleFlipHorizontal = useCallback(() => {
    if (selectedBlockInstanceId) {
      flipBlockInstanceHorizontal(selectedBlockInstanceId);
    }
  }, [selectedBlockInstanceId, flipBlockInstanceHorizontal]);

  const handleFlipVertical = useCallback(() => {
    if (selectedBlockInstanceId) {
      flipBlockInstanceVertical(selectedBlockInstanceId);
    }
  }, [selectedBlockInstanceId, flipBlockInstanceVertical]);

  const handleDelete = useCallback(() => {
    if (selectedBlockInstanceId) {
      removeBlockInstance(selectedBlockInstanceId);
    }
  }, [selectedBlockInstanceId, removeBlockInstance]);

  const handleToolbarDismiss = useCallback(() => {
    selectBlockInstance(null);
  }, [selectBlockInstance]);

  // Get the selected block for ghost preview
  const selectedBlock = selectedLibraryBlockId ? blockCache[selectedLibraryBlockId] : null;
  const selectedBlockShapes = selectedBlock ? getBlockShapes(selectedBlock) : [];

  // Build the grid of slots
  const slots: { row: number; col: number; isOccupied: boolean }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      slots.push({
        row,
        col,
        isOccupied: isPositionOccupied({ row, col }),
      });
    }
  }

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

              {/* Borders (rendered behind the quilt grid) */}
              {borderConfig?.enabled && (
                <BorderRenderer
                  borderConfig={borderConfig}
                  palette={palette}
                  quiltWidth={gridPixelWidth}
                  quiltHeight={gridPixelHeight}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                  pixelsPerInch={pixelsPerInch}
                />
              )}

              {/* Grid seam lines (like sewn quilt seams) */}
              <PatternGridLines
                rows={rows}
                cols={cols}
                cellSize={cellSize}
                offsetX={gridOffsetX}
                offsetY={gridOffsetY}
              />

              {/* Render empty slots */}
              {slots.map(({ row, col, isOccupied }) =>
                !isOccupied ? (
                  <EmptySlot
                    key={`slot-${row}-${col}`}
                    row={row}
                    col={col}
                    cellSize={cellSize}
                    offsetX={gridOffsetX}
                    offsetY={gridOffsetY}
                    isHighlighted={isPlacingBlock}
                    isHovered={hoveredSlot?.row === row && hoveredSlot?.col === col}
                    onClick={handleSlotClick}
                    onMouseEnter={handleSlotMouseEnter}
                    onMouseLeave={handleSlotMouseLeave}
                  />
                ) : null
              )}

              {/* Render placed block instances */}
              {blockInstances.map((instance) => {
                const block = blockCache[instance.blockId];
                if (!block) return null;

                // Extract shapes from block (handles API format with design_data)
                const shapes = getBlockShapes(block);
                if (shapes.length === 0) return null;

                return (
                  <BlockInstanceRenderer
                    key={instance.id}
                    instance={instance}
                    shapes={shapes}
                    blockGridSize={block.gridSize || 3}
                    palette={palette}
                    cellSize={cellSize}
                    offsetX={gridOffsetX}
                    offsetY={gridOffsetY}
                    isSelected={selectedBlockInstanceId === instance.id}
                    onClick={selectBlockInstance}
                  />
                );
              })}

              {/* Ghost preview when hovering empty slot in placement mode (not during drag) */}
              {isPlacingBlock && !isDragging && hoveredSlot && !isPreviewingFillEmpty && selectedBlock && selectedBlockShapes.length > 0 && (
                <Group opacity={0.5} listening={false}>
                  <BlockInstanceRenderer
                    instance={{
                      id: 'ghost-preview',
                      blockId: selectedLibraryBlockId!,
                      position: hoveredSlot,
                      rotation: placementRotation,
                      flipHorizontal: false,
                      flipVertical: false,
                    }}
                    shapes={selectedBlockShapes}
                    blockGridSize={selectedBlock.gridSize || 3}
                    palette={palette}
                    cellSize={cellSize}
                    offsetX={gridOffsetX}
                    offsetY={gridOffsetY}
                    isSelected={false}
                  />
                  {/* Rotation badge */}
                  {placementRotation !== 0 && (
                    <Text
                      x={gridOffsetX + hoveredSlot.col * cellSize + cellSize - 28}
                      y={gridOffsetY + hoveredSlot.row * cellSize + 4}
                      text={`${placementRotation}°`}
                      fontSize={12}
                      fontStyle="bold"
                      fill="#3B82F6"
                      listening={false}
                    />
                  )}
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

              {/* Ghost preview for all empty slots when hovering "Fill Empty" button */}
              {isPreviewingFillEmpty && selectedBlock && selectedBlockShapes.length > 0 && (
                <Group opacity={0.5} listening={false}>
                  {slots
                    .filter(({ isOccupied }) => !isOccupied)
                    .map(({ row, col }) => (
                      <BlockInstanceRenderer
                        key={`ghost-fill-${row}-${col}`}
                        instance={{
                          id: `ghost-fill-${row}-${col}`,
                          blockId: selectedLibraryBlockId!,
                          position: { row, col },
                          rotation: 0,
                          flipHorizontal: false,
                          flipVertical: false,
                        }}
                        shapes={selectedBlockShapes}
                        blockGridSize={selectedBlock.gridSize || 3}
                        palette={palette}
                        cellSize={cellSize}
                        offsetX={gridOffsetX}
                        offsetY={gridOffsetY}
                        isSelected={false}
                      />
                    ))}
                </Group>
              )}

              {/* Ghost preview for grid resize when hovering +/- buttons */}
              {previewingGridResize === 'add-row' && (
                <Rect
                  x={gridOffsetX}
                  y={gridResizePosition === 'start' ? gridOffsetY - cellSize : gridOffsetY + gridPixelHeight}
                  width={gridPixelWidth}
                  height={cellSize}
                  fill="#3B82F6"
                  opacity={0.3}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dash={[8, 4]}
                  listening={false}
                />
              )}
              {previewingGridResize === 'remove-row' && (
                <Rect
                  x={gridOffsetX}
                  y={gridResizePosition === 'start' ? gridOffsetY : gridOffsetY + gridPixelHeight - cellSize}
                  width={gridPixelWidth}
                  height={cellSize}
                  fill="#EF4444"
                  opacity={0.3}
                  stroke="#EF4444"
                  strokeWidth={2}
                  dash={[8, 4]}
                  listening={false}
                />
              )}
              {previewingGridResize === 'add-col' && (
                <Rect
                  x={gridResizePosition === 'start' ? gridOffsetX - cellSize : gridOffsetX + gridPixelWidth}
                  y={gridOffsetY}
                  width={cellSize}
                  height={gridPixelHeight}
                  fill="#3B82F6"
                  opacity={0.3}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dash={[8, 4]}
                  listening={false}
                />
              )}
              {previewingGridResize === 'remove-col' && (
                <Rect
                  x={gridResizePosition === 'start' ? gridOffsetX : gridOffsetX + gridPixelWidth - cellSize}
                  y={gridOffsetY}
                  width={cellSize}
                  height={gridPixelHeight}
                  fill="#EF4444"
                  opacity={0.3}
                  stroke="#EF4444"
                  strokeWidth={2}
                  dash={[8, 4]}
                  listening={false}
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

          {/* Placement mode indicator */}
          {isPlacingBlock && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
              Tap a slot to place • Press R to rotate
              <button
                onClick={clearSelections}
                className="ml-1 p-1 text-blue-100 hover:text-white hover:bg-blue-600 rounded"
                aria-label="Cancel placement"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Floating toolbar for selected block instance */}
          {selectedInstance && mode === 'editing_block' && (
            <FloatingToolbar
              position={getToolbarPosition(selectedInstance)}
              canRotate={true}
              canFlip={true}
              onRotate={handleRotate}
              onFlipHorizontal={handleFlipHorizontal}
              onFlipVertical={handleFlipVertical}
              onDelete={handleDelete}
              onDismiss={handleToolbarDismiss}
            />
          )}
        </>
      )}
    </div>
  );
}
