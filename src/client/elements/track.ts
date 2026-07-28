import { BoundElement } from "./bound-element";

// Must match the SSR markup in Track.astro.
const RADIAL_RADIUS = 42;
const RADIAL_CIRCUMFERENCE = 2 * Math.PI * RADIAL_RADIUS;

export class FastPixTrackElement extends BoundElement {
  protected override update(): void {
    if (!this.host) return;
    const pct = Math.min(100, Math.max(0, Math.round(this.host.getState().progress)));

    const label = this.querySelector<HTMLElement>(".fastpix-track-label");
    if (label) label.textContent = `${pct}%`;

    if (this.getAttribute("variant") === "radial") {
      const fill = this.querySelector<SVGCircleElement>(".fastpix-radial-fill");
      fill?.style.setProperty("stroke-dashoffset", String(RADIAL_CIRCUMFERENCE * (1 - pct / 100)));
    }
  }
}
