import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// 引入组员的文件
import { BaseStand } from "./BaseStand.js";
import { GlobeGlass } from "./GlobeGlass.js";
import { InnerWorld } from "./InnerWorld.js";
import { SnowSystem } from "./SnowSystem.js";
import { EnvironmentSystem } from "./EnvironmentSystem.js";

// 1. 标准 Three.js 设置
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
document.body.appendChild(renderer.domElement);

// 加个控制器方便调试
const controls = new OrbitControls(camera, renderer.domElement);

// 2. 实例化组员的对象
const myObjects = [];
const classesToLoad = [
  BaseStand,
  GlobeGlass,
  InnerWorld,
  SnowSystem,
  EnvironmentSystem,
];

// === 统一实例化所有对象 ===
classesToLoad.forEach((ClassRef) => {
  const instance = new ClassRef();
  scene.add(instance);
  myObjects.push(instance);
});
// ================================

// 3. 渲染循环
function animate(time) {
  requestAnimationFrame(animate);

  // 把毫秒转成秒
  const timeSeconds = time * 0.001;

  // 自动调用所有人的 update
  myObjects.forEach((obj) => {
    if (obj.update) obj.update(timeSeconds);
  });

  renderer.render(scene, camera);
}

animate(0);
