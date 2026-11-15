import * as THREE from "three";
import { CameraRig } from "./camera-rig";
import { ExperienceInput } from "./input";
import { createStationOverlay, type StationOverlay } from "./overlay";
import type { ResumeDocument } from "../lib/resume/types";
import resumeJson from "../data/resume.generated.json";
import { stationById, stations, type StationId } from "./stations";
import { paletteFor, type Theme } from "./theme";
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
const compact = window.matchMedia("(max-height: 560px)").matches;
const labels = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-station-label]"),
);
const mapButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-station-map]"),
);
const stationCount = document.querySelector<HTMLElement>("[data-station-count]");
const autoButton = document.querySelector<HTMLButtonElement>("[data-auto]");
const autoLabel = document.querySelector<HTMLElement>("[data-auto-label]");
const autoIcon = document.querySelector<HTMLElement>("[data-auto-icon]");
const nextButton = document.querySelector<HTMLButtonElement>("[data-next-node]");
const tourElement = document.querySelector<HTMLElement>("[data-tour]");
const tourProgress = document.querySelector<HTMLElement>("[data-tour-progress]");
const tourBar = document.querySelector<HTMLElement>("[data-tour-bar]");
const tourCountdown = document.querySelector<HTMLElement>("[data-tour-countdown]");
const live = document.querySelector<HTMLElement>("[data-live]");
const projected = new THREE.Vector3();
const resume = resumeJson as ResumeDocument;
const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

let activeId: StationId | undefined;
let hoveredId: StationId | undefined;
let rig: CameraRig;
let world: ResumeWorld;
let overlay: StationOverlay | undefined;
let autoTour = true;
let autoRunning = false;
let autoResumeAt = 0;
let autoNextAt = Number.POSITIVE_INFINITY;
let autoZoomAt = 0;
let autoLegStart = 0;
let lastCountdown = -1;
let autoIndex = -1;

function setState(state: "loading" | "intro" | "exploring" | "fallback") {
  experienceRoot.dataset.state = state;
}

function setExploring() {
  if (experienceRoot.dataset.state !== "intro") return;
  setState("exploring");
}

function updateLabels() {
  const width = experienceCanvas.clientWidth;
  const height = experienceCanvas.clientHeight;

  for (const label of labels) {
    const id = label.dataset.stationLabel as StationId | undefined;
    const station = id ? stationById.get(id) : undefined;
    if (!station) continue;

    projected.set(station.x, station.y - 1.75, 0).project(rig.camera);
    const visible = projected.z < 1 && Math.abs(projected.x) < 1.25 && Math.abs(projected.y) < 1.25;
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;

    const padding = width < 600 ? 52 : 84;
    const labelX = Math.min(Math.max(x, padding), width - padding);
    label.style.transform = `translate(-50%, -50%) translate(${labelX.toFixed(1)}px, ${y.toFixed(1)}px)`;
    label.style.opacity = visible ? "1" : "0";
    label.style.pointerEvents = visible ? "auto" : "none";
    label.tabIndex = visible ? 0 : -1;
    label.classList.toggle("is-hovered", hoveredId === id);
    label.classList.toggle("is-active", activeId === id);
    label.setAttribute("aria-current", activeId === id ? "true" : "false");
  }
}

function activateStation(
  id: StationId,
  {
    openDialog = false,
    trigger,
    pushHistory = true,
  }: { openDialog?: boolean; trigger?: HTMLElement; pushHistory?: boolean } = {},
) {
  const station = stationById.get(id);
  if (!station) return;

  activeId = id;
  world.setActive(id);
  rig.focusStation(station, narrow);
  setExploring();

  if (stationCount) {
    stationCount.textContent = `${String(station.index).padStart(2, "0")} / ${String(stations.length - 1).padStart(2, "0")}`;
  }

  for (const button of mapButtons) {
    const current = button.dataset.stationMap === id;
    button.classList.toggle("is-active", current);
    button.setAttribute("aria-current", current ? "true" : "false");
  }

  if (live) live.textContent = `${station.label} station selected.`;

  if (openDialog) {
    overlay?.open(id, trigger, { pushHistory });
  }
}

