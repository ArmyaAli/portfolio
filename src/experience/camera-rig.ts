import * as THREE from "three";
import { worldBounds, type Station } from "./stations";

const MIN_FOV = 42;

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  readonly target = new THREE.Vector2(0, 0);

  private readonly position = new THREE.Vector2(0, 0);
  private baseZ = 18;
  private targetZ = 18;
  private damping = 7.5;
  private reducedMotion = false;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(MIN_FOV, 1, 0.1, 120);
    this.camera.position.set(0, 0, this.baseZ);
  }

  setViewport(width: number, height: number, reducedMotion: boolean) {
    const aspect = width / Math.max(height, 1);
    this.reducedMotion = reducedMotion;
    this.baseZ = aspect < 0.8 ? 22 : 18;

    this.camera.aspect = aspect;
    this.camera.position.z = this.baseZ;
    this.targetZ = this.baseZ;
    this.camera.updateProjectionMatrix();
  }

  setDamping(value: number) {
    this.damping = value;
  }

  zoomOut() {
    this.targetZ = this.baseZ + 9;
  }

  zoomIn() {
    this.targetZ = this.baseZ + 0.2;
  }

  zoomBase() {
    this.targetZ = this.baseZ;
  }

  moveBy(dx: number, dy: number) {
    this.target.x += dx;
    this.target.y += dy;
    this.clamp();
  }

  moveTo(x: number, y: number) {
    this.target.set(x, y);
    this.clamp();
  }

  panByPixels(dx: number, dy: number, viewportHeight: number) {
    const worldHeight =
      2 *
      this.camera.position.z *
      Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const scale = worldHeight / Math.max(viewportHeight, 1);
    this.moveBy(-dx * scale, dy * scale);
  }

  focusStation(station: Station, narrow: boolean) {
    this.target.set(
      station.x + (narrow ? 0 : -3.4),
      station.y + (narrow ? 5.0 : 1.8),
    );
    this.clamp();
  }

  update(delta: number) {
    const factor = this.reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.05) * this.damping);

    this.position.lerp(this.target, factor);
    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y;
    this.camera.position.z += (this.targetZ - this.camera.position.z) * factor;
    this.camera.lookAt(this.position.x, this.position.y, 0);
  }

  private clamp() {
    this.target.x = THREE.MathUtils.clamp(
      this.target.x,
      worldBounds.minX,
      worldBounds.maxX,
    );
    this.target.y = THREE.MathUtils.clamp(
      this.target.y,
      worldBounds.minY,
      worldBounds.maxY,
    );
  }
}
