import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class BaseStand extends BaseObject {
  init() {
    console.log("BaseStand init");

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Load Texture
    const texture = textureLoader.load("./assets/textures/basement.jpg");
    texture.flipY = false; // GLTF models usually expect flipY to be false

    // Load Model
    loader.load(
      "./assets/models/basement.glb",
      (gltf) => {
        const model = gltf.scene;

        // Apply Texture
        model.traverse((child) => {
          if (child.isMesh) {
            child.material.map = texture;
          }
        });
        this.add(model);
        console.log("BaseStand init done");
      },
      undefined,
      (error) => {
        console.error("An error happened loading the basement model", error);
      }
    );
  }
}
