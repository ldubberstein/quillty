import type { BlockDesign, Cell, CellShape, Rotation } from './types';

export class BlockDesigner {
  private design: BlockDesign;

  constructor(gridSize: number = 4) {
    this.design = {
      gridSize,
      cells: this.initializeCells(gridSize),
      fabricMapping: {},
    };
  }

  private initializeCells(gridSize: number): Cell[] {
    const cells: Cell[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        cells.push({
          row,
          col,
          shape: 'square',
          rotation: 0,
          colors: ['#e5e5e5'], // default gray
        });
      }
    }
    return cells;
  }

  getDesign(): BlockDesign {
    return { ...this.design };
  }

  setGridSize(size: number): void {
    if (size < 2 || size > 12) {
      throw new Error('Grid size must be between 2 and 12');
    }
    this.design.gridSize = size;
    this.design.cells = this.initializeCells(size);
  }

  getCell(row: number, col: number): Cell | undefined {
    return this.design.cells.find((c) => c.row === row && c.col === col);
  }

  setCell(row: number, col: number, updates: Partial<Cell>): void {
    const index = this.design.cells.findIndex(
      (c) => c.row === row && c.col === col
    );
    if (index === -1) {
      throw new Error(`Cell at (${row}, ${col}) not found`);
    }
    this.design.cells[index] = {
      ...this.design.cells[index],
      ...updates,
    };
  }

  setCellShape(row: number, col: number, shape: CellShape): void {
    const colorsCount = shape === 'square' ? 1 : shape === 'hst' ? 2 : 4;
    const cell = this.getCell(row, col);
    const currentColors = cell?.colors || [];
    const colors = Array(colorsCount)
      .fill('#e5e5e5')
      .map((c, i) => currentColors[i] || c);

    this.setCell(row, col, { shape, colors });
  }

  setCellColor(row: number, col: number, colorIndex: number, color: string): void {
    const cell = this.getCell(row, col);
    if (!cell) return;

    const colors = [...cell.colors];
    colors[colorIndex] = color;
    this.setCell(row, col, { colors });
  }

  rotateCellClockwise(row: number, col: number): void {
    const cell = this.getCell(row, col);
    if (!cell) return;

    const rotations: Rotation[] = [0, 90, 180, 270];
    const currentIndex = rotations.indexOf(cell.rotation);
    const nextRotation = rotations[(currentIndex + 1) % 4];
    this.setCell(row, col, { rotation: nextRotation });
  }

  mirrorHorizontal(): void {
    const { gridSize, cells } = this.design;
    const newCells: Cell[] = [];

    for (const cell of cells) {
      const mirroredCol = gridSize - 1 - cell.col;
      newCells.push({
        ...cell,
        col: mirroredCol,
      });
    }

    this.design.cells = newCells;
  }

  mirrorVertical(): void {
    const { gridSize, cells } = this.design;
    const newCells: Cell[] = [];

    for (const cell of cells) {
      const mirroredRow = gridSize - 1 - cell.row;
      newCells.push({
        ...cell,
        row: mirroredRow,
      });
    }

    this.design.cells = newCells;
  }

  countPieces(): number {
    let count = 0;
    for (const cell of this.design.cells) {
      switch (cell.shape) {
        case 'square':
          count += 1;
          break;
        case 'hst':
          count += 2;
          break;
        case 'qst':
          count += 4;
          break;
      }
    }
    return count;
  }

  loadDesign(design: BlockDesign): void {
    this.design = { ...design };
  }

  toJSON(): string {
    return JSON.stringify(this.design);
  }

  static fromJSON(json: string): BlockDesigner {
    const design = JSON.parse(json) as BlockDesign;
    const designer = new BlockDesigner(design.gridSize);
    designer.loadDesign(design);
    return designer;
  }
}
