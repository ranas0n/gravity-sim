import { SimulationSettings } from '../../domain/SimulationSettings';
import { SimulationState } from '../../domain/SimulationState';
import { calculatePotentialAt } from '../physics/GravitationalPotential';
import {
  createVector3,
  multiplyVector,
  normalizeVector,
  Vector3,
  vectorLength
} from '../../shared/types/Vector3';
import { ArrowHelper, Scene, Vector3 as ThreeVector3 } from 'three';

const ARROW_STRIDE = 3;
const GRADIENT_EPSILON = 0.35;

export class CurvatureIndicatorRenderer {
  private readonly arrows: ArrowHelper[] = [];

  constructor(private readonly scene: Scene) {}

  update(state: SimulationState, settings: SimulationSettings): void {
    this.dispose();

    if (!settings.showCurvatureArrows) {
      return;
    }

    const pointsPerAxis = state.grid.segments + 1;
    const middleLayer = Math.floor(state.grid.segments / 2);

    state.grid.vertices.forEach((vertex, index) => {
      const layerIndex = Math.floor(index / (pointsPerAxis * pointsPerAxis));
      if (layerIndex !== middleLayer) {
        return;
      }

      const planeIndex = index % (pointsPerAxis * pointsPerAxis);
      const xIndex = planeIndex % pointsPerAxis;
      const zIndex = Math.floor(planeIndex / pointsPerAxis);
      if (xIndex % ARROW_STRIDE !== 0 || zIndex % ARROW_STRIDE !== 0) {
        return;
      }

      const downhillDirection = this.calculateDownhillDirection(vertex.position, state, settings);
      if (vectorLength(downhillDirection) < 0.0001) {
        return;
      }

      const normalizedDirection = normalizeVector(downhillDirection);
      const arrow = new ArrowHelper(
        toThreeVector(normalizedDirection),
        toThreeVector(vertex.position),
        0.85,
        0x93c5fd,
        0.32,
        0.16
      );
      this.arrows.push(arrow);
      this.scene.add(arrow);
    });
  }

  dispose(): void {
    for (const arrow of this.arrows) {
      this.scene.remove(arrow);
      arrow.dispose();
    }

    this.arrows.length = 0;
  }

  private calculateDownhillDirection(
    position: Vector3,
    state: SimulationState,
    settings: SimulationSettings
  ): Vector3 {
    const positiveX = createVector3(position.x + GRADIENT_EPSILON, position.y, position.z);
    const negativeX = createVector3(position.x - GRADIENT_EPSILON, position.y, position.z);
    const positiveY = createVector3(position.x, position.y + GRADIENT_EPSILON, position.z);
    const negativeY = createVector3(position.x, position.y - GRADIENT_EPSILON, position.z);
    const positiveZ = createVector3(position.x, position.y, position.z + GRADIENT_EPSILON);
    const negativeZ = createVector3(position.x, position.y, position.z - GRADIENT_EPSILON);

    const gradient = createVector3(
      (calculatePotentialAt(positiveX, state.bodies, settings) -
        calculatePotentialAt(negativeX, state.bodies, settings)) /
        (2 * GRADIENT_EPSILON),
      (calculatePotentialAt(positiveY, state.bodies, settings) -
        calculatePotentialAt(negativeY, state.bodies, settings)) /
        (2 * GRADIENT_EPSILON),
      (calculatePotentialAt(positiveZ, state.bodies, settings) -
        calculatePotentialAt(negativeZ, state.bodies, settings)) /
        (2 * GRADIENT_EPSILON)
    );

    return multiplyVector(gradient, -1);
  }
}

const toThreeVector = (vector: Vector3): ThreeVector3 => new ThreeVector3(vector.x, vector.y, vector.z);
