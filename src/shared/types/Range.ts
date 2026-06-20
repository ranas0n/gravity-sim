export interface Range {
  readonly min: number;
  readonly max: number;
}

export const clamp = (value: number, range: Range): number =>
  Math.min(range.max, Math.max(range.min, value));
