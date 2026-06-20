import { describe, expect, it } from 'vitest';
import { createCelestialBody } from '../../domain/CelestialBody';
import { DEFAULT_SIMULATION_SETTINGS } from '../../domain/SimulationSettings';
import { createVector3 } from '../../shared/types/Vector3';
import { calculatePotentialAt } from './GravitationalPotential';

describe('calculatePotentialAt', () => {
  it('calculates negative softened gravitational potential', () => {
    const body = createCelestialBody({
      id: 'sun',
      name: 'Sun',
      mass: 8,
      position: createVector3(0, 0, 0),
      velocity: createVector3(0, 0, 0),
      radius: 1,
      color: 0xffcc4d,
      isFixed: true
    });

    const potential = calculatePotentialAt(
      createVector3(1, 0, 0),
      [body],
      { ...DEFAULT_SIMULATION_SETTINGS, gravitationalConstant: 0.8, softening: 0.55 }
    );

    expect(potential).toBeCloseTo(-5.608, 3);
  });
});
