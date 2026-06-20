import { describe, expect, it } from 'vitest';
import { AppStateController } from './AppStateController';
import { semiImplicitEulerIntegrator } from '../physics/NBodySimulation';
import { SimulationService } from '../physics/SimulationService';
import { createVector3 } from '../../shared/types/Vector3';

const createController = (): AppStateController =>
  new AppStateController(new SimulationService(semiImplicitEulerIntegrator));

describe('AppStateController', () => {
  it('adds a new managed body with sanitized values', () => {
    const controller = createController();
    const bodyId = controller.addBody({
      name: ' Test Body ',
      mass: 600,
      radius: 4,
      color: 0x123456,
      isFixed: false,
      position: createVector3(30, 0, -30),
      velocity: createVector3(9, 0, -9)
    });

    const body = controller.getState().bodies.find((candidate) => candidate.id === bodyId);

    expect(body).toBeDefined();
    expect(body?.name).toBe('Test Body');
    expect(body?.mass).toBe(500);
    expect(body?.radius).toBe(3);
    expect(body?.position).toEqual(createVector3(20, 0, -20));
    expect(body?.velocity).toEqual(createVector3(5, 0, -5));
  });

  it('updates live body values and clears that body trail when position changes', () => {
    const controller = createController();
    controller.update(0.1);
    const movingBodyId = controller.getState().bodies.find((body) => !body.isFixed)?.id;

    expect(movingBodyId).toBeDefined();
    expect(controller.getState().trails.some((trail) => trail.bodyId === movingBodyId)).toBe(true);

    controller.updateBody(movingBodyId!, {
      color: 0xff00ff,
      position: createVector3(1, 2, 3)
    });

    const updatedBody = controller.getState().bodies.find((body) => body.id === movingBodyId);

    expect(updatedBody?.color).toBe(0xff00ff);
    expect(updatedBody?.position).toEqual(createVector3(1, 2, 3));
    expect(controller.getState().trails.some((trail) => trail.bodyId === movingBodyId)).toBe(false);
  });

  it('prevents removing the last remaining body', () => {
    const controller = createController();
    const bodyIds = controller.getState().bodies.map((body) => body.id);

    for (const bodyId of bodyIds.slice(0, -1)) {
      controller.removeBody(bodyId);
    }

    const lastBodyId = controller.getState().bodies[0]?.id;
    expect(lastBodyId).toBeDefined();

    controller.removeBody(lastBodyId!);

    expect(controller.getState().bodies).toHaveLength(1);
  });

  it('reset restores the default scene and settings', () => {
    const controller = createController();
    controller.addBody({
      name: 'Body 4',
      mass: 4,
      radius: 0.4,
      color: 0xabcdef,
      isFixed: false,
      position: createVector3(5, 0, 0),
      velocity: createVector3(0, 0, 1)
    });
    controller.updateSettings({ trailLength: 40, gravitationalConstant: 1.4 });
    controller.setPaused(true);

    controller.reset();

    expect(controller.getState().bodies).toHaveLength(3);
    expect(controller.getSettings().trailLength).toBe(260);
    expect(controller.getSettings().gravitationalConstant).toBe(0.8);
    expect(controller.isPaused()).toBe(false);
  });
});
