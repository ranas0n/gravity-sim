import { describe, expect, it } from 'vitest';
import { createCelestialBody } from '../../domain/CelestialBody';
import { DEFAULT_SIMULATION_SETTINGS } from '../../domain/SimulationSettings';
import { createVector3 } from '../../shared/types/Vector3';
import { semiImplicitEulerIntegrator } from './NBodySimulation';

describe('NBodySimulation', () => {
  it('moves a body toward a fixed source body with softened gravity', () => {
    const bodies = [
      createCelestialBody({
        id: 'target',
        name: 'Target',
        mass: 1,
        position: createVector3(0, 0, 0),
        velocity: createVector3(0, 0, 0),
        radius: 0.5,
        color: 0x4dabf7,
        isFixed: false
      }),
      createCelestialBody({
        id: 'source',
        name: 'Source',
        mass: 10,
        position: createVector3(2, 0, 0),
        velocity: createVector3(0, 0, 0),
        radius: 1,
        color: 0xffcc4d,
        isFixed: true
      })
    ];

    const nextBodies = semiImplicitEulerIntegrator.step(
      bodies,
      { ...DEFAULT_SIMULATION_SETTINGS, gravitationalConstant: 1, softening: 0 },
      0.1
    );
    const target = nextBodies[0];

    expect(target).toBeDefined();
    expect(target?.position.x).toBeCloseTo(0.025, 6);
    expect(target?.velocity.x).toBeCloseTo(0.25, 6);
  });
});
