import type { QuiltDesign, PlacedBlock, BorderConfig, SashingConfig, Rotation } from './types';

export class PatternDesigner {
  private design: QuiltDesign;

  constructor(rows: number = 5, columns: number = 5) {
    this.design = {
      rows,
      columns,
      blockSize: 12, // 12" blocks by default
      blocks: [],
      sashing: null,
      borders: [],
      fabricMapping: {},
    };
  }

  getDesign(): QuiltDesign {
    return { ...this.design };
  }

  setDimensions(rows: number, columns: number): void {
    if (rows < 1 || rows > 20 || columns < 1 || columns > 20) {
      throw new Error('Dimensions must be between 1 and 20');
    }
    this.design.rows = rows;
    this.design.columns = columns;
    // Remove blocks that are now out of bounds
    this.design.blocks = this.design.blocks.filter(
      (b) => b.row < rows && b.col < columns
    );
  }

  setBlockSize(inches: number): void {
    if (inches <= 0) {
      throw new Error('Block size must be positive');
    }
    this.design.blockSize = inches;
  }

  placeBlock(row: number, col: number, blockId: string, rotation: Rotation = 0): void {
    if (row < 0 || row >= this.design.rows || col < 0 || col >= this.design.columns) {
      throw new Error('Block position out of bounds');
    }

    // Remove existing block at this position
    this.design.blocks = this.design.blocks.filter(
      (b) => !(b.row === row && b.col === col)
    );

    this.design.blocks.push({
      row,
      col,
      blockId,
      rotation,
    });
  }

  removeBlock(row: number, col: number): void {
    this.design.blocks = this.design.blocks.filter(
      (b) => !(b.row === row && b.col === col)
    );
  }

  getBlock(row: number, col: number): PlacedBlock | undefined {
    return this.design.blocks.find((b) => b.row === row && b.col === col);
  }

  rotateBlock(row: number, col: number): void {
    const block = this.getBlock(row, col);
    if (!block) return;

    const rotations: Rotation[] = [0, 90, 180, 270];
    const currentIndex = rotations.indexOf(block.rotation);
    block.rotation = rotations[(currentIndex + 1) % 4];
  }

  setBlockColorOverride(row: number, col: number, fabricKey: string, color: string): void {
    const block = this.getBlock(row, col);
    if (!block) return;

    if (!block.colorOverrides) {
      block.colorOverrides = {};
    }
    block.colorOverrides[fabricKey] = color;
  }

  setSashing(config: SashingConfig | null): void {
    this.design.sashing = config;
  }

  addBorder(config: BorderConfig): void {
    this.design.borders.push(config);
  }

  removeBorder(index: number): void {
    this.design.borders.splice(index, 1);
  }

  setFabric(key: string, value: string): void {
    this.design.fabricMapping[key] = value;
  }

  // Calculate finished quilt dimensions
  getFinishedDimensions(): { width: number; height: number } {
    const { rows, columns, blockSize, sashing, borders } = this.design;

    let width = columns * blockSize;
    let height = rows * blockSize;

    // Add sashing
    if (sashing?.enabled) {
      width += (columns - 1) * sashing.width;
      height += (rows - 1) * sashing.width;
    }

    // Add borders
    for (const border of borders) {
      width += border.width * 2;
      height += border.width * 2;
    }

    return { width, height };
  }

  fillWithBlock(blockId: string): void {
    this.design.blocks = [];
    for (let row = 0; row < this.design.rows; row++) {
      for (let col = 0; col < this.design.columns; col++) {
        this.placeBlock(row, col, blockId);
      }
    }
  }

  fillAlternating(blockId1: string, blockId2: string): void {
    this.design.blocks = [];
    for (let row = 0; row < this.design.rows; row++) {
      for (let col = 0; col < this.design.columns; col++) {
        const isEven = (row + col) % 2 === 0;
        this.placeBlock(row, col, isEven ? blockId1 : blockId2);
      }
    }
  }

  loadDesign(design: QuiltDesign): void {
    this.design = { ...design };
  }

  toJSON(): string {
    return JSON.stringify(this.design);
  }

  static fromJSON(json: string): PatternDesigner {
    const design = JSON.parse(json) as QuiltDesign;
    const designer = new PatternDesigner(design.rows, design.columns);
    designer.loadDesign(design);
    return designer;
  }
}
