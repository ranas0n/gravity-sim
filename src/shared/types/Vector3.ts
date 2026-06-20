export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const ZERO_VECTOR: Vector3 = Object.freeze({ x: 0, y: 0, z: 0 });

export const createVector3 = (x = 0, y = 0, z = 0): Vector3 =>
  Object.freeze({ x, y, z });

export const addVectors = (left: Vector3, right: Vector3): Vector3 =>
  createVector3(left.x + right.x, left.y + right.y, left.z + right.z);

export const subtractVectors = (left: Vector3, right: Vector3): Vector3 =>
  createVector3(left.x - right.x, left.y - right.y, left.z - right.z);

export const multiplyVector = (vector: Vector3, scalar: number): Vector3 =>
  createVector3(vector.x * scalar, vector.y * scalar, vector.z * scalar);

export const dotProduct = (left: Vector3, right: Vector3): number =>
  left.x * right.x + left.y * right.y + left.z * right.z;

export const vectorLengthSquared = (vector: Vector3): number => dotProduct(vector, vector);

export const vectorLength = (vector: Vector3): number => Math.sqrt(vectorLengthSquared(vector));

export const normalizeVector = (vector: Vector3): Vector3 => {
  const length = vectorLength(vector);
  if (length === 0) {
    return ZERO_VECTOR;
  }

  return multiplyVector(vector, 1 / length);
};

export const distanceBetween = (left: Vector3, right: Vector3): number =>
  vectorLength(subtractVectors(right, left));

export const toThreeVector = (
  vector: Vector3,
  ThreeVector: new (x?: number, y?: number, z?: number) => { x: number; y: number; z: number }
): { x: number; y: number; z: number } => new ThreeVector(vector.x, vector.y, vector.z);
