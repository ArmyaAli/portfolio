import * as THREE from "three";
import type { ResumeDocument } from "../lib/resume/types";
import { palette } from "./theme";
import { stations, type Station, type StationId, worldBounds } from "./stations";
import { createStationTextTexture, textPanelFor } from "./text";

type StationVisual = {
  station: Station;
  group: THREE.Group;
  orbit: THREE.Group;
  ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  core: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  text: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  targetScale: number;
};

export class ResumeWorld {
  readonly scene = new THREE.Scene();

  private readonly stationVisuals = new Map<StationId, StationVisual>();
  private readonly raycastTargets: THREE.Object3D[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly sporeLayers: THREE.Points[] = [];
  private readonly pathMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly showText: boolean;
  private pathCurve?: THREE.CatmullRomCurve3;
  private traveler?: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private activeId?: StationId;

  constructor(narrow: boolean, resume: ResumeDocument, compact = false) {
    this.showText = !compact;
    this.scene.fog = new THREE.FogExp2(palette.background, 0.016);
    this.buildBackdrop(narrow);
    this.buildPath();
    this.buildStations(resume, narrow);
  }

  private buildStations(resume: ResumeDocument, narrow: boolean) {
    const panel = textPanelFor(narrow);

    for (const station of stations) {
      const group = new THREE.Group();
      group.position.set(station.x, station.y, 0);

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.82, 48),
        new THREE.MeshBasicMaterial({
          color: palette.surface,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
        }),
      );
      disc.position.z = -0.02;
      group.add(disc);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.94, 1.08, 64),
        new THREE.MeshBasicMaterial({
          color: palette.accent,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      group.add(halo);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.04, 0.018, 8, 64),
        new THREE.MeshBasicMaterial({
          color: palette.accent,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
        }),
      );
      group.add(ring);

