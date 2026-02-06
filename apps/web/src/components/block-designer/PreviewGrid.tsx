'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Group, Rect, Line } from 'react-konva';
import {
  useBlockDesignerStore,
  usePreviewRotationPreset,
  getUnitTrianglesWithColors,
  type PreviewRotationPreset,
  type Rotation,
  type Unit,
  type Palette,
  type GridSize,
} from '@quillty/core';

/** Padding around the preview grid */
const PREVIEW_PADDING = 20;

/** Gap between block instances in the grid */
const BLOCK_GAP = 0;

/** Calculate rotation for each position in the 3x3 grid based on preset */
function getRotationsForPreset(preset: PreviewRotationPreset): Rotation[][] {
  switch (preset) {
    case 'all_same':
      return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
    case 'alternating':
      return [
        [0, 90, 0],
        [90, 0, 90],
        [0, 90, 0],
      ];
    case 'pinwheel':
      return [
        [0, 90, 180],
        [270, 0, 90],
        [180, 270, 0],
      ];
    case 'random': {
      // Generate stable random rotations (seeded by position)
      const rotations: Rotation[] = [0, 90, 180, 270];
      return [
        [rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)]],
        [rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)]],
        [rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)], rotations[Math.floor(Math.random() * 4)]],
      ];
    }
    default:
      return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
  }
}

interface PreviewBlockProps {
  units: Unit[];
  palette: Palette;
  gridSize: GridSize;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
}

/** Render a single block instance with rotation */
function PreviewBlock({
  units,
  palette,
  gridSize,
  cellSize,
  offsetX,
  offsetY,
  rotation,
}: PreviewBlockProps) {
  const blockSize = gridSize * cellSize;

  // Render units using RELATIVE coordinates (0 to blockSize)
  // The Group handles positioning on the stage
  const renderUnit = (unit: Unit) => {
    const x = unit.position.col * cellSize;
    const y = unit.position.row * cellSize;
    const triangles = getUnitTrianglesWithColors(unit, cellSize, palette);

    return (
      <Group key={unit.id} x={x} y={y}>
        {triangles.map((tri, i) => (
          <Line key={i} points={tri.points} fill={tri.color} stroke="#9CA3AF" strokeWidth={1} closed />
        ))}
      </Group>
    );
  };

  return (
    <Group
      x={offsetX + blockSize / 2}
      y={offsetY + blockSize / 2}
      rotation={rotation}
      offsetX={blockSize / 2}
      offsetY={blockSize / 2}
    >
      {/* Block background - relative coordinates */}
      <Rect
        x={0}
        y={0}
        width={blockSize}
        height={blockSize}
        fill="#FFFFFF"
        stroke="#D1D5DB"
        strokeWidth={1}
      />
      {/* Render all units */}
      {units.map(renderUnit)}
    </Group>
  );
}

export function PreviewGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const block = useBlockDesignerStore((state) => state.block);
  const exitPreview = useBlockDesignerStore((state) => state.exitPreview);
  const previewRotationPreset = usePreviewRotationPreset();

  const { gridSize, units, previewPalette } = block;

  // Calculate rotations for current preset (memoized to keep random stable)
  const rotations = useMemo(
    () => getRotationsForPreset(previewRotationPreset),
    [previewRotationPreset]
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

  // Calculate block size to fit 3x3 grid in available space
  const availableWidth = dimensions.width - PREVIEW_PADDING * 2;
  const availableHeight = dimensions.height - PREVIEW_PADDING * 2;
  const totalGapWidth = BLOCK_GAP * 2;
  const totalGapHeight = BLOCK_GAP * 2;

  // Each block is gridSize cells, we need to fit 3 blocks
  const blockPixelSize = Math.min(
    (availableWidth - totalGapWidth) / 3,
    (availableHeight - totalGapHeight) / 3
  );
  const cellSize = blockPixelSize / gridSize;

  // Calculate total grid dimensions
  const totalGridWidth = blockPixelSize * 3 + totalGapWidth;
  const totalGridHeight = blockPixelSize * 3 + totalGapHeight;

  // Center the grid
  const startX = (dimensions.width - totalGridWidth) / 2;
  const startY = (dimensions.height - totalGridHeight) / 2;

  // Handle click to exit preview
  const handleClick = useCallback(() => {
    exitPreview();
  }, [exitPreview]);

  const hasValidDimensions = dimensions.width > 0 && dimensions.height > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {!hasValidDimensions && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500">Loading preview...</div>
        </div>
      )}
      {hasValidDimensions && (
        <>
          <Stage width={dimensions.width} height={dimensions.height}>
            <Layer>
              {/* Render 3x3 grid of blocks */}
              {[0, 1, 2].map((row) =>
                [0, 1, 2].map((col) => {
                  const blockX = startX + col * (blockPixelSize + BLOCK_GAP);
                  const blockY = startY + row * (blockPixelSize + BLOCK_GAP);
                  const rotation = rotations[row][col];

                  return (
                    <PreviewBlock
                      key={`${row}-${col}`}
                      units={units}
                      palette={previewPalette}
                      gridSize={gridSize}
                      cellSize={cellSize}
                      offsetX={blockX}
                      offsetY={blockY}
                      rotation={rotation}
                    />
                  );
                })
              )}
            </Layer>
          </Stage>

          {/* Exit hint */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            Tap anywhere to exit preview
          </div>
        </>
      )}
    </div>
  );
}
