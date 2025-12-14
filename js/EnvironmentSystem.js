import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

export class EnvironmentSystem extends BaseObject {
  init() {
    console.log("EnvironmentSystem: initializing...");

    // This model is implemented by Li Zhuohang
    // If you want to implement IGL(Image Based Lighting), or reflection effect, u can refer to
    // GlobeGlass.js
    // Commonly, there will be no need to modify this file

    // Use EXRLoader to load .exr environment map
    // No renderer in BaseObject
    // Usually, environment map only needs to be set to scene.environment, Three.js will automatically handle PMREM (if using .exr, best to preprocess, but for simplicity, load directly)
    // Actually, modern Three.js (r130+) has good support for environment, you can directly assign texture to scene.environment
    // EXRLoader returns DataTexture

    const loader = new EXRLoader();
    loader.load(
      "./assets/textures/warm_restaurant_night_4k.exr",
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Because it is asynchronous loading, when it is loaded, this.parent should already be scene (if you are not sure, you can use setInterval check or event)
        // Following the logics in main.js:
        // 1. new EnvironmentSystem()
        // 2. scene.add(instance) -> now, this.parent = scene
        // 3. loader.load callback -> will behind add

        if (this.parent) {
          console.log("EnvironmentSystem: Texture loaded, applying to scene.");
          this.parent.environment = texture;
          this.parent.background = texture; // If u want to set it as background
          // this.parent.backgroundBlurriness = 0.5; // Optional: blur background
        } else {
          console.warn(
            "EnvironmentSystem: Loaded texture but no parent scene found!"
          );
        }
      },
      (xhr) => {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error(
          "EnvironmentSystem: An error occurred loading the HDRI",
          error
        );
      }
    );
  }
}
