import * as THREE from "three";

// TO Who Writes Code Here
// Better try receiving light, which implemented in lights.js
// As for now, the shining effect is only a simple product with view dir
// Now, the effects not fit the lighting effect of other models verywell(if you see the rendered result, you may find a little weird)

const textureCache = {};

export function createGlitterMaterial(options = {}) {
  const color = options.color || new THREE.Color(0xffffff);
  const size = options.size || 128;
  const cacheKey = size;

  let snowTex = textureCache[cacheKey];
  if (!snowTex) {
    // Procedurally draw a snowflake into a canvas and use it as an alpha sprite texture
    snowTex = createSnowflakeTexture(size);
    snowTex.colorSpace = THREE.SRGBColorSpace;
    snowTex.wrapS = THREE.ClampToEdgeWrapping;
    snowTex.wrapT = THREE.ClampToEdgeWrapping;
    textureCache[cacheKey] = snowTex;
  }

  return new THREE.MeshBasicMaterial({
    color: color,
    map: snowTex,
    transparent: true,
    alphaTest: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function createSnowflakeTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Clear with transparent background
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;

  // Soft core glow
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
  core.addColorStop(0.0, "rgba(255,255,255,1.0)");
  core.addColorStop(0.35, "rgba(255,255,255,0.95)");
  core.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Draw a 6-arm snowflake with small branches
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const mainW = Math.max(1.2, size * 0.035);
  const branchW = Math.max(1.0, size * 0.022);

  for (let k = 0; k < 6; k++) {
    ctx.save();
    ctx.rotate((k * Math.PI) / 3);

    // Main arm
    ctx.lineWidth = mainW;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -R);
    ctx.stroke();

    // Branches (two levels)
    ctx.lineWidth = branchW;
    const b1 = R * 0.55;
    const b2 = R * 0.78;
    const s1 = R * 0.22;
    const s2 = R * 0.18;

    // Level 1
    ctx.beginPath();
    ctx.moveTo(0, -b1);
    ctx.lineTo(-s1, -b1 - s1 * 0.65);
    ctx.moveTo(0, -b1);
    ctx.lineTo(s1, -b1 - s1 * 0.65);
    ctx.stroke();

    // Level 2
    ctx.beginPath();
    ctx.moveTo(0, -b2);
    ctx.lineTo(-s2, -b2 - s2 * 0.65);
    ctx.moveTo(0, -b2);
    ctx.lineTo(s2, -b2 - s2 * 0.65);
    ctx.stroke();

    // Tiny end fork
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.lineTo(-R * 0.12, -R + R * 0.14);
    ctx.moveTo(0, -R);
    ctx.lineTo(R * 0.12, -R + R * 0.14);
    ctx.stroke();

    ctx.restore();
  }

  // Center dot
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1.0, size * 0.03), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
