import { CelestialBody } from './CelestialBody';
import { SpacetimeGrid } from './SpacetimeGrid';

export interface TrailPoint {
  readonly position: CelestialBody['position'];
}

export interface BodyTrail {
  readonly bodyId: CelestialBody['id'];
  readonly points: readonly TrailPoint[];
}

export interface SimulationState {
  readonly bodies: readonly CelestialBody[];
  readonly grid: SpacetimeGrid;
  readonly trails: readonly BodyTrail[];
  readonly elapsedTime: number;
}
