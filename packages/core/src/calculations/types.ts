export interface FabricRequirement {
  fabricKey: string;
  color: string;
  yardage: number;
  usage: string; // e.g., "blocks", "sashing", "border", "binding"
}

export interface FabricRequirements {
  fabrics: FabricRequirement[];
  totalYardage: number;
  backing: {
    width: number;
    height: number;
    yardage: number;
  };
  binding: {
    strips: number;
    yardage: number;
  };
}

export interface CuttingInstruction {
  fabricKey: string;
  color: string;
  cuts: Cut[];
}

export interface Cut {
  width: number; // in inches
  height: number; // in inches
  quantity: number;
  description: string; // e.g., "4.5\" x 4.5\" squares"
}
