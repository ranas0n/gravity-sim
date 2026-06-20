import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace
} from 'three';

export interface SceneParts {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly renderer: WebGLRenderer;
}

export const createSceneParts = (container: HTMLElement): SceneParts => {
  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(60, getAspectRatio(container), 0.1, 1000);
  camera.position.set(18, 14, 18);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(getWidth(container), getHeight(container));
  renderer.outputColorSpace = SRGBColorSpace;
  container.append(renderer.domElement);

  const ambientLight = new AmbientLight(0xffffff, 0.45);
  const keyLight = new DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(8, 12, 6);
  scene.add(ambientLight, keyLight);

  return { scene, camera, renderer };
};

const getAspectRatio = (container: HTMLElement): number => {
  const width = getWidth(container);
  const height = getHeight(container);
  return width / height;
};

const getWidth = (container: HTMLElement): number => Math.max(container.clientWidth, 1);

const getHeight = (container: HTMLElement): number => Math.max(container.clientHeight, 1);
