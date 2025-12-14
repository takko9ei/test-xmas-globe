import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class InnerWorld extends BaseObject {
  init() {
    console.log("初始化内部世界...");

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // 1. Load Xmas Tree
    const treeTexture = textureLoader.load("./assets/textures/xmas_tree.jpeg");
    treeTexture.flipY = false;

    loader.load(
      "./assets/models/xmas_tree.glb",
      (gltf) => {
        const tree = gltf.scene;
        tree.traverse((child) => {
          if (child.isMesh) {
            child.material.map = treeTexture;
          }
        });
        this.add(tree);
        console.log("圣诞树加载完成");
      },
      undefined,
      (error) => console.error("Error loading xmas_tree", error)
    );

    // 2. Load Ground
    loader.load(
      "./assets/models/ground.glb",
      (gltf) => {
        const ground = gltf.scene;
        this.add(ground);
        console.log("地面加载完成");
      },
      undefined,
      (error) => console.error("Error loading ground", error)
    );
  }
}
