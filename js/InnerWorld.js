import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class InnerWorld extends BaseObject {
  init() {
    console.log("InnerWorld init");

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
        console.log("InnerWorld tree init done");
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
        console.log("InnerWorld ground init done");
      },
      undefined,
      (error) => console.error("Error loading ground", error)
    );
  }
  update(time) {
    // if (this.model) {
    //   // Rotate
    //   this.model.rotation.y += 0.005;
    // }
  }
}
