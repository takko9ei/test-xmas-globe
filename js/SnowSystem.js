import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { createGlitterMaterial } from "./GlitterAppearance.js";

export class SnowSystem extends BaseObject {
  init() {
    console.log("SnowSystem init");

    // === Exposed Parameters ===
    this.params = {
      sphereRadius: 0.95,
      sphereCenter: new THREE.Vector3(0, 0, 0),
      particleSpeed: 0.003,
      particleSize: 0.012,
      color: new THREE.Color(0xffffff),
      brightness: 1.9,
    };
    // ==========================

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

  // Generate a particle STRICTLY inside the defined sphere
  generateParticle(p, initial = false) {
    const { sphereRadius, sphereCenter, particleSpeed } = this.params;

    // 1. Position Generation
    // We need a random point inside the sphere: sphereCenter + random_in_radius
    // If NOT initial (respawning), we prefer them to spawn at the top of the sphere to fall down,
    // but still STRICTLY inside the sphere boundaries.

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
      // Respawn: Pick a point on the top Hemisphere or mainly top area to simulate falling in
      // To keep it strictly in sphere, we can pick a random point on a disk at a high Y,
      // OR picking a random point in the top cap.

      // Let's spawn them in the top 20% of the sphere volume for continuity
      // y range: [sphereRadius * 0.8, sphereRadius]
      // But we must respect the spherical boundary at that Y.

      const rVal = sphereRadius;
      // height from center
      const yMin = rVal * 0.5; // Start showing up from half way up
      const yMax = rVal * 0.95; // Don't spawn perfectly at edge to avoid clipping instantly

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

    // 2. Velocity
    // Falling down (-y) with some sway
    const speed = particleSpeed;
    p.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * speed * 0.5, // Sway X
      -(speed + Math.random() * speed * 0.5), // Fall Y
      (Math.random() - 0.5) * speed * 0.5 // Sway Z
    );

    // 3. Rotation
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

    // Temp vector for distance check
    const tempPos = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      // Move
      p.position.add(p.velocity);

      // Rotate
      p.rotation.x += p.rotSpeed.x;
      p.rotation.y += p.rotSpeed.y;
      p.rotation.z += p.rotSpeed.z;

      // Boundary Check
      // Calculate distance from sphere center
      tempPos.copy(p.position).sub(sphereCenter);

      // If outside radius OR too low (bottom of sphere)
      // Actually, just checking radius is enough to keep them inside the spherical volume.
      // But if they fall out the bottom, we want to respawn them.

      // We respawn if:
      // 1. Distance > Radius (Exited sphere)
      // 2. OR y is below the sphere bottom (relative to center) -> strictly, 1 covers this, but we might want them to die earlier if we only want snow in the top half?
      // User said: "limit all particles in a sphere range". So strictly radius check.

      if (tempPos.lengthSq() > radiusSq) {
        // To prevent popping, maybe we only respawn if they are at the BOTTOM hemisphere?
        // If they drift out the side/top, we should force them back or respawn?
        // Simple interaction: Respawn.
        this.generateParticle(p);
      }

      this.updateParticleMatrix(i, p, dummy);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
