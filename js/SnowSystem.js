import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { createGlitterMaterial } from "./GlitterAppearance.js";

export class SnowSystem extends BaseObject {
  init() {
    console.log("SnowSystem init");

    // exposed params
    this.params = {
      sphereRadius: 0.95,
      sphereCenter: new THREE.Vector3(0, 0, 0),
      particleSpeed: 0.003,
      particleSize: 0.02,
      color: new THREE.Color(0xffffff),
      brightness: 1.9,
    };

    this.count = 1500;

    // Use a plane, but with a snowflake alpha texture so the visible shape is ❄️ (not a square)
    const geometry = new THREE.PlaneGeometry(
      this.params.particleSize,
      this.params.particleSize,
    );

    // Use centralized material definition
    this.material = createGlitterMaterial({ color: this.params.color });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.add(this.mesh);

    // Particle data
    this.particles = [];

    // Optimization: Pre-allocate reusable objects
    // These objects are reused every frame to avoid Garbage Collection (GC)
    this._dummy = new THREE.Object3D();
    this._tempPos = new THREE.Vector3();
    this._inertiaForce = new THREE.Vector3();
    this._cameraRight = new THREE.Vector3();
    this._cameraUp = new THREE.Vector3();

    // Window interaction reusable vectors
    this._lastScreenPos = new THREE.Vector2();
    this._lastWindowSize = new THREE.Vector2();
    this._currentScreenPos = new THREE.Vector2();
    this._currentWindowSize = new THREE.Vector2();
    this._deltaMove = new THREE.Vector2();

    this._hasInitWindow = false;

    for (let i = 0; i < this.count; i++) {
      const particle = this.generateParticle({}, true);
      this.particles.push(particle);
      this.updateParticleMatrix(i, particle, this._dummy);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this._snowflakeTexture = this.material.map;
  }

  // Generate a particle inside hard-defined sphere
  generateParticle(p, initial = false) {
    const { sphereRadius, sphereCenter, particleSpeed } = this.params;

    let pos = p.position || new THREE.Vector3();

    if (initial) {
      // Uniform random point inside sphere
      const r = Math.cbrt(Math.random()) * sphereRadius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      pos.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    } else {
      // spawn them in the top 20% of the sphere volume
      const rVal = sphereRadius;
      const yMin = rVal * 0.5;
      const yMax = rVal * 0.95;

      const y = yMin + Math.random() * (yMax - yMin);
      const maxR = Math.sqrt(rVal * rVal - y * y);
      const rDisk = Math.sqrt(Math.random()) * maxR;
      const angle = Math.random() * 2 * Math.PI;

      pos.set(rDisk * Math.cos(angle), y, rDisk * Math.sin(angle));
    }

    // Apply Center Offset
    pos.add(sphereCenter);
    p.position = pos;

    // velocity
    const speed = particleSpeed;
    // We can reuse p.velocity if it exists
    if (!p.velocity) p.velocity = new THREE.Vector3();

    p.velocity.set(
      (Math.random() - 0.5) * speed * 0.5,
      -(speed + Math.random() * speed * 0.5),
      (Math.random() - 0.5) * speed * 0.5,
    );

    // rotation
    if (!p.rotation) p.rotation = new THREE.Euler();
    p.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );

    if (!p.rotSpeed) p.rotSpeed = new THREE.Euler();
    p.rotSpeed.set(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
    );

    // Reset inertia
    if (!p.inertialVelocity) p.inertialVelocity = new THREE.Vector3();
    p.inertialVelocity.set(0, 0, 0);

    return p;
  }

  updateParticleMatrix(i, p, dummy) {
    dummy.position.copy(p.position);
    dummy.rotation.copy(p.rotation);

    // Slight scale boost for better visibility
    dummy.scale.setScalar(1.2);

    dummy.updateMatrix();
    this.mesh.setMatrixAt(i, dummy.matrix);
  }

