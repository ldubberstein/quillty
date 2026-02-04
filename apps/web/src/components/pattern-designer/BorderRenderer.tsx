'use client';

import { Group, Rect, Line } from 'react-konva';
import type { BorderConfig, Palette, Border } from '@quillty/core';

interface BorderRendererProps {
  /** Border configuration from the pattern */
  borderConfig: BorderConfig | null;
  /** Pattern palette for colors */
  palette: Palette;
  /** Width of the quilt grid in pixels */
  quiltWidth: number;
  /** Height of the quilt grid in pixels */
  quiltHeight: number;
  /** X offset of the quilt grid */
  offsetX: number;
  /** Y offset of the quilt grid */
  offsetY: number;
  /** Pixels per inch for converting border widths */
  pixelsPerInch: number;
}

/** Get color from palette by fabric role ID */
function getColor(palette: Palette, roleId: string): string {
  const role = palette.roles.find((r) => r.id === roleId);
  return role?.color ?? '#CCCCCC';
}

/** Border seam line styling */
const BORDER_SEAM_COLOR = '#9CA3AF'; // gray-400
const BORDER_SEAM_WIDTH = 1;

/**
 * BorderRenderer - Renders quilt borders around the pattern grid
 *
 * Renders borders from innermost to outermost, supporting:
 * - Plain borders (solid color)
 * - Three corner styles: butted, mitered, cornerstone
 */
