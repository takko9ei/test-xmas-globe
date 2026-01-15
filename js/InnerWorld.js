import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class InnerWorld extends BaseObject {
  tree = null;

  // Role B visuals
  _leafMat = null;        // shared ShaderMaterial
  _noiseTex = null;       // DataTexture
  _deco = null;           // decoration group attached to tree
  _swing = [];            // swingable objects

  // timing
  _clock = null;
  _rafId = null;
  _rafRunning = false;

  init() {
    console.log("InnerWorld: loading...");


    try {

    // reset
    this.tree = null;
    this._leafMat = null;
    this._noiseTex = null;
    this._deco = null;
    this._swing = [];

    // time driver (works even if external loop doesn't call update)
    this._clock = new THREE.Clock();
    if (this._rafId != null) cancelAnimationFrame(this._rafId);
    this._rafRunning = true;
    const tick = () => {
      if (!this._rafRunning || !this._clock) return;
      this.update(this._clock.getElapsedTime());
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);

    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();

    // --- tiny procedural noise texture for micro-detail (no new assets) ---
    const makeNoiseTex = (size = 128) => {
      const data = new Uint8Array(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        const v = 140 + Math.floor((Math.random() - 0.5) * 80);
        const o = i * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
      }
      const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(6, 6);
      t.needsUpdate = true;
      return t;
    };

    // --- stylized foliage shader: vertical gradient + rim + noise + wind sway ---
    const makeLeafMat = (mapTex, noiseTex) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: mapTex },
          uNoise: { value: noiseTex },
          uTime: { value: 0.0 },
          uTop: { value: new THREE.Color(0x7cffb2) },
          uBot: { value: new THREE.Color(0x052010) },
          uPower: { value: 2.4 },
          uEdge: { value: new THREE.Color(0x86ffb6) },
          uEdgeI: { value: 0.85 },
          uNoiseScale: { value: 2.4 },
          uNoiseStr: { value: 0.035 },
          uWindStr: { value: 0.9 },
          uWindFreq: { value: 0.8 },
          uMinY: { value: -0.2 },
          uMaxY: { value: 0.8 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uWindStr;
          uniform float uWindFreq;
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vV;
          varying vec3 vWPos;
          void main(){
            vUv = uv;
            vec3 pos = position;
            float h = clamp((pos.y + 0.2) / 1.2, 0.0, 1.0);
            h = h*h;
            float w1 = sin(uTime*uWindFreq + pos.x*2.0) * 0.060;
            float w2 = sin(uTime*uWindFreq*2.5 + pos.z*5.0) * 0.028;
            float w3 = sin(uTime*uWindFreq*4.0 + pos.x*3.0 + pos.z*4.0) * 0.014;
            pos.x += (w1+w2+w3) * h * uWindStr;
            pos.z += (w1*0.7+w2*1.2+w3*0.8) * h * uWindStr;
            pos.y += w2 * 0.3 * h * uWindStr;
            vec4 wpos = modelMatrix * vec4(pos, 1.0);
            vWPos = wpos.xyz;
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - wpos.xyz);
            gl_Position = projectionMatrix * viewMatrix * wpos;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform sampler2D uNoise;
          uniform vec3 uTop;
          uniform vec3 uBot;
          uniform float uPower;
          uniform vec3 uEdge;
          uniform float uEdgeI;
          uniform float uNoiseScale;
          uniform float uNoiseStr;
          uniform float uTime;
          uniform float uMinY;
          uniform float uMaxY;
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vV;
          varying vec3 vWPos;
          void main(){
            vec3 N = normalize(vN);
            if (!gl_FrontFacing) N = -N;
            vec3 V = normalize(vV);
            float ndv = clamp(dot(N, V), 0.0, 1.0);
            float rim1 = pow(1.0 - ndv, uPower);
            float rim2 = pow(1.0 - ndv, 4.0);
            float rim3 = pow(1.0 - ndv, 8.0);

            vec3 texCol = texture2D(uMap, vUv).rgb;
            // foliage mask: green-dominant pixels
            float gDom = texCol.g - max(texCol.r, texCol.b);
            float foliage = smoothstep(0.03, 0.14, gDom);

            float denom = max(1e-4, (uMaxY - uMinY));
            float h01 = clamp((vWPos.y - uMinY) / denom, 0.0, 1.0);
            h01 = pow(h01, 0.55);
            vec3 grad = mix(uBot, uTop, h01);

            vec2 nUv = vWPos.xz * uNoiseScale;
            float n1 = texture2D(uNoise, nUv).r;
            float n2 = texture2D(uNoise, nUv*3.1 + vec2(0.17,0.53)).r;
            float n = mix(n1, n2, 0.35);
            float mod = (smoothstep(0.20,0.80, clamp((n-0.5)*0.5+0.5,0.0,1.0)) * 2.0 - 1.0);

            vec3 base = texCol;
            vec3 foliageCol = mix(texCol, grad, 0.55);
            foliageCol *= mix(0.55, 1.45, h01);
            base = mix(base, foliageCol, foliage);
            base *= (1.0 + mod * uNoiseStr * foliage);

            float breathe = sin(uTime * 1.5) * 0.15 + 0.85;
            vec3 edge1 = uEdge * rim1 * uEdgeI * 0.60 * breathe;
            vec3 edge2 = vec3(0.15,0.31,0.16) * rim2 * 0.40;
            vec3 edge3 = vec3(1.0,1.0,0.90) * rim3 * 0.85;

            vec3 col = min(base + edge1 + edge2 + edge3, vec3(1.0));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      });

    // Texture
    const treeTex = texLoader.load("./assets/textures/xmas_tree.jpeg");
    treeTex.flipY = false;
    // three.js version compatibility: newer uses colorSpace, older uses encoding
    if ("colorSpace" in treeTex && THREE.SRGBColorSpace) {
      treeTex.colorSpace = THREE.SRGBColorSpace;
    } else {
      treeTex.encoding = THREE.sRGBEncoding;
    }

    this._noiseTex = makeNoiseTex(128);
    this._leafMat = makeLeafMat(treeTex, this._noiseTex);

    // Fallback material: used if shader material isn't ready or any decoration step fails
    const fallbackTreeMat = new THREE.MeshStandardMaterial({ color: 0x2b6a3a, roughness: 0.9, metalness: 0.0 });

    const installPerMeshHook = (root) => {
      if (!root) return;
      root.traverse((o) => {
        if (!o || !o.isMesh) return;
        if (!o.userData) o.userData = {};
        if (o.userData.__iwHook) return;
        o.userData.__iwHook = true;
        o.onBeforeRender = () => {
          if (!this._clock) return;
          this.update(this._clock.getElapsedTime());
        };
      });
    };

    // 1) Load Tree (try edited tree first, then fallback)
    const loadTree = (url) => {
      loader.load(
        url,
        (gltf) => {
          try {
            const tree = gltf.scene;
            tree.position.set(0, -0.06, 0);

            // Remove any baked-in ornaments/balls from the GLB so our scene stays consistent.
            const removeBuiltinOrnaments = () => {
              const toRemove = [];
              tree.traverse((obj) => {
                if (!obj || !obj.isMesh) return;
                const name = (typeof obj.name === "string") ? obj.name.toLowerCase() : "";
                const nameHit = /ball|bauble|ornament|orn|sphere|deco|decoration/.test(name);

                // Size heuristic: small-ish meshes are likely ornaments (tree itself is much larger)
                let smallHit = false;
                if (obj.geometry) {
                  if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                  if (obj.geometry.boundingBox) {
                    const bb = obj.geometry.boundingBox;
                    const sx = bb.max.x - bb.min.x;
                    const sy = bb.max.y - bb.min.y;
                    const sz = bb.max.z - bb.min.z;
                    const maxDim = Math.max(sx, sy, sz);
                    smallHit = maxDim > 0.0 && maxDim < 0.10;
                  }
                }

                if (nameHit && smallHit) toRemove.push(obj);
              });

              for (const m of toRemove) {
                if (m.parent) m.parent.remove(m);
                if (m.geometry) m.geometry.dispose();
                if (m.material) {
                  if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
                  else m.material.dispose();
                }
              }
              if (toRemove.length) console.log(`InnerWorld: removed ${toRemove.length} baked-in ornament mesh(es) from GLB.`);
            };
            removeBuiltinOrnaments();

            // Ensure we have a leaf shader material; if not, recreate it quickly.
            if (!this._leafMat) {
              console.warn("InnerWorld: _leafMat was null at tree load time. Recreating leaf shader material...");
              this._leafMat = makeLeafMat(treeTex, this._noiseTex);
            }

            // Apply shader only to foliage-ish meshes (fallback: apply to all if single mesh)
            let meshCount = 0;
            tree.traverse((o) => { if (o && o.isMesh) meshCount++; });
            const forceAll = meshCount === 1;

            tree.traverse((child) => {
              if (!child.isMesh) return;

              // Some exports can have null materials; always ensure there's a material.
              if (!child.material) child.material = fallbackTreeMat;

              const n = (typeof child.name === "string") ? child.name.toLowerCase() : "";
              let exclude = (
                n.includes("trunk") || n.includes("bark") || n.includes("stem") ||
                n.includes("star") || n.includes("orn") || n.includes("ball") ||
                n.includes("sock") || n.includes("ribbon") || n.includes("gift")
              );
              if (forceAll) exclude = false;

              if (!exclude && this._leafMat) {
                const leafMat = this._leafMat;
                child.material = leafMat;
                leafMat.uniforms.uMap.value = treeTex;
                leafMat.uniforms.uNoise.value = this._noiseTex;
                leafMat.needsUpdate = true;
              } else {
                // Keep PBR material, but apply our texture + micro detail.
                const mat = child.material;
                mat.map = treeTex;
                mat.roughnessMap = this._noiseTex;
                mat.normalMap = this._noiseTex;
                mat.normalScale = new THREE.Vector2(0.22, 0.22);
                mat.roughness = 0.85;
                mat.metalness = 0.0;
                mat.envMapIntensity = 0.55;
                mat.needsUpdate = true;
              }

              child.castShadow = true;
              child.receiveShadow = true;
            });

            // set gradient range from bounds (guard if shader is missing)
            tree.updateWorldMatrix(true, true);
            const wb = new THREE.Box3().setFromObject(tree);
            const minY = wb.min.y;
            const maxY = wb.max.y;
            const range = Math.max(1e-4, maxY - minY);
            if (this._leafMat && this._leafMat.uniforms) {
              this._leafMat.uniforms.uMinY.value = minY + range * 0.10;
              this._leafMat.uniforms.uMaxY.value = minY + range * 0.92;
            }

            this.tree = tree;
            installPerMeshHook(tree);

            // Decorations (Role B): star + ribbon + ornaments + snowman + cabin
            try {
              this._buildDecorations(tree, wb);
            } catch (decoErr) {
              console.error("InnerWorld: decorations crashed; showing tree without decorations:", decoErr);
            }

            this.add(tree);
            console.log("InnerWorld: tree loaded from", url);
          } catch (err) {
            console.error("InnerWorld: tree loaded but processing crashed. Showing fallback tree:", err);
            const tree = gltf.scene;
            tree.position.set(0, -0.06, 0);
            tree.traverse((c) => {
              if (c && c.isMesh) {
                c.material = fallbackTreeMat;
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            this.tree = tree;
            this.add(tree);
          }
        },
        undefined,
        (e) => {
          console.error("InnerWorld: tree load failed (network error OR exception in success handler):", url, e);
        }
      );
    };

    // Load the actual tree model in this repo
    loadTree("./assets/models/tree-edited.glb");

    // 2) Load Ground
    loader.load(
      "./assets/models/ground.glb",
      (gltf) => {
        const ground = gltf.scene;
        // Do NOT remove the debug placeholder here; only remove when tree loads.
        installPerMeshHook(ground);
        this.add(ground);
        console.log("InnerWorld: ground loaded.");
      },
      undefined,
      (e) => console.error("An error occurred loading the ground model", e)
    );
    } catch (err) {
      console.error("InnerWorld:init crashed (this would make the whole inner world disappear):", err);
    }
  }

  _buildDecorations(tree, treeWorldBox) {
    if (this._deco) tree.remove(this._deco);
    this._deco = new THREE.Group();
    this._deco.renderOrder = 10;
    this._swing = [];

    const box = new THREE.Box3().setFromObject(tree);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const treeH = Math.max(0.001, size.y);
    const treeR = Math.max(size.x, size.z) * 0.55;

    // Shared placement registry so decorations don't overlap / cluster
    const placed = [];
    const okWithSpacing = (p, minD) => {
      const d2 = minD * minD;
      for (let i = 0; i < placed.length; i++) {
        const q = placed[i];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dz = p.z - q.z;
        if (dx * dx + dy * dy + dz * dz < d2) return false;
      }
      return true;
    };
    const remember = (p) => placed.push(p.clone());

    // Helper: mark swingable and cache base transform
    const markSwing = (obj, opts = {}) => {
      obj.userData.__swing = true;
      obj.userData.__amp = opts.amp ?? 1.0;
      obj.userData.__speed = opts.speed ?? 1.0;
      obj.userData.__seed = opts.seed ?? Math.random() * 1000;
    };

    // --- Big top star (extruded) ---
    const makeStarShape = (outerR, innerR) => {
      const shape = new THREE.Shape();
      const spikes = 5;
      let rot = -Math.PI / 2;
      const step = Math.PI / spikes;
      shape.moveTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
      for (let i = 0; i < spikes; i++) {
        rot += step;
        shape.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR);
        rot += step;
        shape.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
      }
      shape.closePath();
      return shape;
    };

    const starGeo = new THREE.ExtrudeGeometry(makeStarShape(0.060, 0.028), {
      depth: 0.018,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      bevelSegments: 1,
    });

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd26a,
      emissive: 0xffc24a,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.2,
    });

    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, center.y + treeH / 2 - 0.085, 0);
    star.rotation.x = Math.PI / 2;
    star.castShadow = true;
    markSwing(star, { amp: 1.6, speed: 1.0 });
    this._deco.add(star);

    // --- Ribbon (tube around the tree) ---
    const ribbonTurns = 3.2;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const y = (center.y - treeH / 2) + 0.10 + t * (treeH * 0.82);
      const r = (1.0 - t) * treeR * 0.95 + 0.02;
      const a = t * Math.PI * 2 * ribbonTurns;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 240, 0.012, 10, false),
      new THREE.MeshStandardMaterial({ color: 0xd1152a, roughness: 0.55, metalness: 0.05 })
    );
    ribbon.castShadow = true;
    this._deco.add(ribbon);

    // --- Surface sampler: raycast from outside toward tree center so ornaments stick to the surface ---
    const rayMeshes = [];
    tree.traverse((o) => { if (o && o.isMesh) rayMeshes.push(o); });
    const raycaster = new THREE.Raycaster();
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();
    const _m3 = new THREE.Matrix3();
    const _m4 = new THREE.Matrix4();

    // angle: around Y, yLocal: in tree local coordinates; offset pushes slightly outward from the surface
    const sampleTreeSurfaceLocal = (angle, yLocal, offset = 0.02) => {
      const startR = Math.max(treeR * 2.8, 1.2);
      const oxL = Math.cos(angle) * startR;
      const ozL = Math.sin(angle) * startR;

      _vA.set(oxL, yLocal, ozL);              // origin (local)
      _vB.set(0, yLocal, 0).sub(_vA);         // dir (local)
      if (_vB.lengthSq() < 1e-8) _vB.set(-1, 0, 0);
      _vB.normalize();

      // Convert to world space for raycaster
      const originW = _vC.copy(_vA).applyMatrix4(tree.matrixWorld);
      const dirW = _vB.clone().transformDirection(tree.matrixWorld);
      raycaster.set(originW, dirW);
      raycaster.far = startR * 2.5;

      const hits = raycaster.intersectObjects(rayMeshes, true);
      if (!hits || hits.length === 0) {
        // Fallback: conservative radius shell
        const rFallback = Math.max(treeR * 1.08, 0.35);
        const x = Math.cos(angle) * rFallback;
        const z = Math.sin(angle) * rFallback;
        const posL = new THREE.Vector3(x, yLocal, z);
        const nL = new THREE.Vector3(x, 0, z).normalize();
        posL.addScaledVector(nL, offset);
        return { posL, nL };
      }

      const hit = hits[0];

      // Compute outward normal in world
      const nW = new THREE.Vector3(0, 1, 0);
      if (hit.face && hit.object) {
        _m3.getNormalMatrix(hit.object.matrixWorld);
        nW.copy(hit.face.normal).applyMatrix3(_m3).normalize();
      }
      // Ensure normal points outward (dirW points inward)
      if (nW.dot(dirW) > 0.0) nW.multiplyScalar(-1);

      const posW = hit.point.clone().addScaledVector(nW, offset);
      const posL = tree.worldToLocal(posW.clone());

      _m4.copy(tree.matrixWorld).invert();
      const nL = nW.clone().transformDirection(_m4).normalize();

      return { posL, nL };
    };


    // --- Mini stars (stick to surface like ornaments) ---
    const miniStarMat = new THREE.MeshStandardMaterial({
      color: 0xffe08a,
      emissive: 0xffc24a,
      emissiveIntensity: 0.40,
      roughness: 0.40,
      metalness: 0.18,
    });

    const miniStarGeo = new THREE.ExtrudeGeometry(makeStarShape(0.028, 0.013), {
      depth: 0.010,
      bevelEnabled: true,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      bevelSegments: 1,
    });

    const miniStarCount = 18;
    const golden = 2.399963229728653; // golden angle
    const minStarSep = 0.11;

    for (let i = 0; i < miniStarCount; i++) {
      const s = new THREE.Mesh(miniStarGeo, miniStarMat);

      // Stratified height so we fill the tree evenly (middle-to-upper band)
      const u = (i + 0.5) / miniStarCount;
      const t = 0.26 + u * 0.56; // 0.26..0.82
      const y = (center.y - treeH / 2) + 0.12 + t * (treeH * 0.75);

      // Golden-angle around the tree + small jitter
      const a0 = (i * golden) % (Math.PI * 2);

      let placedOk = false;
      let hit = null;
      for (let attempt = 0; attempt < 14 && !placedOk; attempt++) {
        const a = a0 + (Math.random() - 0.5) * 0.45;
        hit = sampleTreeSurfaceLocal(a, y, 0.004);
        if (okWithSpacing(hit.posL, minStarSep)) placedOk = true;
      }
      if (!placedOk) {
        hit = sampleTreeSurfaceLocal(a0, y, 0.004);
      }

      s.position.copy(hit.posL);
      remember(hit.posL);

      // Face outward using the sampled normal
      s.lookAt(s.position.clone().add(hit.nL));
      s.rotateY(Math.PI);
      s.rotateX((Math.random() - 0.5) * 0.22);
      s.rotateZ((Math.random() - 0.5) * 0.22);

      s.castShadow = true;
      s.receiveShadow = true;
      markSwing(s, { amp: 1.4, speed: 1.1 });
      this._deco.add(s);
    }

    // --- Stockings (hung on the tree, facing outward; no hanger/ring) ---
    const sockGroup = new THREE.Group();

    const cuffMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.9, metalness: 0.0 });

    const makeSock = (baseColor = 0xc10f1f, accentColor = 0xffffff) => {
      const g = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.72, metalness: 0.0 });
      const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8, metalness: 0.0 });

      // Simple stylized sock: body + foot + cuff + stripe (no hanger)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.078, 0.028), baseMat);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.030, 0.028), baseMat);
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.020, 0.032), cuffMat);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.012, 0.030), accentMat);

      body.position.set(0, -0.038, 0);
      foot.position.set(0.018, -0.082, 0);
      cuff.position.set(0, 0.0, 0);
      stripe.position.set(0, -0.025, 0);

      g.add(body, foot, cuff, stripe);
      g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

      // Make the whole sock swing slightly like other ornaments
      markSwing(g, { amp: 1.6, speed: 0.9 });
      return g;
    };

    // Place socks around the tree, lower-mid band, with even angles and minimum spacing.
    const sockCount = 8;
    const minSockSep = 0.16;

    for (let i = 0; i < sockCount; i++) {
      const sock = makeSock(0xc10f1f, 0xffffff);

      // Fill a lower-mid band to balance the stars above
      const u = (i + 0.5) / sockCount;
      const t = 0.42 + u * 0.28; // 0.42..0.70
      const y = (center.y - treeH / 2) + 0.12 + t * (treeH * 0.75);

      // Even angles with jitter
      const a0 = (i / sockCount) * Math.PI * 2;

      let hit = null;
      let placedOk = false;
      for (let attempt = 0; attempt < 16 && !placedOk; attempt++) {
        const a = a0 + (Math.random() - 0.5) * 0.55;
        // Slightly embedded so it looks attached to branches
        hit = sampleTreeSurfaceLocal(a, y, -0.010);
        if (okWithSpacing(hit.posL, minSockSep)) placedOk = true;
      }
      if (!placedOk) {
        hit = sampleTreeSurfaceLocal(a0, y, -0.010);
      }

      sock.position.copy(hit.posL);
      remember(hit.posL);

      // Face outward using the surface normal
      sock.lookAt(sock.position.clone().add(hit.nL));
      sock.rotateY(Math.PI);

      sock.rotation.z += 0.12 + (Math.random() - 0.5) * 0.05;
      sock.rotation.x += -0.06 + (Math.random() - 0.5) * 0.05;

      sockGroup.add(sock);
    }

    this._deco.add(sockGroup);

    // --- Simple snowman (beside tree) ---
    const snowman = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.95, metalness: 0.0 });
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.75, metalness: 0.0 });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf07a1a, roughness: 0.65, metalness: 0.0 });
    const coneRed = new THREE.MeshStandardMaterial({ color: 0xd91616, roughness: 0.65, metalness: 0.02 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.060, 22, 16), snowMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.040, 22, 16), snowMat);
    body.position.set(0, 0.060, 0);
    head.position.set(0, 0.060 + 0.040 * 1.5, 0);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.075, 18), coneRed);
    cone.position.set(0, head.position.y + 0.040 * 1.05, 0);

    const eyeGeo = new THREE.SphereGeometry(0.006, 12, 10);
    const eyeL = new THREE.Mesh(eyeGeo, coalMat);
    const eyeR = new THREE.Mesh(eyeGeo, coalMat);
    eyeL.position.set(-0.012, head.position.y + 0.006, 0.034);
    eyeR.position.set(0.012, head.position.y + 0.006, 0.034);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.0065, 0.040, 18), carrotMat);
    nose.position.set(0, head.position.y - 0.004, 0.048);
    nose.rotation.x = Math.PI / 2;

    snowman.add(body, head, cone, eyeL, eyeR, nose);
    snowman.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

    // Scale to about half tree height
    const baseH = 0.20;
    const targetH = treeH * 0.50;
    const sSnow = THREE.MathUtils.clamp(targetH / baseH, 1.4, 2.8);
    snowman.scale.set(sSnow, sSnow, sSnow);

    // Place using world bounds (sit on snow surface)
    const ySnow = treeWorldBox.min.y + Math.min(0.03, treeH * 0.06);
    const treeW = new THREE.Vector3();
    tree.getWorldPosition(treeW);
    const placeR = Math.min(treeR * 1.85, 0.62);

    // Rotate placement 90° clockwise around the tree center (world Y axis)
    const ROT_CW_90 = -Math.PI / 2;
    const rotAroundTree = (x, z) => {
      const dx = x - treeW.x;
      const dz = z - treeW.z;
      const c = Math.cos(ROT_CW_90);
      const s = Math.sin(ROT_CW_90);
      return {
        x: treeW.x + (dx * c - dz * s),
        z: treeW.z + (dx * s + dz * c),
      };
    };

    // Original intent: snowman on +X side of tree; rotate that placement clockwise
    const snowXZ = rotAroundTree(treeW.x + placeR, treeW.z);
    snowman.position.set(snowXZ.x, ySnow + (0.060 * sSnow) - 0.28, snowXZ.z);
    // Front is modeled along +Z (nose points +Z), face the same direction as the viewer
    snowman.rotation.y = ROT_CW_90;
    this.add(snowman);

    // --- Tiny cabin (opposite side) ---
    const cabin = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.95, metalness: 0.0 });
    const roofM = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.90, metalness: 0.0 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffc46a, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0.0 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.98, metalness: 0.0 });

    const baseW = 0.12, baseH2 = 0.085, baseD = 0.11;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH2, baseD), wood);
    base.position.set(0, baseH2 * 0.5, 0);

    const roofH = baseH2 * 0.95;
    const roofR = Math.max(baseW, baseD) * 0.70;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 4), roofM);
    roof.position.set(0, baseH2 + roofH * 0.5, 0);
    roof.rotation.y = Math.PI / 4;

    const winGeo = new THREE.BoxGeometry(baseW * 0.17, baseH2 * 0.20, 0.009);
    const winL = new THREE.Mesh(winGeo, glass);
    const winR = new THREE.Mesh(winGeo, glass);
    winL.position.set(-baseW * 0.24, baseH2 * 0.62, baseD * 0.505);
    winR.position.set(baseW * 0.24, baseH2 * 0.62, baseD * 0.505);

    const chim = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.12, baseH2 * 0.55, baseD * 0.12), stone);
    chim.position.set(baseW * 0.30, baseH2 + roofH * 0.55, -baseD * 0.10);

    cabin.add(base, roof, winL, winR, chim);
    cabin.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

    const sCab = sSnow * 0.92;
    cabin.scale.set(sCab, sCab, sCab);
    // Original intent: cabin on -X side of tree; rotate that placement clockwise
    const cabXZ = rotAroundTree(treeW.x - placeR, treeW.z);
    cabin.position.set(cabXZ.x, ySnow - 0.055, cabXZ.z);
    // Keep its facing consistent with the rotated layout
    cabin.rotation.y = (Math.PI / 2) + ROT_CW_90;
    this.add(cabin);

    // Front is modeled along +Z (windows/door on +Z), face the same direction as the viewer
    cabin.rotation.y = ROT_CW_90;

    // collect swingables and cache base transforms
    this._deco.traverse((obj) => {
      if (!obj || !obj.userData || !obj.userData.__swing) return;
      obj.userData.__basePos = obj.position.clone();
      obj.userData.__baseRot = obj.rotation.clone();
      this._swing.push(obj);
    });
    tree.add(this._deco);
  }

  update(time) {
    let t = (typeof time === "number") ? time : 0;
    if (t > 1000) t *= 0.001;

    // shader time
    if (this._leafMat && this._leafMat.uniforms && this._leafMat.uniforms.uTime) {
      this._leafMat.uniforms.uTime.value = t;
    }

    // tiny tree sway (safe)
    if (this.tree) {
      this.tree.rotation.z = 0.035 * Math.sin(t * 0.9);
      this.tree.rotation.x = 0.012 * Math.sin(t * 0.6 + 1.0);
      this.tree.position.x = 0.004 * Math.sin(t * 0.4);
    }

    // decoration swing
    if (!this._swing || this._swing.length === 0) return;

    const wind = (0.85 + 0.55 * Math.sin(t * 0.22)) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.09 + 1.2)));

    for (const obj of this._swing) {
      if (!obj || !obj.userData || !obj.userData.__basePos || !obj.userData.__baseRot) continue;
      const seed = obj.userData.__seed ?? 0;
      const amp = obj.userData.__amp ?? 1.0;
      const spd = obj.userData.__speed ?? 1.0;

      const a = t * (0.9 * spd) + seed * 0.13;
      const b = t * (1.4 * spd) + seed * 0.21;
      const flutter = 0.20 * Math.sin(t * (3.5 * spd) + seed * 0.7) + 0.12 * Math.sin(t * (5.7 * spd) + seed * 1.3);
      const sway = (Math.sin(a) * 0.68 + Math.sin(b) * 0.32) * wind + flutter * (0.45 + 0.55 * wind);

      let rz = THREE.MathUtils.clamp((0.22 * amp) * sway, -0.35, 0.35);
      let rx = THREE.MathUtils.clamp((0.05 * amp) * (Math.sin(a + 1.7) * 0.70 + Math.sin(b + 0.9) * 0.30) * wind, -0.18, 0.18);
      let ry = THREE.MathUtils.clamp((0.035 * amp) * (Math.sin(a + 0.3) * 0.55 + Math.sin(b + 2.2) * 0.45) * wind, -0.22, 0.22);

      const py = (0.0020) * (Math.sin(a + 0.6) * 0.6 + Math.sin(b + 2.1) * 0.4) * (0.6 + 0.4 * wind);
      const px = (0.010) * Math.sin(rz) * (0.6 + 0.4 * wind);
      const pz = (0.006) * Math.sin(rz + 0.7) * (0.6 + 0.4 * wind);

      obj.position.copy(obj.userData.__basePos);
      obj.position.x += px;
      obj.position.y += py;
      obj.position.z += pz;

      obj.rotation.copy(obj.userData.__baseRot);
      obj.rotation.x += rx;
      obj.rotation.y += ry;
      obj.rotation.z += rz;
    }
  }
}
