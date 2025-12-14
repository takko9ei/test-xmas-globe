import * as THREE from "three";

// This is the base class for all objects in the scene
// Implemented by Li Zhuohang, do not modify this file

// Everyone's base class, all parts, including
// BaseStand, GlobeGlass, InnerWorld, SnowSystem, EnvironmentStstem, GlobeGlass, InnerWorld, SnowSystem
// Should inherit from this class
export class BaseObject extends THREE.Group {
  constructor() {
    super();
    // Initialize self automatically
    this.init();
  }

  // [Fill in the blank] initialize your model
  init() {
    console.log("BaseObject init");
  }

  // [Fill in the blank] update your model
  update(time) {
    // Default do nothing
  }
}
