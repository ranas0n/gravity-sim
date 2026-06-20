export interface SimulationSettings {
  readonly gravitationalConstant: number;
  readonly timeScale: number;
  readonly softening: number;
  readonly curvatureStrength: number;
  readonly trailLength: number;
  readonly showOrbitalTrails: boolean;
  readonly showCurvatureArrows: boolean;
}

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  gravitationalConstant: 0.8,
  timeScale: 1,
  softening: 0.55,
  curvatureStrength: 0.035,
  trailLength: 220,
  showOrbitalTrails: true,
  showCurvatureArrows: true
};
