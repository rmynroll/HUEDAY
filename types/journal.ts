export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  color: string;
  strokeWidth: number;
  isEraser: boolean;
}
