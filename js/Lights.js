import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";

export class Lights extends BaseObject {
    init() {
        console.log("Lights: loading...");

        // Light 1: Warm light from one side
        const light1 = new THREE.PointLight(0xffaa33, 50, 10);
        light1.position.set(2, 2, 2);
        this.add(light1);

        // Light 2: Cool light from the opposite side
        const light2 = new THREE.PointLight(0x33aaff, 5, 10);
        light2.position.set(-2, 1, -2);
        this.add(light2);

        // Optional: Add helpers to visualize lights (commented out)
        // const sphereSize = 0.2;
        // const pointLightHelper1 = new THREE.PointLightHelper(light1, sphereSize);
        // this.add(pointLightHelper1);
        // const pointLightHelper2 = new THREE.PointLightHelper(light2, sphereSize);
        // this.add(pointLightHelper2);

        console.log("Lights: loaded.");
    }

    update(time) {
        // Optional: Animate lights if needed
        // const radius = 3;
        // this.children[0].position.x = Math.cos(time) * radius;
        // this.children[0].position.z = Math.sin(time) * radius;
    }
}