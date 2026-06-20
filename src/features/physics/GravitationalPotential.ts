import { CelestialBody } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';
import { Vector3 } from '../../shared/types/Vector3';
import { distanceBetween } from '../../shared/types/Vector3';

export const calculatePotentialAt = (
  position: Vector3,
  bodies: readonly CelestialBody[],
  settings: SimulationSettings
): number =>
  bodies.reduce((total, body) => {
    const distance = distanceBetween(position, body.position);
    return total - (settings.gravitationalConstant * body.mass) / Math.sqrt(distance * distance + settings.softening ** 2);
  }, 0);

export const calculatePotentialSamples = (
  positions: readonly Vector3[],
  bodies: readonly CelestialBody[],
  settings: SimulationSettings
): readonly number[] =>
  positions.map((position) => calculatePotentialAt(position, bodies, settings));
