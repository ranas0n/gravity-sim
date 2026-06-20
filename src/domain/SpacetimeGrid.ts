import { SimulationSettings } from './SimulationSettings';
import { CelestialBody } from './CelestialBody';
import {
  Vector3,
  addVectors,
  createVector3,
  multiplyVector,
  normalizeVector,
  subtractVectors,
  vectorLength
} from '../shared/types/Vector3';

export interface GridVertex {
  readonly basePosition: Vector3;
  readonly position: Vector3;
  readonly potential: number;
}

export interface SpacetimeGrid {
  readonly size: number;
  readonly segments: number;
  readonly vertices: readonly GridVertex[];
  readonly indices: readonly number[];
}

export const createSpacetimeGrid = (size: number, segments: number): SpacetimeGrid => {
  const vertices: GridVertex[] = [];
  const indices: number[] = [];
  const halfSize = size / 2;
  const step = size / segments;
  const pointsPerAxis = segments + 1;

  for (let y = 0; y <= segments; y += 1) {
    for (let z = 0; z <= segments; z += 1) {
      for (let x = 0; x <= segments; x += 1) {
        const basePosition = createVector3(
          -halfSize + x * step,
          -halfSize + y * step,
          -halfSize + z * step
        );
        vertices.push({
          basePosition,
          position: basePosition,
          potential: 0
        });
      }
    }
  }

  const getVertexIndex = (x: number, y: number, z: number): number =>
    y * pointsPerAxis * pointsPerAxis + z * pointsPerAxis + x;

  for (let y = 0; y <= segments; y += 1) {
    for (let z = 0; z <= segments; z += 1) {
      for (let x = 0; x <= segments; x += 1) {
        const current = getVertexIndex(x, y, z);

        if (x < segments) {
          indices.push(current, getVertexIndex(x + 1, y, z));
        }

        if (y < segments) {
          indices.push(current, getVertexIndex(x, y + 1, z));
        }

        if (z < segments) {
          indices.push(current, getVertexIndex(x, y, z + 1));
        }
      }
    }
  }

  return {
    size,
    segments,
    vertices,
    indices
  };
};

export const updateSpacetimeGrid = (
  grid: SpacetimeGrid,
  potentials: readonly number[],
  bodies: readonly CelestialBody[],
  settings: SimulationSettings
): SpacetimeGrid => {
  if (potentials.length !== grid.vertices.length) {
    throw new Error('Potential sample count must match grid vertex count.');
  }

  const maxDisplacement = (grid.size / grid.segments) * 0.8;

  return {
    ...grid,
    vertices: grid.vertices.map((vertex, index) => {
      const potential = potentials[index] ?? 0;
      const displacement = calculateWarpDisplacement(vertex.basePosition, bodies, settings, maxDisplacement);
      return {
        ...vertex,
        potential,
        position: addVectors(vertex.basePosition, displacement)
      };
    })
  };
};

const calculateWarpDisplacement = (
  position: Vector3,
  bodies: readonly CelestialBody[],
  settings: SimulationSettings,
  maxDisplacement: number
): Vector3 => {
  const displacement = bodies.reduce((total, body) => {
    const directionToBody = subtractVectors(body.position, position);
    const distance = vectorLength(directionToBody);
    if (distance === 0) {
      return total;
    }

    const normalizedDirection = normalizeVector(directionToBody);
    const influence =
      (settings.curvatureStrength * settings.gravitationalConstant * body.mass) /
      (distance * distance + settings.softening ** 2);

    return addVectors(total, multiplyVector(normalizedDirection, influence));
  }, createVector3());

  const displacementLength = vectorLength(displacement);
  if (displacementLength <= maxDisplacement) {
    return displacement;
  }

  return multiplyVector(normalizeVector(displacement), maxDisplacement);
};
