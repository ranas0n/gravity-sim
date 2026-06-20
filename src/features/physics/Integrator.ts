import { CelestialBody } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';

export interface Integrator {
  step(
    bodies: readonly CelestialBody[],
    settings: SimulationSettings,
    deltaSeconds: number
  ): readonly CelestialBody[];
}
