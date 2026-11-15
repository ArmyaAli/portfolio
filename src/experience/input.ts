type InputCallbacks = {
  onFirstInput: () => void;
  onDrag: (dx: number, dy: number) => void;
  onWheel: (dx: number, dy: number) => void;
  onHover: (clientX: number, clientY: number) => void;
  onClick: (clientX: number, clientY: number) => void;
  onManualInput: () => void;
};

export class ExperienceInput {
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: InputCallbacks;
  private readonly keys = new Set<string>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragDistance = 0;
  private pointerType = "mouse";
  private firstInput = false;

  constructor(canvas: HTMLCanvasElement, callbacks: InputCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  keyboardDirection() {
    let x = 0;
    let y = 0;

    if (this.keys.has("a") || this.keys.has("arrowleft")) x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) x += 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) y += 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) y -= 1;

    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  get isMoving() {
    return this.keys.size > 0 || this.dragging;
  }

  private first() {
    if (this.firstInput) return;
    this.firstInput = true;
    this.callbacks.onFirstInput();
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.dragging = true;
    this.pointerType = event.pointerType;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.dragDistance = 0;
    this.canvas.setPointerCapture(event.pointerId);
    this.callbacks.onManualInput();
    this.callbacks.onHover(event.clientX, event.clientY);
    this.first();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.dragging) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.dragDistance += Math.hypot(dx, dy);

      if (dx !== 0 || dy !== 0) {
        this.callbacks.onDrag(dx, dy);
        this.first();
      }
      return;
    }

    this.callbacks.onHover(event.clientX, event.clientY);
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }

    const tapSlop = this.pointerType === "touch" ? 14 : 6;
    if (this.dragDistance < tapSlop) {
      this.callbacks.onClick(event.clientX, event.clientY);
    }
  };

  private onPointerCancel = (event: PointerEvent) => {
    this.dragging = false;

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private onPointerLeave = () => {
    this.callbacks.onHover(Number.NaN, Number.NaN);
  };

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.callbacks.onManualInput();
    this.callbacks.onWheel(event.deltaX, event.deltaY);
    this.first();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;

    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        document.querySelector("dialog[open]"))
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      return;
    }

    event.preventDefault();
    this.callbacks.onManualInput();
    this.keys.add(key);
    this.first();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
