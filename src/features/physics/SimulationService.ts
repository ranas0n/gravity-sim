import { BodyTrail, SimulationState } from '../../domain/SimulationState';
import { updateSpacetimeGrid } from '../../domain/SpacetimeGrid';
import { SimulationSettings } from '../../domain/SimulationSettings';
import { calculatePotentialSamples } from './GravitationalPotential';
import { Integrator } from './Integrator';

const MAX_STEP_SECONDS = 0.05;

export class SimulationService {
  constructor(private readonly integrator: Integrator) {}

  update(state: SimulationState, settings: SimulationSettings, deltaSeconds: number): SimulationState {
    const scaledDeltaSeconds = Math.max(0, deltaSeconds) * settings.timeScale;
    const safeDeltaSeconds = Math.min(scaledDeltaSeconds, MAX_STEP_SECONDS);
    const bodies = this.integrator.step(state.bodies, settings, safeDeltaSeconds);
    const potentials = calculatePotentialSamples(
      state.grid.vertices.map((vertex) => vertex.basePosition),
      bodies,
      settings
    );
    const grid = updateSpacetimeGrid(state.grid, potentials, bodies, settings);
    const trails = updateTrails(bodies, state.trails, settings.trailLength);

    return {
      ...state,
      bodies,
      grid,
      trails,
      elapsedTime: state.elapsedTime + scaledDeltaSeconds
    };
  }

  refresh(state: SimulationState, settings: SimulationSettings): SimulationState {
    return {
      ...state,
      grid: buildGrid(state, settings)
    };
  }
}

const buildGrid = (
  state: SimulationState,
  settings: SimulationSettings
): SimulationState['grid'] => {
  const potentials = calculatePotentialSamples(
    state.grid.vertices.map((vertex) => vertex.basePosition),
    state.bodies,
    settings
  );

  return updateSpacetimeGrid(state.grid, potentials, state.bodies, settings);
};

const updateTrails = (
  bodies: readonly SimulationState['bodies'][number][],
  previousTrails: readonly BodyTrail[],
  trailLength: number
): readonly BodyTrail[] =>
  bodies.map((body) => {
    const previousTrail = previousTrails.find((trail) => trail.bodyId === body.id);
    const points = [...(previousTrail?.points ?? []), { position: body.position }];
    const trimmedPoints = points.length > trailLength ? points.slice(points.length - trailLength) : points;

    return {
      bodyId: body.id,
      points: trimmedPoints
    };
  });