export function BorderRenderer({
  borderConfig,
  palette,
  quiltWidth,
  quiltHeight,
  offsetX,
  offsetY,
  pixelsPerInch,
}: BorderRendererProps) {
  if (!borderConfig?.enabled || borderConfig.borders.length === 0) {
    return null;
  }

  // Calculate total border width to position borders correctly
  const totalBorderPixels = borderConfig.borders.reduce(
    (sum, b) => sum + b.widthInches * pixelsPerInch,
    0
  );

  // Start from the outermost position and work inward
  let currentOffsetX = offsetX - totalBorderPixels;
  let currentOffsetY = offsetY - totalBorderPixels;
  let currentWidth = quiltWidth + totalBorderPixels * 2;
  let currentHeight = quiltHeight + totalBorderPixels * 2;

  // Render borders from outermost to innermost
  const borderElements: JSX.Element[] = [];
  const bordersReversed = [...borderConfig.borders].reverse();

  bordersReversed.forEach((border, reversedIndex) => {
    const borderWidthPx = border.widthInches * pixelsPerInch;
    const color = getColor(palette, border.fabricRole);
    const cornerstoneColor = border.cornerstoneFabricRole
      ? getColor(palette, border.cornerstoneFabricRole)
      : color;

    const outerX = currentOffsetX;
    const outerY = currentOffsetY;
    const outerWidth = currentWidth;
    const outerHeight = currentHeight;
    const innerX = outerX + borderWidthPx;
    const innerY = outerY + borderWidthPx;
    const innerWidth = outerWidth - borderWidthPx * 2;
    const innerHeight = outerHeight - borderWidthPx * 2;

    // Update for next (inner) border
    currentOffsetX = innerX;
    currentOffsetY = innerY;
    currentWidth = innerWidth;
    currentHeight = innerHeight;

    const key = `border-${border.id}`;

    if (border.cornerStyle === 'butted') {
      // Butted corners: top/bottom full width, sides between them
      borderElements.push(
        <Group key={key}>
          {/* Top strip (full width) */}
          <Rect
            x={outerX}
            y={outerY}
            width={outerWidth}
            height={borderWidthPx}
            fill={color}
          />
          {/* Bottom strip (full width) */}
          <Rect
            x={outerX}
            y={outerY + outerHeight - borderWidthPx}
            width={outerWidth}
            height={borderWidthPx}
            fill={color}
          />
          {/* Left strip (between top and bottom) */}
          <Rect
            x={outerX}
            y={outerY + borderWidthPx}
            width={borderWidthPx}
            height={outerHeight - borderWidthPx * 2}
            fill={color}
          />
          {/* Right strip (between top and bottom) */}
          <Rect
            x={outerX + outerWidth - borderWidthPx}
            y={outerY + borderWidthPx}
            width={borderWidthPx}
            height={outerHeight - borderWidthPx * 2}
            fill={color}
          />
          {/* Seam lines */}
          <Line
            points={[innerX, outerY, innerX, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, outerY, innerX + innerWidth, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX, innerY + innerHeight, innerX, outerY + outerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, innerY + innerHeight, innerX + innerWidth, outerY + outerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
        </Group>
      );
    } else if (border.cornerStyle === 'cornerstone') {
      // Cornerstone: separate corner squares
      borderElements.push(
        <Group key={key}>
          {/* Top strip (between cornerstones) */}
          <Rect
            x={outerX + borderWidthPx}
            y={outerY}
            width={outerWidth - borderWidthPx * 2}
            height={borderWidthPx}
            fill={color}
          />
          {/* Bottom strip (between cornerstones) */}
          <Rect
            x={outerX + borderWidthPx}
            y={outerY + outerHeight - borderWidthPx}
            width={outerWidth - borderWidthPx * 2}
            height={borderWidthPx}
            fill={color}
          />
          {/* Left strip (between cornerstones) */}
          <Rect
            x={outerX}
            y={outerY + borderWidthPx}
            width={borderWidthPx}
            height={outerHeight - borderWidthPx * 2}
            fill={color}
          />
          {/* Right strip (between cornerstones) */}
          <Rect
            x={outerX + outerWidth - borderWidthPx}
            y={outerY + borderWidthPx}
            width={borderWidthPx}
            height={outerHeight - borderWidthPx * 2}
            fill={color}
          />
          {/* Cornerstones */}
          <Rect
            x={outerX}
            y={outerY}
            width={borderWidthPx}
            height={borderWidthPx}
            fill={cornerstoneColor}
          />
          <Rect
            x={outerX + outerWidth - borderWidthPx}
            y={outerY}
            width={borderWidthPx}
            height={borderWidthPx}
            fill={cornerstoneColor}
          />
          <Rect
            x={outerX}
            y={outerY + outerHeight - borderWidthPx}
            width={borderWidthPx}
            height={borderWidthPx}
            fill={cornerstoneColor}
          />
          <Rect
            x={outerX + outerWidth - borderWidthPx}
            y={outerY + outerHeight - borderWidthPx}
            width={borderWidthPx}
            height={borderWidthPx}
            fill={cornerstoneColor}
          />
          {/* Seam lines around cornerstones */}
          <Line
            points={[innerX, outerY, innerX, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[outerX, innerY, innerX, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, outerY, innerX + innerWidth, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, innerY, outerX + outerWidth, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX, innerY + innerHeight, innerX, outerY + outerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[outerX, innerY + innerHeight, innerX, innerY + innerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, innerY + innerHeight, innerX + innerWidth, outerY + outerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[innerX + innerWidth, innerY + innerHeight, outerX + outerWidth, innerY + innerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
        </Group>
      );
    } else if (border.cornerStyle === 'mitered') {
      // Mitered: 45-degree diagonal corners
      borderElements.push(
        <Group key={key}>
          {/* Top trapezoid */}
          <Line
            points={[
              outerX, outerY,
              outerX + outerWidth, outerY,
              innerX + innerWidth, innerY,
              innerX, innerY,
            ]}
            closed
            fill={color}
          />
          {/* Bottom trapezoid */}
          <Line
            points={[
              innerX, innerY + innerHeight,
              innerX + innerWidth, innerY + innerHeight,
              outerX + outerWidth, outerY + outerHeight,
              outerX, outerY + outerHeight,
            ]}
            closed
            fill={color}
          />
          {/* Left trapezoid */}
          <Line
            points={[
              outerX, outerY,
              innerX, innerY,
              innerX, innerY + innerHeight,
              outerX, outerY + outerHeight,
            ]}
            closed
            fill={color}
          />
          {/* Right trapezoid */}
          <Line
            points={[
              innerX + innerWidth, innerY,
              outerX + outerWidth, outerY,
              outerX + outerWidth, outerY + outerHeight,
              innerX + innerWidth, innerY + innerHeight,
            ]}
            closed
            fill={color}
          />
          {/* Diagonal seam lines at corners */}
          <Line
            points={[outerX, outerY, innerX, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[outerX + outerWidth, outerY, innerX + innerWidth, innerY]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[outerX, outerY + outerHeight, innerX, innerY + innerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
          <Line
            points={[outerX + outerWidth, outerY + outerHeight, innerX + innerWidth, innerY + innerHeight]}
            stroke={BORDER_SEAM_COLOR}
            strokeWidth={BORDER_SEAM_WIDTH}
          />
        </Group>
      );
    }
  });

  // Add outer border stroke
  const outerBorderX = offsetX - totalBorderPixels;
  const outerBorderY = offsetY - totalBorderPixels;
  const outerBorderWidth = quiltWidth + totalBorderPixels * 2;
  const outerBorderHeight = quiltHeight + totalBorderPixels * 2;

  borderElements.push(
    <Rect
      key="outer-stroke"
      x={outerBorderX}
      y={outerBorderY}
      width={outerBorderWidth}
      height={outerBorderHeight}
      stroke="#6B7280"
      strokeWidth={2}
      listening={false}
    />
  );

  return <Group listening={false}>{borderElements}</Group>;
}
