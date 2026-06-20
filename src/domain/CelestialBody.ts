import { Color } from '../shared/types/Color';
import { Vector3 } from '../shared/types/Vector3';

export type BodyId = string;

export interface CelestialBody {
  readonly id: BodyId;
  readonly name: string;
  readonly mass: number;
  readonly position: Vector3;
  readonly velocity: Vector3;
  readonly radius: number;
  readonly color: Color;
  readonly isFixed: boolean;
}

export const createCelestialBody = (body: CelestialBody): CelestialBody => body;

export const updateCelestialBody = (
  body: CelestialBody,
  patch: Partial<CelestialBody>
): CelestialBody => ({ ...body, ...patch });
