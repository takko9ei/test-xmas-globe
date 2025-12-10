import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 引入组员的文件
import { SnowSystem } from './SnowSystem.js';
// import { GlobeGlass } from './GlobeGlass.js'; // 等他们写好了再解开注释

// 1. 标准 Three.js 设置
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 加个控制器方便调试
const controls = new OrbitControls(camera, renderer.domElement);

// 2. 实例化组员的对象
const myObjects = [];

// === 在这里把组员做的东西加进来 ===
const snow = new SnowSystem();
scene.add(snow);
myObjects.push(snow);

// const glass = new GlobeGlass();
// scene.add(glass);
// myObjects.push(glass);
// ================================

// 3. 渲染循环
function animate(time) {
    requestAnimationFrame(animate);
    
    // 把毫秒转成秒
    const timeSeconds = time * 0.001;

    // 自动调用所有人的 update
    myObjects.forEach(obj => {
        if (obj.update) obj.update(timeSeconds);
    });

    renderer.render(scene, camera);
}

animate(0);