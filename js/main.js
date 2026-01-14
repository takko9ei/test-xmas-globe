import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// imports
import { BaseStand } from "./BaseStand.js";
import { GlobeGlass } from "./GlobeGlass.js";
import { InnerWorld } from "./InnerWorld.js";
import { SnowSystem } from "./SnowSystem.js";
import { EnvironmentSystem } from "./EnvironmentSystem.js";
import { Lights } from "./Lights.js";

// Standard Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Add controller for debugging
const controls = new OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 3.0;

// Instance group members' objects
const myObjects = [];
const classesToLoad = [
  BaseStand,
  GlobeGlass,
  InnerWorld,
  SnowSystem,
  EnvironmentSystem,
  Lights,
];

// ===instancialize all objects===
classesToLoad.forEach((ClassRef) => {
  const instance = new ClassRef();
  scene.add(instance);
  myObjects.push(instance);
});

// Render loop
function animate(time) {
  requestAnimationFrame(animate);

  const timeSeconds = time * 0.001;

  // Automatically call update for all objects
  myObjects.forEach((obj) => {
    if (obj.update) obj.update(timeSeconds, camera);
  });

  renderer.render(scene, camera);
}

animate(0);
