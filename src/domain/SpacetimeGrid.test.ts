import { describe, expect, it } from 'vitest';
import { createCelestialBody } from './CelestialBody';
import { createSpacetimeGrid, updateSpacetimeGrid } from './SpacetimeGrid';
import { DEFAULT_SIMULATION_SETTINGS } from './SimulationSettings';
import { createVector3 } from '../shared/types/Vector3';

describe('SpacetimeGrid', () => {
  it('creates a centered cubic lattice with 17^3 vertices for size 28 and 16 segments', () => {
    const grid = createSpacetimeGrid(28, 16);

    expect(grid.vertices).toHaveLength(17 ** 3);
    expect(grid.vertices[0]?.basePosition).toEqual(createVector3(-14, -14, -14));
    expect(grid.vertices.at(-1)?.basePosition).toEqual(createVector3(14, 14, 14));
  });

  it('creates line indices for x, y, and z neighbor connections', () => {
    const grid = createSpacetimeGrid(28, 16);
    const pointsPerAxis = 17;
    const expectedConnections = 3 * 16 * pointsPerAxis * pointsPerAxis;

    expect(grid.indices).toHaveLength(expectedConnections * 2);
  });

  it('warps vertices toward masses while preserving base positions', () => {
    const grid = createSpacetimeGrid(28, 16);
    const body = createCelestialBody({
      id: 'sun',
      name: 'Sun',
      mass: 220,
      position: createVector3(0, 0, 0),
      velocity: createVector3(0, 0, 0),
      radius: 1.25,
      color: 0xffcc4d,
      isFixed: true
    });
    const vertexIndex = grid.vertices.findIndex((vertex) =>
      vertex.basePosition.x === 1.75 &&
      vertex.basePosition.y === 0 &&
      vertex.basePosition.z === 0
    );

    expect(vertexIndex).toBeGreaterThan(-1);

    const nextGrid = updateSpacetimeGrid(
      grid,
      new Array(grid.vertices.length).fill(-1),
      [body],
      DEFAULT_SIMULATION_SETTINGS
    );
    const originalVertex = grid.vertices[vertexIndex]!;
    const warpedVertex = nextGrid.vertices[vertexIndex]!;

    expect(warpedVertex.basePosition).toEqual(originalVertex.basePosition);
    expect(warpedVertex.position.x).toBeLessThan(originalVertex.basePosition.x);
    expect(warpedVertex.position.y).toBeCloseTo(originalVertex.basePosition.y, 6);
    expect(warpedVertex.position.z).toBeCloseTo(originalVertex.basePosition.z, 6);
    expect(warpedVertex.potential).toBe(-1);
  });
});
