import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class InnerWorld extends BaseObject {
  init() {
    console.log("InnerWorld: loading...");

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // 1. Load Xmas Tree
    const treeTexture = textureLoader.load("./assets/textures/xmas_tree.jpeg");
    treeTexture.flipY = false;

    loader.load(
      "./assets/models/tree-edited.glb",
      (gltf) => {
        const tree = gltf.scene;
        tree.traverse((child) => {
          if (child.isMesh) {
            child.material.map = treeTexture;
          }
        });
        this.add(tree);
        console.log("InnerWorld: tree loaded.");
      },
      undefined,
      (error) =>
        console.error("An error occurred loading the xmas_tree model", error)
    );

    // 2. Load Ground
    loader.load(
      "./assets/models/ground.glb",
      (gltf) => {
        const ground = gltf.scene;
        this.add(ground);
        console.log("InnerWorld: ground loaded.");
      },
      undefined,
      (error) =>
        console.error("An error occurred loading the ground model", error)
    );
  }
  update(time) {
    // if (this.model) {
    //   // Rotate
    //   this.model.rotation.y += 0.005;
    // }
  }
}
