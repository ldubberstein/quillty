'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { GridLines } from './GridLines';
import { ZoomControls } from './ZoomControls';
import { useBlockDesignerStore } from '@quillty/core';

/** Canvas sizing constants */
const CANVAS_PADDING = 40;
const MIN_CELL_SIZE = 60;
const MAX_CELL_SIZE = 150;

export function BlockCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get block from store
  const block = useBlockDesignerStore((state) => state.block);
  const { gridSize } = block;

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
  // Min zoom: grid height should be at least half the viewport height
  // Max zoom: 3x (drag constraints keep grid visible)
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

  // Update dimensions on resize - always measure from container
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

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver for more reliable size tracking
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

  // Zoom handlers with dynamic bounds
  const handleZoomIn = useCallback(() => {
    setScale((s) => {
      const newScale = Math.min(s + 0.25, maxScale);
      // Constrain position after zoom change
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

  // Handle wheel zoom with dynamic bounds
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Zoom toward pointer position
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    // Calculate new scale with dynamic bounds
    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Constrain position to keep grid in bounds
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

  // Constrain drag to keep grid partially visible
  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      // Calculate the grid bounds in screen space
      const scaledGridSize = gridPixelSize * scale;
      const gridLeft = gridOffsetX * scale + pos.x;
      const gridRight = gridLeft + scaledGridSize;
      const gridTop = gridOffsetY * scale + pos.y;
      const gridBottom = gridTop + scaledGridSize;

      // Minimum visible portion of grid (at least 20% must stay visible)
      const minVisible = Math.min(scaledGridSize * 0.2, 100);

      let newX = pos.x;
      let newY = pos.y;

      // Prevent dragging grid completely off the right edge
      if (gridRight < minVisible) {
        newX = minVisible - (gridOffsetX * scale + scaledGridSize);
      }
      // Prevent dragging grid completely off the left edge
      if (gridLeft > dimensions.width - minVisible) {
        newX = dimensions.width - minVisible - gridOffsetX * scale;
      }
      // Prevent dragging grid completely off the bottom edge
      if (gridBottom < minVisible) {
        newY = minVisible - (gridOffsetY * scale + scaledGridSize);
      }
      // Prevent dragging grid completely off the top edge
      if (gridTop > dimensions.height - minVisible) {
        newY = dimensions.height - minVisible - gridOffsetY * scale;
      }

      return { x: newX, y: newY };
    },
    [scale, gridPixelSize, gridOffsetX, gridOffsetY, dimensions.width, dimensions.height]
  );

  // Handle click on empty area (deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect if clicking on the stage itself (not shapes)
    if (e.target === e.target.getStage()) {
      useBlockDesignerStore.getState().clearSelection();
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100 overflow-hidden">
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
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          <GridLines
            gridSize={gridSize}
            cellSize={cellSize}
            offsetX={gridOffsetX}
            offsetY={gridOffsetY}
          />
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
    </div>
  );
}