function updateAutoControl() {
  autoButton?.setAttribute("aria-pressed", String(autoTour));
  if (autoLabel) autoLabel.textContent = autoTour ? "Pause" : "Auto";
  if (autoIcon) autoIcon.textContent = autoTour ? "Ⅱ" : "▶";
  autoButton?.setAttribute(
    "aria-label",
    autoTour ? "Pause auto tour" : "Start auto tour",
  );
  tourElement?.setAttribute("data-active", String(autoTour && autoRunning));

  if (!autoTour || !autoRunning) {
    tourProgress?.setAttribute("aria-valuenow", "0");
    if (tourBar) tourBar.style.transform = "scaleX(0)";
    if (tourCountdown) tourCountdown.textContent = autoTour ? "Paused" : "Off";
    lastCountdown = -1;
  }
}

function updateTourProgress(now: number) {
  if (!autoTour || !autoRunning || !Number.isFinite(autoNextAt)) return;

  const total = Math.max(autoNextAt - autoLegStart, 1);
  const remaining = Math.max(autoNextAt - now, 0);
  const progress = Math.min(remaining / total, 1);

  if (tourBar) {
    tourBar.style.transform = `scaleX(${progress.toFixed(4)})`;
  }

  const seconds = Math.ceil(remaining / 1000);

  if (seconds !== lastCountdown) {
    lastCountdown = seconds;
    if (tourCountdown) {
      tourCountdown.textContent = seconds > 0 ? `Next in ${seconds}s` : "Next now";
    }
    tourProgress?.setAttribute(
      "aria-valuenow",
      String(Math.round(progress * 100)),
    );
  }
}

function startAutoCountdown(delay: number, index?: number) {
  if (!autoTour) return;

  autoRunning = true;
  autoResumeAt = 0;
  autoIndex =
    index ??
    (activeId ? (stationById.get(activeId)?.index ?? -1) : -1);
  autoLegStart = performance.now();
  autoNextAt = autoLegStart + delay;
  autoZoomAt = 0;
  rig.setDamping(7.5);
  rig.zoomBase();
  updateAutoControl();
  updateTourProgress(autoLegStart);
}

function pauseAuto(resumeAfterMs = 0) {
  autoRunning = false;
  autoNextAt = Number.POSITIVE_INFINITY;
  autoZoomAt = 0;
  autoLegStart = 0;
  autoResumeAt =
    resumeAfterMs > 0 ? performance.now() + resumeAfterMs : 0;
  rig.setDamping(7.5);
  rig.zoomBase();
  updateAutoControl();
}

function startAutoForActiveNode(delay = 9200) {
  if (!autoTour) return;
  startAutoCountdown(delay);
}

function disableAuto() {
  autoTour = false;
  autoResumeAt = 0;
  pauseAuto();
  updateAutoControl();
  if (live) live.textContent = "Auto tour stopped.";
}

function advanceTour() {
  autoIndex = (autoIndex + 1) % stations.length;
  const station = stations[autoIndex];
  activateStation(station.id, { openDialog: false });
  const now = performance.now();
  autoRunning = true;
  autoResumeAt = 0;
  autoLegStart = now;
  autoZoomAt = now + 3400;
  autoNextAt = now + 9200;
  rig.setDamping(3);
  rig.zoomOut();
  updateTourProgress(now);
}

function setAutoTour(enabled: boolean) {
  if (!enabled) {
    disableAuto();
    return;
  }

  autoTour = true;
  autoResumeAt = 0;
  autoRunning = false;
  setExploring();
  startAutoCountdown(1200);
  updateAutoControl();
  if (live) live.textContent = "Auto tour started.";
}

function nextNode() {
  pauseAuto(6500);
  autoIndex = activeId ? (stationById.get(activeId)?.index ?? -1) : -1;
  autoIndex = (autoIndex + 1) % stations.length;
  activateStation(stations[autoIndex].id, { openDialog: false });
}

