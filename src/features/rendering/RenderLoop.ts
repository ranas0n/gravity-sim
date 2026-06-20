import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { CameraController } from './CameraController';

export class RenderLoop {
  private frameId = 0;
  private lastTimestamp: number | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly renderer: WebGLRenderer,
    private readonly cameraController: CameraController,
    private readonly render: (deltaSeconds: number) => void
  ) {}

  start(): void {
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
  }

  private readonly tick = (timestamp: number): void => {
    const deltaSeconds = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.resizeRenderer();
    this.render(deltaSeconds);
    this.cameraController.update();
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.tick);
  };

  private resizeRenderer(): void {
    const container = this.renderer.domElement.parentElement;
    if (container === null) {
      return;
    }

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    if (this.renderer.domElement.width !== Math.floor(width * pixelRatio) ||
      this.renderer.domElement.height !== Math.floor(height * pixelRatio)) {
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }
}
