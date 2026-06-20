import { AppStateController } from '../features/ui/AppStateController';
import { ControlPanel } from '../features/ui/ControlPanel';
import { BodyMeshRenderer } from '../features/rendering/BodyMeshRenderer';
import { CameraController } from '../features/rendering/CameraController';
import { CurvatureIndicatorRenderer } from '../features/rendering/CurvatureIndicatorRenderer';
import { OrbitalTrailRenderer } from '../features/rendering/OrbitalTrailRenderer';
import { RenderLoop } from '../features/rendering/RenderLoop';
import { createSceneParts } from '../features/rendering/SceneFactory';
import { SpacetimeGridRenderer } from '../features/rendering/SpacetimeGridRenderer';
import { semiImplicitEulerIntegrator } from '../features/physics/NBodySimulation';
import { SimulationService } from '../features/physics/SimulationService';

export const createApp = (): (() => void) => {
  const sceneContainer = getRequiredElement('scene-container');
  const controlPanelContainer = getRequiredElement('control-panel');
  const sceneParts = createSceneParts(sceneContainer);
  const simulationService = new SimulationService(semiImplicitEulerIntegrator);
  const appState = new AppStateController(simulationService);
  const cameraController = new CameraController(sceneParts.camera, sceneParts.renderer.domElement);
  const bodyRenderer = new BodyMeshRenderer(sceneParts.scene);
  const gridRenderer = new SpacetimeGridRenderer(sceneParts.scene);
  const trailRenderer = new OrbitalTrailRenderer(sceneParts.scene);
  const curvatureRenderer = new CurvatureIndicatorRenderer(sceneParts.scene);

  const renderLoop = new RenderLoop(
    sceneParts.scene,
    sceneParts.camera,
    sceneParts.renderer,
    cameraController,
    (deltaSeconds) => {
      appState.update(deltaSeconds);
      renderScene(appState, controlPanel, bodyRenderer, gridRenderer, trailRenderer, curvatureRenderer);
    }
  );

  const controlPanel = new ControlPanel(controlPanelContainer, {
    onSettingsChange: (patch) => appState.updateSettings(patch),
    onPauseToggle: (paused) => appState.setPaused(paused),
    onReset: () => appState.reset(),
    onBodyAdd: (input) => appState.addBody(input),
    onBodyUpdate: (bodyId, patch) => appState.updateBody(bodyId, patch),
    onBodyRemove: (bodyId) => appState.removeBody(bodyId)
  });

  renderLoop.start();

  return () => {
    renderLoop.stop();
    controlPanel.dispose();
    bodyRenderer.dispose();
    gridRenderer.dispose();
    trailRenderer.dispose();
    curvatureRenderer.dispose();
    cameraController.dispose();
    sceneParts.renderer.dispose();
  };
};

const renderScene = (
  appState: AppStateController,
  controlPanel: ControlPanel,
  bodyRenderer: BodyMeshRenderer,
  gridRenderer: SpacetimeGridRenderer,
  trailRenderer: OrbitalTrailRenderer,
  curvatureRenderer: CurvatureIndicatorRenderer
): void => {
  const state = appState.getState();
  const settings = appState.getSettings();
  const paused = appState.isPaused();

  controlPanel.update(state, settings, paused);
  bodyRenderer.update(state);
  gridRenderer.update(state);
  trailRenderer.update(state, settings);
  curvatureRenderer.update(state, settings);
};

const getRequiredElement = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing required element #${id}.`);
  }

  return element;
};
