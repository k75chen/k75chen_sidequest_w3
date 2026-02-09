/*
Week 4 — Example 5: Example 5: Blob Platformer (JSON + Classes)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This file orchestrates everything:
- load JSON in preload()
- create WorldLevel from JSON
- create BlobPlayer
- update + draw each frame
- handle input events (jump, optional next level)

This matches the structure of the original blob sketch from Week 2 but moves
details into classes.
*/

let data; // raw JSON data
let levelIndex = 0;

let world; // WorldLevel instance (current level)
let player; // BlobPlayer instance

function preload() {
  // Load the level data from disk before setup runs.
  data = loadJSON("levels.json");
}

function setup() {
  // Create the player once (it will be respawned per level).
  player = new BlobPlayer();

  // Load the first level.
  loadLevel(1);

  // Simple shared style setup.
  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  // 1) Draw the world (background + platforms)
  world.drawWorld();

  // 2) Update moving platforms (if any) then the player (physics + collisions)
  const platformYBefore = {};
  for (const p of world.platforms) {
    platformYBefore[world.platforms.indexOf(p)] = p.y;
  }

  for (const p of world.platforms) {
    if (p.update) p.update();
  }

  // Carry blob along with moving platforms
  for (let i = 0; i < world.platforms.length; i++) {
    const p = world.platforms[i];
    if (p.update && typeof platformYBefore[i] !== "undefined") {
      const yDelta = p.y - platformYBefore[i];
      // Check if blob is on this platform (approximately)
      const playerBox = {
        x: player.x - player.r,
        y: player.y - player.r,
        w: player.r * 2,
        h: player.r * 2,
      };
      // If player overlaps platform and is roughly on top, move with it
      if (
        overlapAABB(playerBox, p) &&
        player.y + player.r >= p.y &&
        player.y - player.r <= p.y + p.h + 5
      ) {
        player.y += yDelta;
      }
    }
  }

  player.update(world.platforms);

  // 2a) Death: fell off bottom -> restart current level (5px grace buffer)
  if (player.y - player.r > height + 5) {
    loadLevel(levelIndex);
    return;
  }

  // 2b) Goal: if player reaches goal, advance to next level
  if (world.goal) {
    const playerBox = {
      x: player.x - player.r,
      y: player.y - player.r,
      w: player.r * 2,
      h: player.r * 2,
    };
    if (overlapAABB(playerBox, world.goal)) {
      const next = (levelIndex + 1) % data.levels.length;
      loadLevel(next);
      return;
    }
  }

  // 3) Draw player on top of world
  player.draw(world.theme.blob);

  // 3) HUD
  fill(0);
  text(world.name, 10, 18);
  text(
    "Move: A/D or ←/→ • Jump: Space/W/↑ • Next: N • Goal: RED BOX -->",
    10,
    36,
  );
}

function keyPressed() {
  // Jump keys
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    player.jump();
  }

  // Optional: cycle levels with N (as with the earlier examples)
  if (key === "n" || key === "N") {
    const next = (levelIndex + 1) % data.levels.length;
    loadLevel(next);
  }
}

/*
Load a level by index:
- create a WorldLevel instance from JSON
- resize canvas based on inferred geometry
- spawn player using level start + physics
*/
function loadLevel(i) {
  levelIndex = i;

  // Create the world object from the JSON level object.
  world = new WorldLevel(data.levels[levelIndex]);

  // Fit canvas to world geometry (or defaults if needed).
  const W = world.inferWidth(640);
  const H = world.inferHeight(360);
  resizeCanvas(W, H);

  // Position the level goal in the top-right of the canvas.
  world.setGoal(W, H);

  // Apply level settings + respawn.
  player.spawnFromLevel(world);
}
