/*
WorldLevel.js (Example 5)

WorldLevel wraps ONE level object from levels.json and provides:
- Theme colours (background/platform/blob)
- Physics parameters that influence the player (gravity, jump velocity)
- Spawn position for the player (start)
- An array of Platform instances
- A couple of helpers to size the canvas to fit the geometry

This is directly inspired by your original blob sketch’s responsibilities: 
- parse JSON
- map platforms array
- apply theme + physics
- infer canvas size

Expected JSON shape for each level (from your provided file): 
{
  "name": "Intro Steps",
  "gravity": 0.65,
  "jumpV": -11.0,
  "theme": { "bg":"...", "platform":"...", "blob":"..." },
  "start": { "x":80, "y":220, "r":26 },
  "platforms": [ {x,y,w,h}, ... ]
}
*/

class WorldLevel {
  constructor(levelJson) {
    // A readable label for HUD.
    this.name = levelJson.name || "Level";

    // Theme defaults + override with JSON.
    this.theme = Object.assign(
      { bg: "#F0F0F0", platform: "#C8C8C8", blob: "#1478FF" },
      levelJson.theme || {},
    );

    // Physics knobs (the blob player will read these).
    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV = levelJson.jumpV ?? -11.0;

    // Player spawn data.
    // Use optional chaining so levels can omit fields safely.
    this.start = {
      x: levelJson.start?.x ?? 80,
      y: levelJson.start?.y ?? 180,
      r: levelJson.start?.r ?? 26,
    };

    // Convert raw platform objects into Platform instances or generate from a pattern.
    if (levelJson.pattern && levelJson.pattern.type === "grid") {
      const p = levelJson.pattern;
      this.platforms = this.generateGrid(
        p.rows,
        p.cols,
        p.startX,
        p.startY,
        p.platformWidth,
        p.platformHeight,
        p.spacingX,
        p.spacingY,
        p.layout,
      );
    } else {
      this.platforms = (levelJson.platforms || []).map((p) => new Platform(p));
    }

    // Create any moving platforms defined in the level and append them
    if (levelJson.movingPlatforms && Array.isArray(levelJson.movingPlatforms)) {
      for (const m of levelJson.movingPlatforms) {
        const mp = new MovingPlatform({
          x: m.x,
          y: m.startY ?? m.y ?? 0,
          w: m.w,
          h: m.h,
          startY: m.startY ?? m.y ?? 0,
          endY: m.endY ?? m.y ?? 0,
          speed: m.speed ?? 1,
          direction: m.direction ?? 1,
        });
        this.platforms.push(mp);
      }
    }
  }

  /*
  If you want the canvas to fit the world, you can infer width/height by
  finding the maximum x+w and y+h across all platforms.
  */
  inferWidth(defaultW = 640) {
    if (!this.platforms.length) return defaultW;
    return max(this.platforms.map((p) => p.x + p.w));
  }

  inferHeight(defaultH = 360) {
    if (!this.platforms.length) return defaultH;
    return max(this.platforms.map((p) => p.y + p.h));
  }

  /*
  Draw only the world (background + platforms).
  The player draws itself separately, after the world is drawn.
  */
  drawWorld() {
    background(color(this.theme.bg));
    for (const p of this.platforms) {
      p.draw(color(this.theme.platform));
    }
    // Draw goal if present
    if (this.goal) {
      push();
      // Goal colour contrasts with platforms
      fill(255, 0, 0);
      noStroke();
      rect(this.goal.x, this.goal.y, this.goal.w, this.goal.h, 6);
      pop();
    }
  }

  /**
   * Place a rectangular goal in the top-right of the level.
   * Call after canvas is resized so width/height are known.
   */
  setGoal(canvasW, canvasH, opts = {}) {
    const gw = opts.w ?? 36;
    const gh = opts.h ?? 36;
    const margin = opts.margin ?? 12;
    this.goal = {
      x: canvasW - gw - margin,
      y: margin,
      w: gw,
      h: gh,
    };
  }

  /**
   * Generate a grid of platforms and return an array of Platform instances.
   * Outer loop iterates rows, inner loop iterates columns.
   */
  generateGrid(
    rows,
    cols,
    startX,
    startY,
    platformWidth,
    platformHeight,
    spacingX = 0,
    spacingY = 0,
    layout,
  ) {
    const platforms = [];
    // If a layout (2D array) is provided, use it to determine platform locations.
    if (layout && Array.isArray(layout)) {
      for (let r = 0; r < layout.length; r++) {
        const row = layout[r] || [];
        for (let c = 0; c < row.length; c++) {
          if (row[c] === 1) {
            const x = startX + c * (platformWidth + spacingX);
            const y = startY + r * (platformHeight + spacingY);
            platforms.push(
              new Platform({ x: x, y: y, w: platformWidth, h: platformHeight }),
            );
          }
        }
      }
    } else {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (platformWidth + spacingX);
          const y = startY + r * (platformHeight + spacingY);
          platforms.push(
            new Platform({ x: x, y: y, w: platformWidth, h: platformHeight }),
          );
        }
      }
    }
    return platforms;
  }
}
