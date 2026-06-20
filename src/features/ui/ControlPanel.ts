import { BodyId, CelestialBody } from '../../domain/CelestialBody';
import { SimulationSettings } from '../../domain/SimulationSettings';
import { SimulationState } from '../../domain/SimulationState';
import { vectorLength } from '../../shared/types/Vector3';
import { Range } from '../../shared/types/Range';
import { ManagedBodyInput } from './AppStateController';

const MASS_LIMITS = { min: 0.1, max: 500, step: 0.1 };
const RADIUS_LIMITS = { min: 0.1, max: 3, step: 0.05 };
const POSITION_LIMITS = { min: -20, max: 20, step: 0.1 };
const VELOCITY_LIMITS = { min: -5, max: 5, step: 0.05 };

export interface ControlPanelCallbacks {
  readonly onSettingsChange: (patch: Partial<SimulationSettings>) => void;
  readonly onPauseToggle: (paused: boolean) => void;
  readonly onReset: () => void;
  readonly onBodyAdd: (input: ManagedBodyInput) => BodyId;
  readonly onBodyUpdate: (bodyId: BodyId, patch: Partial<ManagedBodyInput>) => void;
  readonly onBodyRemove: (bodyId: BodyId) => void;
}

export class ControlPanel {
  private readonly pauseButton: HTMLButtonElement;
  private readonly bodyCountValue: HTMLSpanElement;
  private readonly elapsedTimeValue: HTMLSpanElement;
  private readonly bodyList: HTMLDivElement;
  private readonly selectedBodyTitle: HTMLHeadingElement;
  private readonly selectedBodyState: HTMLSpanElement;
  private readonly selectedBodyInputs: BodyInputControls;
  private readonly selectedRemoveButton: HTMLButtonElement;
  private readonly newBodyInputs: BodyInputControls;
  private readonly gravityControl: RangeControl;
  private readonly timeScaleControl: RangeControl;
  private readonly softeningControl: RangeControl;
  private readonly curvatureControl: RangeControl;
  private readonly trailLengthControl: RangeControl;
  private readonly showTrailsCheckbox: HTMLInputElement;
  private readonly showArrowsCheckbox: HTMLInputElement;
  private selectedBodyId: BodyId | null = null;
  private latestState: SimulationState | null = null;
  private latestSettings: SimulationSettings | null = null;
  private latestPaused = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: ControlPanelCallbacks
  ) {
    this.pauseButton = document.createElement('button');
    this.bodyCountValue = document.createElement('span');
    this.elapsedTimeValue = document.createElement('span');
    this.bodyList = document.createElement('div');
    this.selectedBodyTitle = document.createElement('h3');
    this.selectedBodyState = document.createElement('span');
    this.selectedRemoveButton = document.createElement('button');
    this.showTrailsCheckbox = document.createElement('input');
    this.showArrowsCheckbox = document.createElement('input');
    this.renderShell();
    this.gravityControl = this.createRangeControl({
      id: 'gravity',
      labelText: 'Gravity strength',
      range: { min: 0, max: 2, step: 0.01 },
      value: 0.8,
      decimals: 2,
      onInput: (value) => this.callbacks.onSettingsChange({ gravitationalConstant: value })
    });
    this.timeScaleControl = this.createRangeControl({
      id: 'time-scale',
      labelText: 'Time scale',
      range: { min: 0, max: 3, step: 0.05 },
      value: 1,
      decimals: 2,
      onInput: (value) => this.callbacks.onSettingsChange({ timeScale: value })
    });
    this.softeningControl = this.createRangeControl({
      id: 'softening',
      labelText: 'Softening',
      range: { min: 0.05, max: 2, step: 0.05 },
      value: 0.55,
      decimals: 2,
      onInput: (value) => this.callbacks.onSettingsChange({ softening: value })
    });
    this.curvatureControl = this.createRangeControl({
      id: 'curvature',
      labelText: 'Curvature strength',
      range: { min: 0, max: 0.12, step: 0.005 },
      value: 0.035,
      decimals: 3,
      onInput: (value) => this.callbacks.onSettingsChange({ curvatureStrength: value })
    });
    this.trailLengthControl = this.createRangeControl({
      id: 'trail-length',
      labelText: 'Trail length',
      range: { min: 20, max: 500, step: 10 },
      value: 260,
      decimals: 0,
      onInput: (value) => this.callbacks.onSettingsChange({ trailLength: Math.round(value) })
    });
    this.selectedBodyInputs = this.createBodyInputControls('selected-body');
    this.newBodyInputs = this.createBodyInputControls('new-body');
    this.renderSections();
    this.bindSelectedBodyInputs();
    this.bindNewBodyInputs();
  }

  update(state: SimulationState, settings: SimulationSettings, paused: boolean): void {
    this.latestState = state;
    this.latestSettings = settings;
    this.latestPaused = paused;
    this.selectedBodyId = this.resolveSelectedBodyId(state);

    this.updatePauseButton(paused);
    this.updateSettings(settings);
    this.updateSummary(state);
    this.renderBodyList(state);
    this.updateSelectedBodyEditor(state);
    this.updateNewBodyDefaults(state);
  }

  updatePauseButton(paused: boolean): void {
    this.pauseButton.textContent = paused ? 'Resume' : 'Pause';
  }

  dispose(): void {
    this.container.replaceChildren();
  }

  private renderShell(): void {
    this.container.replaceChildren();

    const title = document.createElement('h1');
    title.textContent = 'Spacetime Gravity Lab';
    this.container.append(title);

    const description = document.createElement('p');
    description.textContent = 'Monitor the system, tune gravity, and manage every celestial body from one side panel.';
    this.container.append(description);
  }

  private renderSections(): void {
    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-row';
    this.pauseButton.type = 'button';
    this.pauseButton.textContent = 'Pause';
    this.pauseButton.addEventListener('click', () => {
      const paused = this.pauseButton.textContent === 'Pause';
      this.callbacks.onPauseToggle(paused);
      this.updatePauseButton(paused);
    });

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', this.callbacks.onReset);
    buttonRow.append(this.pauseButton, resetButton);
    this.container.append(buttonRow);

    const simulationSection = this.createSection('Simulation');
    simulationSection.append(
      this.gravityControl.group,
      this.timeScaleControl.group,
      this.softeningControl.group,
      this.curvatureControl.group,
      this.trailLengthControl.group,
      this.createCheckboxRow(
        'show-trails',
        'Show orbital trails',
        this.showTrailsCheckbox,
        (checked) => this.callbacks.onSettingsChange({ showOrbitalTrails: checked })
      ),
      this.createCheckboxRow(
        'show-arrows',
        'Show curvature arrows',
        this.showArrowsCheckbox,
        (checked) => this.callbacks.onSettingsChange({ showCurvatureArrows: checked })
      ),
      this.createLegend()
    );
    this.container.append(simulationSection);

    const summarySection = this.createSection('System');
    summarySection.append(
      this.createStatRow('Bodies', this.bodyCountValue),
      this.createStatRow('Elapsed', this.elapsedTimeValue)
    );
    this.container.append(summarySection);

    const bodiesSection = this.createSection('Bodies');
    this.bodyList.className = 'body-list';
    bodiesSection.append(this.bodyList);
    this.container.append(bodiesSection);

    const selectedSection = this.createSection('Selected');
    this.selectedBodyTitle.textContent = 'No body selected';
    this.selectedBodyTitle.className = 'panel-subtitle';
    this.selectedBodyState.className = 'body-pill';
    const selectedHeader = document.createElement('div');
    selectedHeader.className = 'section-header-row';
    selectedHeader.append(this.selectedBodyTitle, this.selectedBodyState);
    this.selectedRemoveButton.type = 'button';
    this.selectedRemoveButton.textContent = 'Remove';
    this.selectedRemoveButton.addEventListener('click', () => {
      if (this.selectedBodyId !== null) {
        this.callbacks.onBodyRemove(this.selectedBodyId);
      }
    });
    selectedSection.append(selectedHeader, this.selectedBodyInputs.group, this.selectedRemoveButton);
    this.container.append(selectedSection);

    const newBodySection = this.createSection('Add Body');
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add body';
    addButton.addEventListener('click', () => {
      const bodyId = this.callbacks.onBodyAdd(this.readBodyInputs(this.newBodyInputs));
      this.selectedBodyId = bodyId;
      this.resetNewBodyInputs();
    });
    newBodySection.append(this.newBodyInputs.group, addButton);
    this.container.append(newBodySection);
  }

  private updateSettings(settings: SimulationSettings): void {
    this.syncRangeControl(this.gravityControl, settings.gravitationalConstant);
    this.syncRangeControl(this.timeScaleControl, settings.timeScale);
    this.syncRangeControl(this.softeningControl, settings.softening);
    this.syncRangeControl(this.curvatureControl, settings.curvatureStrength);
    this.syncRangeControl(this.trailLengthControl, settings.trailLength);
    this.syncCheckbox(this.showTrailsCheckbox, settings.showOrbitalTrails);
    this.syncCheckbox(this.showArrowsCheckbox, settings.showCurvatureArrows);
  }

  private updateSummary(state: SimulationState): void {
    this.bodyCountValue.textContent = String(state.bodies.length);
    this.elapsedTimeValue.textContent = `${state.elapsedTime.toFixed(2)} s`;
  }

  private renderBodyList(state: SimulationState): void {
    this.bodyList.replaceChildren();

    for (const body of state.bodies) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `body-row${body.id === this.selectedBodyId ? ' is-selected' : ''}`;
      button.addEventListener('click', () => {
        this.selectedBodyId = body.id;
        if (this.latestState !== null && this.latestSettings !== null) {
          this.update(this.latestState, this.latestSettings, this.latestPaused);
        }
      });

      const heading = document.createElement('div');
      heading.className = 'body-row-heading';
      const name = document.createElement('span');
      name.textContent = body.name;
      const statePill = document.createElement('span');
      statePill.className = 'body-pill';
      statePill.textContent = body.isFixed ? 'Fixed' : 'Moving';
      heading.append(name, statePill);

      const details = document.createElement('div');
      details.className = 'body-row-details';
      details.textContent = [
        `mass ${body.mass.toFixed(2)}`,
        `radius ${body.radius.toFixed(2)}`,
        `speed ${vectorLength(body.velocity).toFixed(2)}`,
        `pos ${formatVector(body.position)}`
      ].join('  |  ');

      button.append(heading, details);
      this.bodyList.append(button);
    }
  }

  private updateSelectedBodyEditor(state: SimulationState): void {
    const selectedBody = state.bodies.find((body) => body.id === this.selectedBodyId);

    this.selectedBodyInputs.group.style.display = selectedBody === undefined ? 'none' : 'grid';
    this.selectedRemoveButton.disabled = selectedBody === undefined || state.bodies.length <= 1;
    this.selectedBodyState.style.visibility = selectedBody === undefined ? 'hidden' : 'visible';

    if (selectedBody === undefined) {
      this.selectedBodyTitle.textContent = 'No body selected';
      this.selectedBodyState.textContent = '';
      return;
    }

    this.selectedBodyTitle.textContent = selectedBody.name;
    this.selectedBodyState.textContent = selectedBody.isFixed ? 'Fixed' : 'Moving';
    this.syncBodyInputs(this.selectedBodyInputs, selectedBody);
  }

  private updateNewBodyDefaults(state: SimulationState): void {
    if (document.activeElement !== this.newBodyInputs.name) {
      this.newBodyInputs.name.value = this.newBodyInputs.name.value.trim() === ''
        ? `Body ${state.bodies.length + 1}`
        : this.newBodyInputs.name.value;
    }
  }

  private bindSelectedBodyInputs(): void {
    this.selectedBodyInputs.name.addEventListener('input', () => {
      this.emitSelectedBodyPatch({ name: this.selectedBodyInputs.name.value });
    });
    this.selectedBodyInputs.mass.addEventListener('input', () => {
      this.emitSelectedBodyPatch({ mass: Number(this.selectedBodyInputs.mass.value) });
    });
    this.selectedBodyInputs.radius.addEventListener('input', () => {
      this.emitSelectedBodyPatch({ radius: Number(this.selectedBodyInputs.radius.value) });
    });
    this.selectedBodyInputs.color.addEventListener('input', () => {
      this.emitSelectedBodyPatch({ color: parseHexColor(this.selectedBodyInputs.color.value) });
    });
    this.selectedBodyInputs.isFixed.addEventListener('change', () => {
      this.emitSelectedBodyPatch({ isFixed: this.selectedBodyInputs.isFixed.checked });
    });

    for (const axis of ['x', 'y', 'z'] as const) {
      this.selectedBodyInputs.position[axis].addEventListener('input', () => {
        this.emitSelectedBodyPatch({ position: this.readVectorInputs(this.selectedBodyInputs.position) });
      });
      this.selectedBodyInputs.velocity[axis].addEventListener('input', () => {
        this.emitSelectedBodyPatch({ velocity: this.readVectorInputs(this.selectedBodyInputs.velocity) });
      });
    }
  }

  private bindNewBodyInputs(): void {
    this.resetNewBodyInputs();
  }

  private resetNewBodyInputs(): void {
    const nextBodyNumber = (this.latestState?.bodies.length ?? 3) + 1;
    this.newBodyInputs.name.value = `Body ${nextBodyNumber}`;
    this.newBodyInputs.mass.value = '5';
    this.newBodyInputs.radius.value = '0.4';
    this.newBodyInputs.color.value = '#8ec5ff';
    this.newBodyInputs.position.x.value = '10';
    this.newBodyInputs.position.y.value = '0';
    this.newBodyInputs.position.z.value = '0';
    this.newBodyInputs.velocity.x.value = '0';
    this.newBodyInputs.velocity.y.value = '0';
    this.newBodyInputs.velocity.z.value = '1';
  }

  private emitSelectedBodyPatch(patch: Partial<ManagedBodyInput>): void {
    if (this.selectedBodyId === null) {
      return;
    }

    this.callbacks.onBodyUpdate(this.selectedBodyId, patch);
  }

  private readBodyInputs(inputs: BodyInputControls): ManagedBodyInput {
    return {
      name: inputs.name.value,
      mass: Number(inputs.mass.value),
      radius: Number(inputs.radius.value),
      color: parseHexColor(inputs.color.value),
      isFixed: inputs.isFixed.checked,
      position: this.readVectorInputs(inputs.position),
      velocity: this.readVectorInputs(inputs.velocity)
    };
  }

  private readVectorInputs(inputs: VectorInputControls): ManagedBodyInput['position'] {
    return {
      x: Number(inputs.x.value),
      y: Number(inputs.y.value),
      z: Number(inputs.z.value)
    };
  }

  private syncBodyInputs(inputs: BodyInputControls, body: CelestialBody): void {
    this.syncInputValue(inputs.name, body.name);
    this.syncInputValue(inputs.mass, body.mass.toFixed(2));
    this.syncInputValue(inputs.radius, body.radius.toFixed(2));
    this.syncInputValue(inputs.color, formatHexColor(body.color));
    this.syncCheckbox(inputs.isFixed, body.isFixed);
    this.syncInputValue(inputs.position.x, body.position.x.toFixed(2));
    this.syncInputValue(inputs.position.y, body.position.y.toFixed(2));
    this.syncInputValue(inputs.position.z, body.position.z.toFixed(2));
    this.syncInputValue(inputs.velocity.x, body.velocity.x.toFixed(2));
    this.syncInputValue(inputs.velocity.y, body.velocity.y.toFixed(2));
    this.syncInputValue(inputs.velocity.z, body.velocity.z.toFixed(2));
  }

  private resolveSelectedBodyId(state: SimulationState): BodyId | null {
    if (state.bodies.some((body) => body.id === this.selectedBodyId)) {
      return this.selectedBodyId;
    }

    return state.bodies[0]?.id ?? null;
  }

  private syncRangeControl(control: RangeControl, value: number): void {
    this.syncInputValue(control.input, String(value));
    if (document.activeElement !== control.input) {
      control.valueText.textContent = value.toFixed(control.decimals);
    }
  }

  private syncInputValue(input: HTMLInputElement, value: string): void {
    if (document.activeElement === input) {
      return;
    }

    if (input.value !== value) {
      input.value = value;
    }
  }

  private syncCheckbox(input: HTMLInputElement, checked: boolean): void {
    if (document.activeElement === input) {
      return;
    }

    input.checked = checked;
  }

  private createSection(titleText: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'panel-section';
    const title = document.createElement('h2');
    title.textContent = titleText;
    section.append(title);
    return section;
  }

  private createStatRow(labelText: string, value: HTMLSpanElement): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'stat-row';
    const label = document.createElement('span');
    label.textContent = labelText;
    row.append(label, value);
    return row;
  }

  private createLegend(): HTMLDivElement {
    const legend = document.createElement('div');
    legend.className = 'legend';
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    const legendText = document.createElement('span');
    legendText.textContent = 'blue = weak potential, orange = deep potential';
    legend.append(swatch, legendText);
    return legend;
  }

  private createRangeControl(config: RangeControlConfig): RangeControl {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.setAttribute('for', config.id);
    const labelText = document.createElement('span');
    labelText.textContent = config.labelText;
    const valueText = document.createElement('span');
    valueText.textContent = config.value.toFixed(config.decimals);
    label.append(labelText, valueText);

    const input = document.createElement('input');
    input.id = config.id;
    input.type = 'range';
    input.min = String(config.range.min);
    input.max = String(config.range.max);
    input.step = String(config.range.step);
    input.value = String(config.value);
    input.addEventListener('input', () => {
      const nextValue = Number(input.value);
      valueText.textContent = nextValue.toFixed(config.decimals);
      config.onInput(nextValue);
    });

    group.append(label, input);
    return { group, input, valueText, decimals: config.decimals };
  }

  private createCheckboxRow(
    id: string,
    labelText: string,
    input: HTMLInputElement,
    onChange: (checked: boolean) => void
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = 'toggle-row';
    const text = document.createElement('span');
    text.textContent = labelText;

    input.id = id;
    input.type = 'checkbox';
    input.addEventListener('change', () => onChange(input.checked));

    label.append(text, input);
    return label;
  }

  private createBodyInputControls(prefix: string): BodyInputControls {
    const group = document.createElement('div');
    group.className = 'body-editor';

    const name = this.createTextInput(`${prefix}-name`, 'Name');
    const mass = this.createNumberInput(`${prefix}-mass`, 'Mass', MASS_LIMITS);
    const radius = this.createNumberInput(`${prefix}-radius`, 'Size', RADIUS_LIMITS);
    const color = this.createColorInput(`${prefix}-color`, 'Color');
    const isFixed = this.createBooleanInput(`${prefix}-fixed`, 'Fixed body');
    const position = this.createVectorGroup(`${prefix}-position`, 'Position', POSITION_LIMITS);
    const velocity = this.createVectorGroup(`${prefix}-velocity`, 'Velocity', VELOCITY_LIMITS);

    group.append(
      name.group,
      mass.group,
      radius.group,
      color.group,
      isFixed.group,
      position.group,
      velocity.group
    );

    return {
      group,
      name: name.input,
      mass: mass.input,
      radius: radius.input,
      color: color.input,
      isFixed: isFixed.input,
      position: position.inputs,
      velocity: velocity.inputs
    };
  }

  private createTextInput(id: string, labelText: string): TextInputControl {
    const group = document.createElement('label');
    group.className = 'field-group';
    group.setAttribute('for', id);
    const label = document.createElement('span');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.type = 'text';
    group.append(label, input);
    return { group, input };
  }

  private createNumberInput(
    id: string,
    labelText: string,
    limits: Range & { readonly step: number }
  ): NumberInputControl {
    const group = document.createElement('label');
    group.className = 'field-group';
    group.setAttribute('for', id);
    const label = document.createElement('span');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.type = 'number';
    input.min = String(limits.min);
    input.max = String(limits.max);
    input.step = String(limits.step);
    group.append(label, input);
    return { group, input };
  }

  private createColorInput(id: string, labelText: string): ColorInputControl {
    const group = document.createElement('label');
    group.className = 'field-group';
    group.setAttribute('for', id);
    const label = document.createElement('span');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.type = 'color';
    group.append(label, input);
    return { group, input };
  }

  private createBooleanInput(id: string, labelText: string): BooleanInputControl {
    const group = document.createElement('label');
    group.className = 'toggle-row field-group-inline';
    const text = document.createElement('span');
    text.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.type = 'checkbox';
    group.append(text, input);
    return { group, input };
  }

  private createVectorGroup(
    prefix: string,
    labelText: string,
    limits: Range & { readonly step: number }
  ): VectorGroupControl {
    const group = document.createElement('div');
    group.className = 'vector-group';
    const title = document.createElement('span');
    title.className = 'vector-group-label';
    title.textContent = labelText;
    const row = document.createElement('div');
    row.className = 'vector-row';

    const x = this.createAxisInput(`${prefix}-x`, 'X', limits);
    const y = this.createAxisInput(`${prefix}-y`, 'Y', limits);
    const z = this.createAxisInput(`${prefix}-z`, 'Z', limits);
    row.append(x.group, y.group, z.group);
    group.append(title, row);

    return {
      group,
      inputs: {
        x: x.input,
        y: y.input,
        z: z.input
      }
    };
  }

  private createAxisInput(
    id: string,
    axisLabel: string,
    limits: Range & { readonly step: number }
  ): NumberInputControl {
    const group = document.createElement('label');
    group.className = 'axis-field';
    group.setAttribute('for', id);
    const label = document.createElement('span');
    label.textContent = axisLabel;
    const input = document.createElement('input');
    input.id = id;
    input.type = 'number';
    input.min = String(limits.min);
    input.max = String(limits.max);
    input.step = String(limits.step);
    group.append(label, input);
    return { group, input };
  }
}

