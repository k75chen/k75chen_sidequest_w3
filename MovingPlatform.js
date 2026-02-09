/*
MovingPlatform.js

Copy of Platform with vertical movement support.
*/

class MovingPlatform {
  constructor({
    x,
    y,
    w,
    h,
    startY = y,
    endY = y,
    speed = 1,
    direction,
    travelTime = 3,
  }) {
    // Position is the top-left corner.
    this.x = x;
    this.y = y;

    // Size (width/height).
    this.w = w;
    this.h = h;

    // Movement bounds and state.
    this.startY = startY;
    this.endY = endY;

    // Duration in seconds to travel from startY -> endY (default 3s).
    this.travelTime = travelTime;

    // Compute travel distance and speed in pixels per millisecond.
    const distance = Math.abs(this.endY - this.startY);
    this._speedPerMs = distance > 0 ? distance / (this.travelTime * 1000) : 0;

    // Direction: if provided use it, otherwise choose sign so platform moves toward endY first.
    if (typeof direction !== "undefined") this.direction = direction;
    else this.direction = this.endY >= this.startY ? 1 : -1;

    // Keep a legacy numeric 'speed' property for compatibility (not used for movement now).
    this.speed = speed;
  }

  // Move smoothly using frame delta time (p5's global deltaTime in ms).
  update() {
    if (this._speedPerMs === 0) return;

    // deltaTime is provided by p5 (ms since last frame)
    const dt = typeof deltaTime !== "undefined" ? deltaTime : 16.67; // fallback ~60fps
    this.y += this._speedPerMs * dt * this.direction;

    // Determine bounds correctly regardless of start/end ordering
    const minY = Math.min(this.startY, this.endY);
    const maxY = Math.max(this.startY, this.endY);

    if (this.y >= maxY) {
      this.y = maxY;
      this.direction *= -1;
    } else if (this.y <= minY) {
      this.y = minY;
      this.direction *= -1;
    }
  }

  draw(fillColor) {
    fill(fillColor);
    rect(this.x, this.y, this.w, this.h);
  }
}
