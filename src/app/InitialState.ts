import { createCelestialBody } from '../domain/CelestialBody';
import { SimulationState } from '../domain/SimulationState';
import { DEFAULT_SIMULATION_SETTINGS, SimulationSettings } from '../domain/SimulationSettings';
import { createSpacetimeGrid } from '../domain/SpacetimeGrid';
import { createVector3 } from '../shared/types/Vector3';

export const createInitialState = (): SimulationState => {
  const grid = createSpacetimeGrid(100, 15);

  return {
    bodies: [
      createCelestialBody({
        id: 'sun',
        name: 'Sun',
        mass: 220,
        position: createVector3(0, 0, 0),
        velocity: createVector3(0, 0, 0),
        radius: 1.25,
        color: 0xffcc4d,
        isFixed: true
      }),
      createCelestialBody({
        id: 'planet-a',
        name: 'Blue Planet',
        mass: 8,
        position: createVector3(8.5, 0, 0),
        velocity: createVector3(0, 0, 1.22),
        radius: 0.42,
        color: 0x4dabf7,
        isFixed: false
      }),
      createCelestialBody({
        id: 'planet-b',
        name: 'Red Planet',
        mass: 12,
        position: createVector3(-13, 0, -1.5),
        velocity: createVector3(0, 0, -0.92),
        radius: 0.55,
        color: 0xff8787,
        isFixed: false
      })
    ],
    grid,
    trails: [],
    elapsedTime: 0
  };
};

export const createInitialSettings = (): SimulationSettings => ({
  ...DEFAULT_SIMULATION_SETTINGS,
  trailLength: 260
});
