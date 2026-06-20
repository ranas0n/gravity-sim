import { BodyId, CelestialBody } from '../../domain/CelestialBody';
import { SimulationState } from '../../domain/SimulationState';
import {
  Color as ThreeColor,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3 as ThreeVector3
} from 'three';

export class BodyMeshRenderer {
  private readonly meshes = new Map<BodyId, Mesh<SphereGeometry, MeshStandardMaterial>>();

  constructor(private readonly scene: Scene) {}

  update(state: SimulationState): void {
    const activeBodyIds = new Set(state.bodies.map((body) => body.id));

    for (const [bodyId, mesh] of this.meshes) {
      if (!activeBodyIds.has(bodyId)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.meshes.delete(bodyId);
      }
    }

    for (const body of state.bodies) {
      const mesh = this.getOrCreateMesh(body);
      mesh.position.copy(toThreeVector(body.position));
      mesh.scale.setScalar(body.radius);
      mesh.material.color.setHex(body.color);
      mesh.material.emissive.setHex(body.color);
    }
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    this.meshes.clear();
  }

  private getOrCreateMesh(body: CelestialBody): Mesh<SphereGeometry, MeshStandardMaterial> {
    const existingMesh = this.meshes.get(body.id);
    if (existingMesh !== undefined) {
      return existingMesh;
    }

    const geometry = new SphereGeometry(1, 32, 16);
    const material = new MeshStandardMaterial({
      color: new ThreeColor(body.color),
      emissive: new ThreeColor(body.color),
      emissiveIntensity: 0.18,
      roughness: 0.55,
      metalness: 0.05
    });
    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);
    this.meshes.set(body.id, mesh);

    return mesh;
  }
}

const toThreeVector = (vector: SimulationState['bodies'][number]['position']): ThreeVector3 =>
  new ThreeVector3(vector.x, vector.y, vector.z);