      const core = new THREE.Mesh(
        new THREE.CircleGeometry(0.16, 24),
        new THREE.MeshBasicMaterial({
          color: palette.ink,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      core.position.z = 0.02;
      group.add(core);

      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -1.7, -0.1),
          new THREE.Vector3(0, -0.9, -0.1),
        ]),
        new THREE.LineBasicMaterial({
          color: palette.muted,
          transparent: true,
          opacity: 0.24,
        }),
      );
      group.add(stem);

      const text = new THREE.Mesh(
        new THREE.PlaneGeometry(panel.width, panel.height),
        new THREE.MeshBasicMaterial({
          map: createStationTextTexture(station, resume, narrow),
          transparent: false,
          alphaTest: 0.5,
          depthWrite: true,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      text.position.set(0, narrow ? 4.0 : 3.0, narrow ? 1.0 : -0.8);
      text.renderOrder = 2;
      text.userData.stationId = station.id;
      text.visible = this.showText;
      group.add(text);
      this.raycastTargets.push(text);

      const orbit = new THREE.Group();
      for (let index = 0; index < 3; index++) {
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.035, 12),
          new THREE.MeshBasicMaterial({
            color: index === 1 ? palette.green : palette.yellow,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
          }),
        );
        const angle = (index / 3) * Math.PI * 2;
        dot.position.set(Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0.04);
        orbit.add(dot);
      }
      group.add(orbit);

      for (const target of [disc, halo, ring, core]) {
        target.userData.stationId = station.id;
        this.raycastTargets.push(target);
      }

      this.scene.add(group);
      this.stationVisuals.set(station.id, {
        station,
        group,
        orbit,
        ring,
        halo,
        core,
        text,
        targetScale: 1,
      });
    }
  }

  private buildPath() {
    const curve = new THREE.CatmullRomCurve3(
      stations.map((station) => new THREE.Vector3(station.x, station.y, 0)),
      false,
      "catmullrom",
      0.5,
    );
    this.pathCurve = curve;

    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 220, 0.11, 6, false),
      new THREE.MeshBasicMaterial({
        color: palette.accent,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.pathMaterials.push(glow.material as THREE.MeshBasicMaterial);
    this.scene.add(glow);

    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 220, 0.018, 6, false),
      new THREE.MeshBasicMaterial({
        color: palette.accent,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      }),
    );
    this.pathMaterials.push(line.material as THREE.MeshBasicMaterial);
    this.scene.add(line);

    this.traveler = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({
        color: palette.yellow,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.scene.add(this.traveler);
  }

  private buildBackdrop(narrow: boolean) {
    const branches = new THREE.Group();

    for (let index = 0; index < 11; index++) {
      const points: THREE.Vector3[] = [];
      const startX = (index - 3) * 4.5;
      const startY = worldBounds.maxY - index * 3;

      for (let step = 0; step <= 22; step++) {
        points.push(
          new THREE.Vector3(
            startX + Math.sin(step * 0.34 + index) * (2.4 + index * 0.2),
            startY - step * 3.1,
            -9 - index * 1.2,
          ),
        );
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const branch = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
        new THREE.LineBasicMaterial({
          color: index % 2 === 0 ? palette.line : palette.green,
          transparent: true,
          opacity: index % 2 === 0 ? 0.24 : 0.1,
        }),
      );
      branches.add(branch);
    }

    this.scene.add(branches);

    const counts = narrow ? [360, 180, 100] : [1000, 420, 200];
    const colors = [palette.accent, palette.green, palette.yellow];

    counts.forEach((count, layerIndex) => {
      const positions = new Float32Array(count * 3);

      for (let index = 0; index < count; index++) {
        positions[index * 3] = THREE.MathUtils.randFloat(worldBounds.minX - 8, worldBounds.maxX + 8);
        positions[index * 3 + 1] = THREE.MathUtils.randFloat(worldBounds.minY - 8, worldBounds.maxY + 10);
        positions[index * 3 + 2] = THREE.MathUtils.randFloat(-26, 5);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: colors[layerIndex],
          size: layerIndex === 0 ? 0.07 : layerIndex === 1 ? 0.05 : 0.035,
          sizeAttenuation: true,
          transparent: true,
          opacity: layerIndex === 0 ? 0.72 : layerIndex === 1 ? 0.52 : 0.36,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      points.position.z = layerIndex === 2 ? 4 : -layerIndex * 2;
      this.sporeLayers.push(points);
      this.scene.add(points);
    });
  }

  raycast(
    camera: THREE.Camera,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): StationId | undefined {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return undefined;

    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, camera);

    const [hit] = this.raycaster.intersectObjects(this.raycastTargets, false);
    return hit?.object.userData.stationId as StationId | undefined;
  }

  setHover(id?: StationId) {
    for (const [stationId, visual] of this.stationVisuals) {
      visual.targetScale = stationId === id ? 1.08 : stationId === this.activeId ? 1.12 : 1;
      visual.ring.material.opacity = stationId === id ? 0.95 : 0.62;
    }
  }

  setActive(id?: StationId) {
    this.activeId = id;

    for (const [stationId, visual] of this.stationVisuals) {
      const active = stationId === id;
      visual.targetScale = active ? 1.12 : 1;
      visual.ring.material.color.setHex(active ? palette.yellow : palette.accent);
      visual.core.material.color.setHex(active ? palette.accent : palette.ink);
    }
  }

  update(time: number, delta: number, cameraX: number, cameraY: number) {
    const pulse = 0.5 + Math.sin(time * 0.8) * 0.5;

    for (const material of this.pathMaterials) {
      material.opacity = material === this.pathMaterials[0]
        ? 0.08 + pulse * 0.035
        : 0.4 + pulse * 0.1;
    }

    for (const [index, layer] of this.sporeLayers.entries()) {
      layer.rotation.z = Math.sin(time * 0.03 + index) * 0.015;
      layer.position.y = Math.sin(time * 0.05 + index * 1.4) * 0.35;
    }

    let index = 0;
    for (const [stationId, visual] of this.stationVisuals) {
      const scale = THREE.MathUtils.lerp(
        visual.group.scale.x,
        visual.targetScale,
        1 - Math.exp(-delta * 8),
      );
      visual.group.scale.setScalar(scale);
      visual.orbit.rotation.z = time * 0.12 + index * 0.7;
      visual.halo.material.opacity =
        stationId === this.activeId ? 0.2 + pulse * 0.1 : 0.14;
      visual.text.visible =
        this.showText &&
        Math.abs(visual.station.y - cameraY) < 8.5 &&
        Math.abs(visual.station.x - cameraX) < 10.5;
      index += 1;
    }

    if (this.pathCurve && this.traveler) {
      const travel = (time * 0.035) % 1;

      if (this.pathCurve.points.length > 3 && Number.isFinite(travel)) {
        try {
          this.pathCurve.getPoint(travel, this.traveler.position);
          this.traveler.scale.setScalar(1 + Math.sin(time * 4) * 0.22);
        } catch {
          // Decorative only: keep the scene alive if a curve sample is invalid.
          this.traveler.visible = false;
        }
      }
    }
  }
}
