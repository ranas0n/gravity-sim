import { createCelestialBody, updateCelestialBody, type BodyId, type CelestialBody } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';
import { SimulationState } from '../../domain/SimulationState';
import { createInitialState } from '../../app/InitialState';
import { createInitialSettings } from '../../app/InitialState';
import { SimulationService } from '../physics/SimulationService';
import { createVector3, type Vector3 } from '../../shared/types/Vector3';

export interface ManagedBodyInput {
  readonly name: string;
  readonly mass: number;
  readonly radius: number;
  readonly color: number;
  readonly isFixed: boolean;
  readonly position: Vector3;
  readonly velocity: Vector3;
}

export class AppStateController {
  private state: SimulationState;
  private settings: SimulationSettings;
  private paused = false;
  private nextBodyNumber = 1;

  constructor(private readonly simulationService: SimulationService) {
    this.state = createInitialState();
    this.settings = createInitialSettings();
    this.nextBodyNumber = this.state.bodies.length + 1;
  }

  getState(): SimulationState {
    return this.state;
  }

  getSettings(): SimulationSettings {
    return this.settings;
  }

  isPaused(): boolean {
    return this.paused;
  }

  update(deltaSeconds: number): void {
    if (this.paused) {
      return;
    }

    this.state = this.simulationService.update(this.state, this.settings, deltaSeconds);
  }

  updateSettings(patch: Partial<SimulationSettings>): void {
    this.settings = {
      ...this.settings,
      ...patch
    };
    this.state = this.simulationService.refresh(
      {
        ...this.state,
        trails: trimTrails(this.state.trails, this.settings.trailLength)
      },
      this.settings
    );
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  addBody(input: ManagedBodyInput): BodyId {
    const nextBody = createCelestialBody({
      id: `body-${this.nextBodyNumber}`,
      ...sanitizeManagedBodyInput(input)
    });

    this.nextBodyNumber += 1;
    this.state = this.simulationService.refresh(
      {
        ...this.state,
        bodies: [...this.state.bodies, nextBody]
      },
      this.settings
    );

    return nextBody.id;
  }

  updateBody(bodyId: BodyId, patch: Partial<ManagedBodyInput>): void {
    const currentBody = this.state.bodies.find((body) => body.id === bodyId);
    if (currentBody === undefined) {
      return;
    }

    const sanitizedPatch = sanitizeManagedBodyPatch(patch);
    const nextBody = updateCelestialBody(currentBody, sanitizedPatch);
    const shouldClearTrail = sanitizedPatch.position !== undefined || sanitizedPatch.velocity !== undefined;

    this.state = this.simulationService.refresh(
      {
        ...this.state,
        bodies: this.state.bodies.map((body) => (body.id === bodyId ? nextBody : body)),
        trails: shouldClearTrail
          ? this.state.trails.filter((trail) => trail.bodyId !== bodyId)
          : this.state.trails
      },
      this.settings
    );
  }

  removeBody(bodyId: BodyId): void {
    if (this.state.bodies.length <= 1) {
      return;
    }

    this.state = this.simulationService.refresh(
      {
        ...this.state,
        bodies: this.state.bodies.filter((body) => body.id !== bodyId),
        trails: this.state.trails.filter((trail) => trail.bodyId !== bodyId)
      },
      this.settings
    );
  }

  reset(): void {
    this.state = createInitialState();
    this.settings = createInitialSettings();
    this.paused = false;
    this.nextBodyNumber = this.state.bodies.length + 1;
  }
}

const MASS_LIMITS = { min: 0.1, max: 500 };
const RADIUS_LIMITS = { min: 0.1, max: 3 };
const POSITION_LIMITS = { min: -20, max: 20 };
const VELOCITY_LIMITS = { min: -5, max: 5 };

const sanitizeManagedBodyInput = (input: ManagedBodyInput): Omit<CelestialBody, 'id'> => ({
  name: sanitizeName(input.name),
  mass: clamp(input.mass, MASS_LIMITS),
  radius: clamp(input.radius, RADIUS_LIMITS),
  color: sanitizeColor(input.color),
  isFixed: input.isFixed,
  position: sanitizeVector(input.position, POSITION_LIMITS),
  velocity: sanitizeVector(input.velocity, VELOCITY_LIMITS)
});

const sanitizeManagedBodyPatch = (patch: Partial<ManagedBodyInput>): Partial<CelestialBody> => ({
  ...(patch.name !== undefined ? { name: sanitizeName(patch.name) } : {}),
  ...(patch.mass !== undefined ? { mass: clamp(patch.mass, MASS_LIMITS) } : {}),
  ...(patch.radius !== undefined ? { radius: clamp(patch.radius, RADIUS_LIMITS) } : {}),
  ...(patch.color !== undefined ? { color: sanitizeColor(patch.color) } : {}),
  ...(patch.isFixed !== undefined ? { isFixed: patch.isFixed } : {}),
  ...(patch.position !== undefined ? { position: sanitizeVector(patch.position, POSITION_LIMITS) } : {}),
  ...(patch.velocity !== undefined ? { velocity: sanitizeVector(patch.velocity, VELOCITY_LIMITS) } : {})
});

const trimTrails = (
  trails: SimulationState['trails'],
  trailLength: number
): SimulationState['trails'] =>
  trails.map((trail) => ({
    ...trail,
    points: trail.points.slice(-trailLength)
  }));

const sanitizeName = (name: string): string => {
  const trimmedName = name.trim();
  return trimmedName === '' ? 'Unnamed Body' : trimmedName;
};

const sanitizeVector = (
  vector: Vector3,
  limits: { readonly min: number; readonly max: number }
): Vector3 =>
  createVector3(
    clamp(vector.x, limits),
    clamp(vector.y, limits),
    clamp(vector.z, limits)
  );

const sanitizeColor = (color: number): number =>
  Math.max(0, Math.min(0xffffff, Math.round(color)));

const clamp = (
  value: number,
  limits: { readonly min: number; readonly max: number }
): number => Math.min(limits.max, Math.max(limits.min, value));
