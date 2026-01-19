import * as THREE from 'three';

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

  const material = new THREE.MeshBasicMaterial({
    color: color,
    map: snowTex,
    transparent: true,
    alphaTest: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Inject logic to mix colors per instance
  // The color logic here is from Kota's code, which is difficult to merge.
  // For Kota's original work, check:
  // https://github.com/takko9ei/test-xmas-globe/tree/archive/earl271-role-c-snow
  // or
  // https://github.com/Earl271/test-xmas-globe
  material.onBeforeCompile = (shader) => {
    // 1. Vertex Shader: Define varying and random function
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vInstanceMixedColor;
      
      float getGlitterRandom(float seed) {
          return fract(sin(seed) * 43758.5453123);
      }
      `,
    );

    // 2. Vertex Shader: Calculate mixed color using gl_InstanceID
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Logic from alternatives: Light Blue (219, 238, 255) and Silver (0xffffff)
      vec3 colBlue = vec3(0.859, 0.933, 1.0);
      vec3 colSilver = vec3(1.0, 1.0, 1.0);
      
      // Use instance ID as seed for static random color per particle
      float mixRatio = getGlitterRandom(float(gl_InstanceID));
      vInstanceMixedColor = mix(colSilver, colBlue, mixRatio);
      `,
    );

    // 3. Fragment Shader: Receive varying
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vInstanceMixedColor;
      `,
    );

    // 4. Fragment Shader: Apply color to diffuse
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      diffuseColor.rgb *= vInstanceMixedColor;
      `,
    );
  };

  return material;
}

function createSnowflakeTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Clear with transparent background
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;

  // Soft core glow
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
  core.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  core.addColorStop(0.35, 'rgba(255,255,255,0.95)');
  core.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Draw a 6-arm snowflake with small branches
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255,255,255,0.98)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1.0, size * 0.03), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
