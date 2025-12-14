import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class GlobeGlass extends BaseObject {
  init() {
    console.log("初始化玻璃球...");

    const loader = new GLTFLoader();

    // Load the globe model
    loader.load(
      "./assets/models/globe.glb",
      (gltf) => {
        this.model = gltf.scene;

        // Apply Normal Material to all meshes in the model
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshPhysicalMaterial({
              metalness: 0.0,
              roughness: 0.0,
              transmission: 1,
              thickness: 0.1,
              clearcoat: 0.1,
              clearcoatRoughness: 0.05,
              envMapIntensity: 1.5, // enhance reflection
            });
          }
        });

        this.add(this.model);
        console.log("GlobeGlass init done");
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error happened loading the globe model", error);
      }
    );
  }

  update(time) {
    // if (this.model) {
    //   // Rotate the globe
    //   this.model.rotation.y += 0.005;
    // }
  }
}
