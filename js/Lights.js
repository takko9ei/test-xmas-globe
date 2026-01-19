import * as THREE from 'three';
import { BaseObject } from './BaseObject.js';

export class Lights extends BaseObject {
  init() {
    console.log('Lights: loading...');

    // Main Light
    this.mainLight = new THREE.PointLight(0xff8000, 11.6, 10);
    this.mainLight.position.set(-2.04, 0.8, 1.5);
    this.add(this.mainLight);

    // Fill Light
    this.fillLight = new THREE.PointLight(0x00d1d7, 5.2, 8);
    this.fillLight.position.set(2.88, 0.42, 1.5);
    this.add(this.fillLight);

    // Rim Light
    this.rimLight = new THREE.PointLight(0xdb00db, 11.6, 6);
    this.rimLight.position.set(-0.94, 0.98, -1.22);
    this.add(this.rimLight);

    console.log('Lights: loaded.');
  }

  update(time) {
    // No animation needed
  }
}
