import { CelestialBody } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';
import {
  ZERO_VECTOR,
  Vector3,
  addVectors,
  multiplyVector,
  normalizeVector,
  subtractVectors,
  vectorLength,
  vectorLengthSquared
} from '../../shared/types/Vector3';
import { Integrator } from './Integrator';

export class NBodySimulation implements Integrator {
  step(
    bodies: readonly CelestialBody[],
    settings: SimulationSettings,
    deltaSeconds: number
  ): readonly CelestialBody[] {
    if (deltaSeconds <= 0) {
      return bodies;
    }

    return bodies.map((body, index) => this.integrateBody(body, index, bodies, settings, deltaSeconds));
  }

  private integrateBody(
    body: CelestialBody,
    bodyIndex: number,
    bodies: readonly CelestialBody[],
    settings: SimulationSettings,
    deltaSeconds: number
  ): CelestialBody {
    if (body.isFixed) {
      return body;
    }

    const acceleration = bodies.reduce(
      (totalAcceleration, otherBody, otherIndex) => {
        if (bodyIndex === otherIndex) {
          return totalAcceleration;
        }

        return addVectors(totalAcceleration, this.calculateAccelerationFrom(body.position, otherBody, settings));
      },
      ZERO_VECTOR
    );

    const nextVelocity = addVectors(body.velocity, multiplyVector(acceleration, deltaSeconds));
    const nextPosition = addVectors(body.position, multiplyVector(nextVelocity, deltaSeconds));

    return {
      ...body,
      position: nextPosition,
      velocity: nextVelocity
    };
  }

  private calculateAccelerationFrom(
    position: Vector3,
    sourceBody: CelestialBody,
    settings: SimulationSettings
  ): Vector3 {
    const direction = subtractVectors(sourceBody.position, position);
    const distanceSquared = vectorLengthSquared(direction) + settings.softening ** 2;
    const distance = vectorLength(direction);
    const magnitude = (settings.gravitationalConstant * sourceBody.mass) / distanceSquared;
    const normalizedDirection = distance === 0 ? ZERO_VECTOR : normalizeVector(direction);

    return multiplyVector(normalizedDirection, magnitude);
  }
}

export const semiImplicitEulerIntegrator = new NBodySimulation();
