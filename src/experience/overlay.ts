import { stationById, stations, type StationId } from "./stations";

type OverlayOptions = {
  onNavigate: (id: StationId) => void;
};

export type StationOverlay = {
  open: (
    id: StationId,
    trigger?: HTMLElement,
    options?: { pushHistory?: boolean },
  ) => void;
  close: () => void;
  isOpen: () => boolean;
};

export function createStationOverlay(
  root: HTMLElement,
  options: OverlayOptions,
): StationOverlay {
  const dialog = root.querySelector<HTMLDialogElement>("[data-station-dialog]");
  const kicker = root.querySelector<HTMLElement>("[data-dialog-kicker]");
  const title = root.querySelector<HTMLElement>("[data-dialog-title]");
  const body = root.querySelector<HTMLElement>("[data-dialog-body]");
  const index = root.querySelector<HTMLElement>("[data-dialog-index]");
  const closeButton = root.querySelector<HTMLButtonElement>("[data-dialog-close]");
  const previous = root.querySelector<HTMLButtonElement>("[data-dialog-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-dialog-next]");
  const articles = Array.from(
    root.querySelectorAll<HTMLElement>("[data-station-article]"),
  );

  if (!dialog || !kicker || !title || !body || !index) {
    throw new Error("Station dialog markup is incomplete");
  }

  let currentId: StationId | undefined;
  let lastTrigger: HTMLElement | undefined;

  const updateHash = (id?: StationId) => {
    const nextHash = id ? `#${id}` : "";
    const url = `${window.location.pathname}${window.location.search}${nextHash}`;

    if (id) {
      window.history.pushState({ station: id }, "", url);
    } else {
      window.history.replaceState({}, "", url);
    }
  };

  const showArticle = (id: StationId) => {
    const station = stationById.get(id);
    if (!station) return;

    for (const article of articles) {
      article.hidden = article.dataset.stationArticle !== id;
    }

    kicker.textContent = station.kicker;
    title.textContent = station.title;
    index.textContent = `${String(station.index).padStart(2, "0")} / ${String(stations.length - 1).padStart(2, "0")}`;
    body.scrollTop = 0;
  };

  const open = (
    id: StationId,
    trigger?: HTMLElement,
    { pushHistory = true }: { pushHistory?: boolean } = {},
  ) => {
    currentId = id;
    lastTrigger = trigger;
    showArticle(id);

    if (!dialog.open) {
      dialog.showModal();
    }

    if (pushHistory) {
      updateHash(id);
    }

    requestAnimationFrame(() => title.focus());
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.addEventListener("close", () => {
    const closedId = currentId;
    currentId = undefined;

    if (closedId && window.location.hash === `#${closedId}`) {
      updateHash();
    }

    const fallback = root.querySelector<HTMLElement>(
      '[data-station-map][aria-current="true"]',
    );
    const focusTarget =
      lastTrigger && lastTrigger.offsetParent !== null && lastTrigger.tabIndex >= 0
        ? lastTrigger
        : fallback;

    focusTarget?.focus({ preventScroll: true });
  });

  closeButton?.addEventListener("click", close);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  previous?.addEventListener("click", () => {
    if (!currentId) return;
    const stationIndex = stations.findIndex((station) => station.id === currentId);
    const target = stations[(stationIndex - 1 + stations.length) % stations.length];
    options.onNavigate(target.id);
    showArticle(target.id);
    currentId = target.id;
    updateHash(target.id);
  });

  next?.addEventListener("click", () => {
    if (!currentId) return;
    const stationIndex = stations.findIndex((station) => station.id === currentId);
    const target = stations[(stationIndex + 1) % stations.length];
    options.onNavigate(target.id);
    showArticle(target.id);
    currentId = target.id;
    updateHash(target.id);
  });

  window.addEventListener("popstate", () => {
    const hash = window.location.hash.slice(1);
    const station = stationById.get(hash as StationId);

    if (station) {
      options.onNavigate(station.id);
      showArticle(station.id);
      currentId = station.id;
      if (!dialog.open) dialog.showModal();
      return;
    }

    close();
  });

  return {
    open,
    close,
    isOpen: () => dialog.open,
  };
}