interface RangeControlConfig {
  readonly id: string;
  readonly labelText: string;
  readonly range: Range & { readonly step: number };
  readonly value: number;
  readonly decimals: number;
  readonly onInput: (value: number) => void;
}

interface RangeControl {
  readonly group: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly valueText: HTMLSpanElement;
  readonly decimals: number;
}

interface TextInputControl {
  readonly group: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

interface NumberInputControl {
  readonly group: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

interface ColorInputControl {
  readonly group: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

interface BooleanInputControl {
  readonly group: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

interface VectorInputControls {
  readonly x: HTMLInputElement;
  readonly y: HTMLInputElement;
  readonly z: HTMLInputElement;
}

interface VectorGroupControl {
  readonly group: HTMLDivElement;
  readonly inputs: VectorInputControls;
}

interface BodyInputControls {
  readonly group: HTMLDivElement;
  readonly name: HTMLInputElement;
  readonly mass: HTMLInputElement;
  readonly radius: HTMLInputElement;
  readonly color: HTMLInputElement;
  readonly isFixed: HTMLInputElement;
  readonly position: VectorInputControls;
  readonly velocity: VectorInputControls;
}

const formatVector = (vector: SimulationState['bodies'][number]['position']): string =>
  `${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)}`;

const formatHexColor = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

const parseHexColor = (hex: string): number => Number.parseInt(hex.slice(1), 16);
