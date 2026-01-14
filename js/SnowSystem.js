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
      particleSize: 0.012,
      color: new THREE.Color(0xffffff),
      brightness: 1.9,
    };

    this.count = 1500;

    // Use dynamic geometry based on particleSize
    // 2 particlesize, for a square mesh
    const geometry = new THREE.PlaneGeometry(
      this.params.particleSize,
      this.params.particleSize
    );

    this.material = createGlitterMaterial({
      color: this.params.color,
      brightness: this.params.brightness,
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.add(this.mesh);

    // Particle data
    this.particles = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.count; i++) {
      const particle = this.generateParticle({}, true);
      this.particles.push(particle);
      this.updateParticleMatrix(i, particle, dummy);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // Generate a particle inside hard-defined sphere
  generateParticle(p, initial = false) {
    const { sphereRadius, sphereCenter, particleSpeed } = this.params;

    // position generate
    // sphereCenter + random_in_radius
    // If NOT initial, we prefer them to spawn at the top of the sphere to fall down,

    let pos = new THREE.Vector3();

    if (initial) {
      // Uniform random point inside sphere
      const r = Math.cbrt(Math.random()) * sphereRadius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      pos.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    } else {
      // spawn them in the top 20% of the sphere volume for continuity
      // y range: [sphereRadius * 0.8, sphereRadius]
      // But we must respect the spherical boundary at that Y

      const rVal = sphereRadius;
      // height from center
      const yMin = rVal * 0.5; // start showing up from half way up
      const yMax = rVal * 0.95; // don't spawn perfectly at edge to avoid clipping instantly

      const y = yMin + Math.random() * (yMax - yMin);

      // At height y, the max radius is sqrt(R^2 - y^2)
      const maxR = Math.sqrt(rVal * rVal - y * y);
      const rDisk = Math.sqrt(Math.random()) * maxR; // Uniform disk distribution
      const angle = Math.random() * 2 * Math.PI;

      pos.set(rDisk * Math.cos(angle), y, rDisk * Math.sin(angle));
    }

    // Apply Center Offset
    pos.add(sphereCenter);
    p.position = pos;

    // velocity
    // Falling down (-y) with some sway
    const speed = particleSpeed;
    p.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * speed * 0.5, // sway X
      -(speed + Math.random() * speed * 0.5), // Fall Y
      (Math.random() - 0.5) * speed * 0.5 // Sway Z
    );

    // rotation
    p.rotation = new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    p.rotSpeed = new THREE.Euler(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );

    return p;
  }

  updateParticleMatrix(i, p, dummy) {
    dummy.position.copy(p.position);
    dummy.rotation.copy(p.rotation);
    dummy.updateMatrix();
    this.mesh.setMatrixAt(i, dummy.matrix);
  }

  update(time) {
    if (!this.mesh) return;

    if (this.material.uniforms) {
      this.material.uniforms.time.value = time;
    }

    const { sphereRadius, sphereCenter } = this.params;
    const dummy = new THREE.Object3D();
    const radiusSq = sphereRadius * sphereRadius;

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
    // Map: Screen Space Delta -> World Space Force
    // Screen X+ is Right, Screen Y+ is Down
    // We want:
    //  Screen Right -> Camera Right
    //  Screen Down  -> Camera Down (World -Y relative to camera if camera was upright, but generally Camera's local -Y in view space, or simply -CameraUp in World Space)
    // "Screen Down" roughly corresponds to "Camera Down" vector in world space.

    // Let's get camera basis vectors in World Space
    // default camera is optional in signature, make sure we have it
    const camera = arguments[1]; // Or change signature to update(time, camera)

    // Fallback if camera not passed (though we added it to main.js)
    let cameraRight = new THREE.Vector3(1, 0, 0);
    let cameraUp = new THREE.Vector3(0, 1, 0);

    if (camera && camera.isCamera) {
      // Construct basis from camera rotation
      const matrix = new THREE.Matrix4().extractRotation(camera.matrixWorld);

      // Column 0 is Right, Column 1 is Up, Column 2 is -Forward
      cameraRight.setFromMatrixColumn(matrix, 0);
      cameraUp.setFromMatrixColumn(matrix, 1);
    }

    const conversionFactor = 0.0003;

    // deltaMove.x (Right) * CameraRight
    // deltaMove.y (Down)  * -CameraUp  (because deltaMove.y is positive DOWN, we want vector pointing DOWN)

    const inertiaForce = new THREE.Vector3();
    inertiaForce.addScaledVector(cameraRight, deltaMove.x * conversionFactor);
    inertiaForce.addScaledVector(cameraUp, -deltaMove.y * conversionFactor);

    // Temp vector for distance check
    const tempPos = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      // Init extra velocity if not exists
      if (!p.inertialVelocity) p.inertialVelocity = new THREE.Vector3();

      // Apply new inertia
      p.inertialVelocity.add(inertiaForce);

      // Damp existing inertia
      p.inertialVelocity.multiplyScalar(0.95);

      // Total velocity for this frame
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
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
