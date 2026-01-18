import * as THREE from 'three';
import { BaseObject } from './BaseObject.js';

export class SnowSystem extends BaseObject {
  init() {
    console.log("SnowSystem init (1.5x Amount Ver.)");

    // === パラメータ設定 ===
    this.params = {
      sphereRadius: 0.95,
      sphereCenter: new THREE.Vector3(0, 0, 0),
      particleSpeed: 0.002, // ゆったりと浮遊する速度
      particleSize: 0.035,  // 繊細なサイズ
      color: new THREE.Color(0xffffff),
    };
    // ==========================

    // 【変更点】雪の量を1.5倍に増量 (1500 -> 2250)
    this.count = 2250;

    const geometry = new THREE.PlaneGeometry(
      this.params.particleSize,
      this.params.particleSize
    );

    const snowTexture = this.createSnowTexture();

    this.material = new THREE.MeshBasicMaterial({
      color: this.params.color,
      map: snowTexture,
      transparent: false,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.frustumCulled = false; 
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.add(this.mesh);

    this.particles = [];
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      const particle = this.generateParticle({}, true);
      this.particles.push(particle);
      this.updateParticleMatrix(i, particle, dummy);

      // 色のランダム化（白・青白・輝き）
      const r = 0.9 + Math.random() * 0.1;
      const g = 0.9 + Math.random() * 0.1;
      const b = 1.0; 
      const brightness = 0.9 + Math.random() * 0.1;
      
      tempColor.setRGB(r * brightness, g * brightness, b * brightness);
      this.mesh.setColorAt(i, tempColor);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  createSnowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const center = size / 2;
    const maxRadius = size * 0.45;

    context.clearRect(0, 0, size, size);

    context.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.shadowBlur = 0; 

    function drawSymmetric(drawFunc) {
      for (let i = 0; i < 6; i++) {
        context.save();
        context.translate(center, center);
        context.rotate((Math.PI / 3) * i);
        drawFunc();
        context.restore();
      }
    }

    drawSymmetric(() => {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(maxRadius, 0);
      context.stroke();

      for (let j = 1; j <= 2; j++) {
        const dist = (maxRadius * 0.3) * j;
        const len = (maxRadius * 0.25);
        context.beginPath();
        context.moveTo(dist, 0);
        context.lineTo(dist + len * 0.5, len * 0.866);
        context.moveTo(dist, 0);
        context.lineTo(dist + len * 0.5, -len * 0.866);
        context.stroke();
      }
    });

    context.beginPath();
    context.arc(center, center, size * 0.1, 0, Math.PI * 2);
    context.fillStyle = 'white';
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; 
    return texture;
  }

  generateParticle(p, initial = false) {
    const { sphereRadius, sphereCenter } = this.params;
    let pos = new THREE.Vector3();

    if (initial) {
      const r = Math.cbrt(Math.random()) * sphereRadius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pos.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    } else {
      const rVal = sphereRadius;
      const yMin = rVal * 0.4;
      const yMax = rVal * 0.9;
      const y = yMin + Math.random() * (yMax - yMin);
      const maxR = Math.sqrt(rVal * rVal - y * y);
      const rDisk = Math.sqrt(Math.random()) * maxR;
      const angle = Math.random() * 2 * Math.PI;
      pos.set(rDisk * Math.cos(angle), y, rDisk * Math.sin(angle));
    }

    pos.add(sphereCenter);
    p.position = pos;

    const speed = this.params.particleSpeed;
    p.velocity = new THREE.Vector3(
      0, 
      -(speed + Math.random() * speed * 0.5), 
      0 
    );

    p.swayOffset = Math.random() * 100; 
    p.swaySpeed = 0.5 + Math.random() * 0.5;

    p.rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    p.rotSpeed = new THREE.Euler(Math.random() * 0.01, Math.random() * 0.01, Math.random() * 0.01);

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
    const { sphereRadius, sphereCenter } = this.params;
    const dummy = new THREE.Object3D();
    const radiusSq = sphereRadius * sphereRadius;
    const tempPos = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      p.position.add(p.velocity);

      const sway = Math.sin(time * p.swaySpeed + p.swayOffset) * 0.001; 
      p.position.x += sway;
      p.position.z += sway * 0.5;

      p.rotation.x += p.rotSpeed.x;
      p.rotation.y += p.rotSpeed.y;
      p.rotation.z += p.rotSpeed.z;

      tempPos.copy(p.position).sub(sphereCenter);
      if (tempPos.lengthSq() > radiusSq) {
        this.generateParticle(p);
      }
      this.updateParticleMatrix(i, p, dummy);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}