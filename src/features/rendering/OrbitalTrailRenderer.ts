import { BodyId } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';
import { SimulationState } from '../../domain/SimulationState';
import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Scene,
  Vector3 as ThreeVector3
} from 'three';

export class OrbitalTrailRenderer {
  private readonly lines = new Map<BodyId, Line<BufferGeometry, LineBasicMaterial>>();

  constructor(private readonly scene: Scene) {}

  update(state: SimulationState, settings: SimulationSettings): void {
    if (!settings.showOrbitalTrails) {
      this.dispose();
      return;
    }

    const activeTrailIds = new Set(state.trails.map((trail) => trail.bodyId));

    for (const [trailId, line] of this.lines) {
      if (!activeTrailIds.has(trailId)) {
        this.scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        this.lines.delete(trailId);
      }
    }

    for (const trail of state.trails) {
      const body = state.bodies.find((candidate) => candidate.id === trail.bodyId);
      if (body === undefined) {
        continue;
      }

      const line = this.getOrCreateLine(trail.bodyId, body.color);
      line.material.color.setHex(body.color);
      line.geometry.setFromPoints(trail.points.map((point) => toThreeVector(point.position)));
    }
  }

  dispose(): void {
    for (const line of this.lines.values()) {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }

    this.lines.clear();
  }

  private getOrCreateLine(bodyId: BodyId, color: number): Line<BufferGeometry, LineBasicMaterial> {
    const existingLine = this.lines.get(bodyId);
    if (existingLine !== undefined) {
      return existingLine;
    }

    const geometry = new BufferGeometry();
    const material = new LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const line = new Line(geometry, material);
    this.scene.add(line);
    this.lines.set(bodyId, line);

    return line;
  }
}

const toThreeVector = (vector: SimulationState['bodies'][number]['position']): ThreeVector3 =>
  new ThreeVector3(vector.x, vector.y, vector.z);
