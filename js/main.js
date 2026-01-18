import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

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
  100,
);
camera.position.z = 5;
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
const maxPixelRatio = isMobile ? 1.5 : 2.0;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
document.body.appendChild(renderer.domElement);

// Handle window resize to keep canvas centered and responsive
/* 
// OLD RESIZE LOGIC (Commented out for performance)
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
}); 
*/

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
  }, 100); // 100ms debounce
});

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

// Setup GUI
const lights = myObjects.find((obj) => obj instanceof Lights);
if (lights) {
  const gui = new GUI();

  // Light 1 (Main)
  const f1 = gui.addFolder("ライト1");
  f1.addColor(lights.mainLight, "color").name("カラー");
  f1.add(lights.mainLight, "intensity", 0, 30).name("明るさ");
  const p1 = f1.addFolder("位置");
  p1.add(lights.mainLight.position, "x", -5, 5);
  p1.add(lights.mainLight.position, "y", -5, 5);
  p1.add(lights.mainLight.position, "z", -5, 5);

  // Light 2 (Fill)
  const f2 = gui.addFolder("ライト2");
  f2.addColor(lights.fillLight, "color").name("カラー");
  f2.add(lights.fillLight, "intensity", 0, 30).name("明るさ");
  const p2 = f2.addFolder("位置");
  p2.add(lights.fillLight.position, "x", -5, 5);
  p2.add(lights.fillLight.position, "y", -5, 5);
  p2.add(lights.fillLight.position, "z", -5, 5);

  // Light 3 (Rim)
  const f3 = gui.addFolder("ライト3");
  f3.addColor(lights.rimLight, "color").name("カラー");
  f3.add(lights.rimLight, "intensity", 0, 30).name("明るさ");
  const p3 = f3.addFolder("位置");
  p3.add(lights.rimLight.position, "x", -5, 5);
  p3.add(lights.rimLight.position, "y", -5, 5);
  p3.add(lights.rimLight.position, "z", -5, 5);
}

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
