import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  private readonly controls: OrbitControls;

  constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 80;
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
