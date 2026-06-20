import { clamp, Range } from '../types/Range';

export const mapRange = (
  value: number,
  inputRange: Range,
  outputRange: Range
): number => {
  const normalized = (value - inputRange.min) / (inputRange.max - inputRange.min);
  return outputRange.min + normalized * (outputRange.max - outputRange.min);
};

export const lerp = (left: number, right: number, amount: number): number =>
  left + (right - left) * amount;

export const clamp01 = (value: number): number => clamp(value, { min: 0, max: 1 });
