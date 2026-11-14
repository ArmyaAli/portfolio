import * as THREE from "three";
import { CameraRig } from "./camera-rig";
import { ExperienceInput } from "./input";
import { stationById, stations, type StationId } from "./stations";
import { palette } from "./theme";
import { ResumeWorld } from "./world";

const root = document.querySelector<HTMLElement>("[data-experience]");
const canvas = document.querySelector<HTMLCanvasElement>("[data-experience-canvas]");

if (!root || !canvas) {
  throw new Error("Experience markup is missing");
}

const experienceRoot = root;
const experienceCanvas = canvas;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = window.matchMedia("(max-width: 760px)").matches;
const labels = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-station-label]"),
);
const stationCount = document.querySelector<HTMLElement>("[data-station-count]");
const live = document.querySelector<HTMLElement>("[data-live]");
const projected = new THREE.Vector3();

let activeId: StationId | undefined;
let hoveredId: StationId | undefined;
let rig: CameraRig;
let world: ResumeWorld;

function setState(state: "loading" | "intro" | "exploring" | "fallback") {
  experienceRoot.dataset.state = state;
}

function setExploring() {
  if (experienceRoot.dataset.state === "intro") {
    setState("exploring");
  }
}

function updateLabels() {
  const width = experienceCanvas.clientWidth;
  const height = experienceCanvas.clientHeight;

  for (const label of labels) {
    const id = label.dataset.stationLabel as StationId | undefined;
    const station = id ? stationById.get(id) : undefined;
    if (!station) continue;

    projected.set(station.x, station.y + 1.7, 0).project(rig.camera);
    const visible = projected.z < 1 && Math.abs(projected.x) < 1.25 && Math.abs(projected.y) < 1.25;
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;

    label.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    label.style.opacity = visible ? "1" : "0";
    label.style.pointerEvents = visible ? "auto" : "none";
    label.classList.toggle("is-hovered", hoveredId === id);
    label.classList.toggle("is-active", activeId === id);
    label.setAttribute("aria-current", activeId === id ? "true" : "false");
  }
}

function selectStation(id: StationId) {
  const station = stationById.get(id);
  if (!station) return;

  activeId = id;
  world.setActive(id);
  rig.focusStation(station, narrow);
  setExploring();

  if (stationCount) {
    stationCount.textContent = `${String(station.index).padStart(2, "0")} / ${String(stations.length - 1).padStart(2, "0")}`;
  }

  if (live) live.textContent = `${station.label} station selected.`;

  experienceRoot.dispatchEvent(
    new CustomEvent("station:open", {
      detail: { id },
      bubbles: true,
    }),
  );
}

function start() {
  const renderer = new THREE.WebGLRenderer({
    canvas: experienceCanvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(palette.background, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  world = new ResumeWorld(narrow);
  rig = new CameraRig();

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    rig.setViewport(width, height, reducedMotion);
  };

  resize();
  window.addEventListener("resize", resize);

  const input = new ExperienceInput(experienceCanvas, {
    onFirstInput: setExploring,
    onDrag: (dx, dy) => rig.panByPixels(dx, dy, experienceCanvas.clientHeight),
    onWheel: (dx, dy) =>
      rig.panByPixels(-dx * 1.8, -dy * 1.8, experienceCanvas.clientHeight),
    onHover: (clientX, clientY) => {
      hoveredId = world.raycast(
        rig.camera,
        clientX,
        clientY,
        experienceCanvas.getBoundingClientRect(),
      );
      world.setHover(hoveredId);
      experienceCanvas.classList.toggle("is-hovering", Boolean(hoveredId));
    },
    onClick: (clientX, clientY) => {
      const id = world.raycast(
        rig.camera,
        clientX,
        clientY,
        experienceCanvas.getBoundingClientRect(),
      );
      if (id) selectStation(id);
    },
  });

  for (const label of labels) {
    label.addEventListener("click", () => {
      const id = label.dataset.stationLabel as StationId | undefined;
      if (id) selectStation(id);
    });
  }

  document.querySelector("[data-enter]")?.addEventListener("click", () => {
    setExploring();
    rig.focusStation(stations[0], narrow);
  });

  let previous = performance.now();
  let elapsed = 0;
  let frameId = 0;

  const frame = (now: number) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += delta;
    const keyboard = input.keyboardDirection();

    if (keyboard.x !== 0 || keyboard.y !== 0) {
      const speed = 7.5 * delta;
      rig.moveBy(keyboard.x * speed, keyboard.y * speed);
    }

    rig.update(delta);

    if (!reducedMotion) {
      world.update(elapsed, delta);
    }

    renderer.render(world.scene, rig.camera);
    updateLabels();
    frameId = requestAnimationFrame(frame);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      return;
    }

    previous = performance.now();
    frameId = requestAnimationFrame(frame);
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  setState("intro");
  updateLabels();
  frameId = requestAnimationFrame(frame);

  const debug = {
    getState: () => ({
      state: experienceRoot.dataset.state,
      activeId,
      hoveredId,
      camera: { x: rig.camera.position.x, y: rig.camera.position.y },
    }),
    openStation: (id: StationId) => selectStation(id),
  };
  (window as Window & { __resumeExperience?: typeof debug }).__resumeExperience =
    debug;
}

try {
  start();
} catch (error) {
  console.error(error);
  setState("fallback");
  document.documentElement.dataset.experience = "fallback";
}