  update(time) {
    if (!this.mesh) return;

    const { sphereRadius, sphereCenter } = this.params;
    const radiusSq = sphereRadius * sphereRadius;

    // Window Drag Logic (Optimized)
    /* 
    // OLD LOGIC (Commented out for performance)
    // window drag
    if (!this.lastScreenPos) {
      this.lastScreenPos = new THREE.Vector2(window.screenX, window.screenY);
      this.lastWindowSize = new THREE.Vector2(
        window.outerWidth,
        window.outerHeight
      );
    }

    const currentScreenPos = new THREE.Vector2(window.screenX, window.screenY);
    const currentWindowSize = new THREE.Vector2(
      window.outerWidth,
      window.outerHeight
    );

    // Calculate delta (velocity of the window)
    const deltaMove = new THREE.Vector2();
    // Only calculate inertia if window size hasn't changed (ignore resize)
    if (
      currentWindowSize.x === this.lastWindowSize.x &&
      currentWindowSize.y === this.lastWindowSize.y
    ) {
      deltaMove.subVectors(currentScreenPos, this.lastScreenPos);
    }

    // Update history
    this.lastScreenPos.copy(currentScreenPos);
    this.lastWindowSize.copy(currentWindowSize);
    */

    // check for window properties to avoid crashes on mobile/iframe
    const screenX = typeof window.screenX === "number" ? window.screenX : 0;
    const screenY = typeof window.screenY === "number" ? window.screenY : 0;
    const outerW = window.outerWidth || window.innerWidth;
    const outerH = window.outerHeight || window.innerHeight;

    if (!this._hasInitWindow) {
      this._lastScreenPos.set(screenX, screenY);
      this._lastWindowSize.set(outerW, outerH);
      this._hasInitWindow = true;
    }

    this._currentScreenPos.set(screenX, screenY);
    this._currentWindowSize.set(outerW, outerH);

    // Reset delta
    this._deltaMove.set(0, 0);

    // Only calculate inertia if window size hasn't changed (ignore resize events)
    // And ensure coordinates are valid numbers (not NaN)
    const isValid = !isNaN(screenX) && !isNaN(screenY);
    const isSameSize =
      this._currentWindowSize.x === this._lastWindowSize.x &&
      this._currentWindowSize.y === this._lastWindowSize.y;

    if (isValid && isSameSize) {
      this._deltaMove.subVectors(this._currentScreenPos, this._lastScreenPos);
    }

    // Update history
    this._lastScreenPos.copy(this._currentScreenPos);
    this._lastWindowSize.copy(this._currentWindowSize);

    // Camera Basis Calculation
    const camera = arguments[1]; // Expected to be passed from main.js

    this._cameraRight.set(1, 0, 0);
    this._cameraUp.set(0, 1, 0);

    if (camera && camera.isCamera) {
      // Re-use logic: extractRotation avoids creating new Matrix4 if we trust camera.matrixWorld
      // But extractRotation returns a new Matrix4.
      // Better: access elements directly or use a shared matrix if extremely critical.

      // Standard way without generating garbage every frame:
      // We can interpret the rotation matrix columns directly.
      const e = camera.matrixWorld.elements;
      // Column 0: Right (x, y, z) -> elements[0], elements[1], elements[2]
      this._cameraRight.set(e[0], e[1], e[2]);
      // Column 1: Up (x, y, z)    -> elements[4], elements[5], elements[6]
      this._cameraUp.set(e[4], e[5], e[6]);
    }

    // Calculate Inertia Force
    const conversionFactor = 0.0003;

    // this._inertiaForce = (Right * delta.x) + (Up * -delta.y)
    this._inertiaForce.set(0, 0, 0);
    this._inertiaForce.addScaledVector(
      this._cameraRight,
      this._deltaMove.x * conversionFactor,
    );
    this._inertiaForce.addScaledVector(
      this._cameraUp,
      -this._deltaMove.y * conversionFactor,
    );

    // Particle Loop
    /*
    // old loop(massive GC)
    const dummy = new THREE.Object3D(); // Created locally in old version
    const tempPos = new THREE.Vector3(); // Created locally in old version
    
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      // Init extra velocity if not exists
      if (!p.inertialVelocity) p.inertialVelocity = new THREE.Vector3();

      // Apply new inertia
      p.inertialVelocity.add(inertiaForce); // Note: inertiaForce was calculated locally

      // Damp existing inertia
      p.inertialVelocity.multiplyScalar(0.95);

      // Total velocity for this frame (HIGH GC HEAVY)
      const totalVelocity = p.velocity.clone().add(p.inertialVelocity);

      // Move
      p.position.add(totalVelocity);

      // Rotate
      p.rotation.x += p.rotSpeed.x;
      p.rotation.y += p.rotSpeed.y;
      p.rotation.z += p.rotSpeed.z;

      // Boundary Check
      // Calculate distance from sphere center
      tempPos.copy(p.position).sub(sphereCenter);

      // We respawn if:
      // 1. Distance > Radius (Exited sphere)
      // 2. OR y is below the sphere bottom (relative to center)
      if (tempPos.lengthSq() > radiusSq) {
        // Simple interaction: respawn
        this.generateParticle(p);
        p.inertialVelocity.set(0, 0, 0); // Reset inertia on respawn
      }

      this.updateParticleMatrix(i, p, dummy);
    }
    */

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      // Apply Inertia
      // p.inertialVelocity += inertiaForce
      p.inertialVelocity.add(this._inertiaForce);

      // Damping
      p.inertialVelocity.multiplyScalar(0.95);

      // Move: position += velocity + inertialVelocity
      // To avoid allocating a new 'totalVelocity' vector, we add them sequentially
      p.position.add(p.velocity);
      p.position.add(p.inertialVelocity);

      // Rotate
      p.rotation.x += p.rotSpeed.x;
      p.rotation.y += p.rotSpeed.y;
      p.rotation.z += p.rotSpeed.z;

      // Boundary Check
      this._tempPos.copy(p.position).sub(sphereCenter);

      if (this._tempPos.lengthSq() > radiusSq) {
        this.generateParticle(p);
      }

      this.updateParticleMatrix(i, p, this._dummy);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
