import type { QuiltDesign } from '../pattern-designer/types';
import type { BlockDesign } from '../block-designer/types';
import type { CuttingInstruction, Cut } from './types';

const SEAM_ALLOWANCE = 0.5; // 1/4" on each side

export function calculateCuttingList(
  design: QuiltDesign,
  blockLibrary: Map<string, BlockDesign>
): CuttingInstruction[] {
  const cuttingMap: Map<string, Map<string, number>> = new Map(); // color -> (cutSize -> quantity)
  const colorMap: Map<string, string> = new Map(); // key -> color

  // Calculate cuts for blocks
  for (const placedBlock of design.blocks) {
    const blockDesign = blockLibrary.get(placedBlock.blockId);
    if (!blockDesign) continue;

    const cellSize = design.blockSize / blockDesign.gridSize;

    for (const cell of blockDesign.cells) {
      for (let i = 0; i < cell.colors.length; i++) {
        const color = placedBlock.colorOverrides?.[cell.colors[i]] || cell.colors[i];

        let cutSize: string;
        switch (cell.shape) {
          case 'square':
            cutSize = formatCutSize(cellSize + SEAM_ALLOWANCE, cellSize + SEAM_ALLOWANCE, 'square');
            break;
          case 'hst': {
            // HST starting square is finish size + 7/8"
            const hstSize = cellSize + 0.875;
            cutSize = formatCutSize(hstSize, hstSize, 'hst');
            break;
          }
          case 'qst': {
            // QST starting square is finish size + 1.25"
            const qstSize = cellSize + 1.25;
            cutSize = formatCutSize(qstSize, qstSize, 'qst');
            break;
          }
          default:
            cutSize = formatCutSize(cellSize + SEAM_ALLOWANCE, cellSize + SEAM_ALLOWANCE, 'square');
        }

        colorMap.set(color, color);

        if (!cuttingMap.has(color)) {
          cuttingMap.set(color, new Map());
        }
        const colorCuts = cuttingMap.get(color)!;
        colorCuts.set(cutSize, (colorCuts.get(cutSize) || 0) + 1);
      }
    }
  }

  // Convert to cutting instructions
  const instructions: CuttingInstruction[] = [];

  for (const [fabricKey, cuts] of cuttingMap) {
    const cutList: Cut[] = [];

    for (const [cutSize, quantity] of cuts) {
      const parsed = parseCutSize(cutSize);
      cutList.push({
        width: parsed.width,
        height: parsed.height,
        quantity,
        description: parsed.description,
      });
    }

    // Sort by size (largest first)
    cutList.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    instructions.push({
      fabricKey,
      color: colorMap.get(fabricKey) || fabricKey,
      cuts: cutList,
    });
  }

  return instructions;
}

function formatCutSize(width: number, height: number, type: string): string {
  return `${width.toFixed(3)}x${height.toFixed(3)}|${type}`;
}

function parseCutSize(cutSize: string): { width: number; height: number; description: string } {
  const [dimensions, type] = cutSize.split('|');
  const [width, height] = dimensions.split('x').map(Number);

  const widthStr = formatMeasurement(width);
  const heightStr = formatMeasurement(height);

  let description: string;
  switch (type) {
    case 'square':
      description = `${widthStr}" × ${heightStr}" squares`;
      break;
    case 'hst':
      description = `${widthStr}" squares for half-square triangles`;
      break;
    case 'qst':
      description = `${widthStr}" squares for quarter-square triangles`;
      break;
    default:
      description = `${widthStr}" × ${heightStr}"`;
  }

  return { width, height, description };
}

function formatMeasurement(inches: number): string {
  const whole = Math.floor(inches);
  const fraction = inches - whole;

  if (fraction < 0.0625) return `${whole}`;
  if (fraction < 0.1875) return `${whole}⅛`;
  if (fraction < 0.3125) return `${whole}¼`;
  if (fraction < 0.4375) return `${whole}⅜`;
  if (fraction < 0.5625) return `${whole}½`;
  if (fraction < 0.6875) return `${whole}⅝`;
  if (fraction < 0.8125) return `${whole}¾`;
  if (fraction < 0.9375) return `${whole}⅞`;
  return `${whole + 1}`;
}
