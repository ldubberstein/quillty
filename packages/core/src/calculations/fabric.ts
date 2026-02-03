import type { QuiltDesign } from '../pattern-designer/types';
import type { BlockDesign } from '../block-designer/types';
import type { FabricRequirements, FabricRequirement } from './types';

const SEAM_ALLOWANCE = 0.25; // 1/4" seam allowance
const FABRIC_WIDTH = 42; // standard quilting cotton width

export function calculateFabricRequirements(
  design: QuiltDesign,
  blockLibrary: Map<string, BlockDesign>
): FabricRequirements {
  const fabricUsage: Map<string, { area: number; color: string; usage: string }> = new Map();

  // Calculate fabric for blocks
  for (const placedBlock of design.blocks) {
    const blockDesign = blockLibrary.get(placedBlock.blockId);
    if (!blockDesign) continue;

    const cellSize = design.blockSize / blockDesign.gridSize;
    const cutSize = cellSize + SEAM_ALLOWANCE * 2;

    for (const cell of blockDesign.cells) {
      for (let i = 0; i < cell.colors.length; i++) {
        const color = placedBlock.colorOverrides?.[cell.colors[i]] || cell.colors[i];
        const key = color;

        const existing = fabricUsage.get(key) || { area: 0, color, usage: 'blocks' };

        // Calculate area based on shape
        let pieceArea: number;
        switch (cell.shape) {
          case 'square':
            pieceArea = cutSize * cutSize;
            break;
          case 'hst':
            // Half-square triangles cut from larger square
            pieceArea = (cutSize + 0.875) * (cutSize + 0.875) / 2;
            break;
          case 'qst':
            // Quarter-square triangles
            pieceArea = (cutSize + 1.25) * (cutSize + 1.25) / 4;
            break;
          default:
            pieceArea = cutSize * cutSize;
        }

        existing.area += pieceArea;
        fabricUsage.set(key, existing);
      }
    }
  }

  // Calculate fabric for sashing
  if (design.sashing?.enabled) {
    const { width, color } = design.sashing;
    const horizontalStrips = design.rows * (design.columns - 1);
    const verticalStrips = design.columns * (design.rows - 1);
    const stripLength = design.blockSize + SEAM_ALLOWANCE * 2;
    const stripWidth = width + SEAM_ALLOWANCE * 2;

    const totalStrips = horizontalStrips + verticalStrips;
    const area = totalStrips * stripLength * stripWidth;

    const existing = fabricUsage.get(color) || { area: 0, color, usage: 'sashing' };
    existing.area += area;
    existing.usage = 'sashing';
    fabricUsage.set(color, existing);
  }

  // Calculate fabric for borders
  const dimensions = calculateQuiltDimensions(design);
  let currentWidth = dimensions.width;
  let currentHeight = dimensions.height;

  for (const border of design.borders) {
    const stripWidth = border.width + SEAM_ALLOWANCE * 2;
    const topBottom = 2 * currentWidth * stripWidth;
    const leftRight = 2 * (currentHeight + border.width * 2) * stripWidth;
    const area = topBottom + leftRight;

    const existing = fabricUsage.get(border.color) || { area: 0, color: border.color, usage: 'border' };
    existing.area += area;
    existing.usage = 'border';
    fabricUsage.set(border.color, existing);

    currentWidth += border.width * 2;
    currentHeight += border.width * 2;
  }

  // Convert area to yardage
  const fabrics: FabricRequirement[] = [];
  let totalYardage = 0;

  for (const [key, { area, color, usage }] of fabricUsage) {
    // Add 10% for waste
    const adjustedArea = area * 1.1;
    // Convert to yards (fabric width in inches, divide by 36 for yards)
    const yardage = Math.ceil((adjustedArea / FABRIC_WIDTH) / 36 * 8) / 8; // round up to nearest 1/8 yard

    fabrics.push({ fabricKey: key, color, yardage, usage });
    totalYardage += yardage;
  }

  // Calculate backing
  const backingWidth = currentWidth + 4; // 2" overhang each side
  const backingHeight = currentHeight + 4;
  const backingYardage = Math.ceil((backingHeight / 36) * 8) / 8;

  // Calculate binding (2.5" strips)
  const perimeter = 2 * (currentWidth + currentHeight) + 10; // extra for joining
  const bindingStrips = Math.ceil(perimeter / FABRIC_WIDTH);
  const bindingYardage = Math.ceil((bindingStrips * 2.5) / 36 * 8) / 8;

  return {
    fabrics,
    totalYardage,
    backing: {
      width: backingWidth,
      height: backingHeight,
      yardage: backingYardage,
    },
    binding: {
      strips: bindingStrips,
      yardage: bindingYardage,
    },
  };
}

function calculateQuiltDimensions(design: QuiltDesign): { width: number; height: number } {
  let width = design.columns * design.blockSize;
  let height = design.rows * design.blockSize;

  if (design.sashing?.enabled) {
    width += (design.columns - 1) * design.sashing.width;
    height += (design.rows - 1) * design.sashing.width;
  }

  return { width, height };
}