function selectStation(id: StationId, trigger?: HTMLElement) {
  pauseAuto();
  activateStation(id, { openDialog: true, trigger });
}

function start() {
  const renderer = new THREE.WebGLRenderer({
    canvas: experienceCanvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  const initialTheme = currentTheme();
  renderer.setClearColor(paletteFor(initialTheme).background, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  world = new ResumeWorld(narrow, resume, compact, initialTheme);
  rig = new CameraRig();

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    rig.setViewport(width, height, reducedMotion);
  };

  const applyTheme = (theme: Theme) => {
    world.setTheme(theme);
    renderer.setClearColor(paletteFor(theme).background, 1);
  };

  document.addEventListener("themechange", (event) => {
    const theme = (event as CustomEvent<{ theme?: Theme }>).detail?.theme;
    if (theme === "light" || theme === "dark") applyTheme(theme);
  });

  resize();
  window.addEventListener("resize", resize);

  overlay = createStationOverlay(experienceRoot, {
    onNavigate: (id) => activateStation(id, { openDialog: false }),
    onClose: () => startAutoForActiveNode(),
  });

  const input = new ExperienceInput(experienceCanvas, {
    onFirstInput: () => {
      const entering = experienceRoot.dataset.state === "intro";
      setExploring();
      if (entering && autoTour && !autoRunning) {
        startAutoCountdown(7500, 0);
      }
    },
    onManualInput: () => {
      if (experienceRoot.dataset.state === "exploring" && autoTour) {
        pauseAuto(6500);
      }
    },
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
      if (id) selectStation(id, label);
    });
  }

  for (const button of mapButtons) {
    button.addEventListener("click", () => {
      const id = button.dataset.stationMap as StationId | undefined;
      if (id) selectStation(id, button);
    });
  }

  autoButton?.addEventListener("click", () => setAutoTour(!autoTour));
  nextButton?.addEventListener("click", nextNode);

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-open-station]",
  )) {
    button.addEventListener("click", () => {
      const id = button.dataset.openStation as StationId | undefined;
      if (id) selectStation(id, button);
    });
  }

  document.querySelector("[data-enter]")?.addEventListener("click", () => {
    setExploring();
    rig.focusStation(stations[0], narrow);
    if (autoTour) startAutoCountdown(7500, 0);
  });

  let previous = performance.now();
  let elapsed = 0;
  let frameId = 0;

  const frame = (now: number) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += delta;
    const keyboard = input.keyboardDirection();

    if (
      !autoRunning &&
      autoTour &&
      autoResumeAt > 0 &&
      now >= autoResumeAt &&
      !document.querySelector("dialog[open]")
    ) {
      startAutoForActiveNode(9200);
    }

    if (autoRunning && autoZoomAt > 0 && now >= autoZoomAt) {
      rig.zoomIn();
      autoZoomAt = 0;
    }

    if (autoRunning && now >= autoNextAt) {
      advanceTour();
    }

    updateTourProgress(now);

    if (keyboard.x !== 0 || keyboard.y !== 0) {
      const speed = 7.5 * delta;
      rig.moveBy(keyboard.x * speed, keyboard.y * speed);
    }

    rig.update(delta);

    world.update(
      elapsed,
      delta,
      rig.camera.position.x,
      rig.camera.position.y,
      !reducedMotion,
    );

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

  updateAutoControl();

  const initialId = window.location.hash.slice(1) as StationId;
  if (stationById.has(initialId)) {
    autoTour = false;
    updateAutoControl();
    activateStation(initialId, { openDialog: true, pushHistory: false });
  }

  frameId = requestAnimationFrame(frame);

  const debug = {
    getState: () => ({
      state: experienceRoot.dataset.state,
      activeId,
      hoveredId,
      autoTour,
      autoRunning,
      camera: {
        x: rig.camera.position.x,
        y: rig.camera.position.y,
        z: rig.camera.position.z,
      },
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
