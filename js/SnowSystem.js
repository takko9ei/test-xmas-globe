import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";

// If you cancel code comment (ctrl+/) here, you will see a little cube moves up and down
// Write your snow code here
export class SnowSystem extends BaseObject {
  // Override init method
  init() {
    // console.log("SnowSystem init");
    // // 1. Create geometry
    // const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    // // 2. Create material
    // const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // // 3. Create object
    // this.mesh = new THREE.Mesh(geometry, material);
    // // 4. *important* Add to this, not scene
    // this.add(this.mesh);
  }

  // Override update method
  update(time) {
    // Write animation logic here
    // if (this.mesh) {
    //     this.mesh.position.y = Math.sin(time); // Simple up and down movement example
    //     this.mesh.rotation.y += 0.01;
    // }
  }
}
