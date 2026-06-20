import { SimulationState } from '../../domain/SimulationState';
import { clamp01 } from '../../shared/math/MathUtils';
import {
  BufferAttribute,
  BufferGeometry,
  Color as ThreeColor,
  LineBasicMaterial,
  LineSegments,
  Scene
} from 'three';

export class SpacetimeGridRenderer {
  private readonly lines: LineSegments<BufferGeometry, LineBasicMaterial>;

  constructor(private readonly scene: Scene) {
    this.lines = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.45
      })
    );
    this.lines.frustumCulled = false;
    this.scene.add(this.lines);
  }

  update(state: SimulationState): void {
    const { positions, colors } = this.buildGeometryData(state);
    const geometry = this.lines.geometry;

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setIndex(Array.from(state.grid.indices));

    const positionAttribute = geometry.getAttribute('position');
    const colorAttribute = geometry.getAttribute('color');
    if (positionAttribute === null || colorAttribute === null) {
      throw new Error('Spacetime grid geometry attributes were not created.');
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }

  dispose(): void {
    this.scene.remove(this.lines);
    this.lines.geometry.dispose();
    this.lines.material.dispose();
  }

  private buildGeometryData(state: SimulationState): {
    readonly positions: Float32Array;
    readonly colors: Float32Array;
  } {
    const potentials = state.grid.vertices.map((vertex) => vertex.potential);
    const minPotential = potentials.reduce((minimum, potential) => Math.min(minimum, potential), 0);
    const maxPotential = potentials.reduce((maximum, potential) => Math.max(maximum, potential), 0);
    const range = maxPotential - minPotential;
    const positions = new Float32Array(state.grid.vertices.length * 3);
    const colors = new Float32Array(state.grid.vertices.length * 3);

    state.grid.vertices.forEach((vertex, index) => {
      const outputIndex = index * 3;
      positions[outputIndex] = vertex.position.x;
      positions[outputIndex + 1] = vertex.position.y;
      positions[outputIndex + 2] = vertex.position.z;

      const depth = range === 0 ? 0 : clamp01((0 - vertex.potential) / range);
      const color = new ThreeColor().setHSL(0.62 - depth * 0.48, 0.9, 0.52 + depth * 0.08);
      colors[outputIndex] = color.r;
      colors[outputIndex + 1] = color.g;
      colors[outputIndex + 2] = color.b;
    });

    return { positions, colors };
  }
}
