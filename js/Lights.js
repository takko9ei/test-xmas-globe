import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";

export class Lights extends BaseObject {
    init() {
        console.log("Lights: loading...");

        // --- Ambient light (NEW) ---
        const ambientLight = new THREE.AmbientLight(
            0xffffff, // neutral white
            0.3       // low intensity so it doesn't flatten lighting
        );
        this.add(ambientLight);

        // Spotlight setup
        this.spotlight = new THREE.SpotLight(
            0xff0000,     // initial color
            0,            // start at zero intensity
            25,           // distance
            Math.PI / 6,  // cone angle
            0.35,         // penumbra
            1.0           // decay
        );

        // Position above the snow globe
        this.spotlight.position.set(0, 6, 6);
        this.spotlight.target.position.set(0, 0, 0);

        this.add(this.spotlight);
        this.add(this.spotlight.target);

        // Animation parameters
        this.maxIntensity = 20;
        this.blinkSpeed = 1.0;  // red/green switching speed
        this.fadeSpeed = 1.0;   // dim/bright speed

        console.log("Lights: loaded.");
    }

    update(time) {
        // --- Color blinking ---
        const s = Math.sin(time * this.fadeSpeed);

        // Intensity: smooth fade from 0 → max → 0
        this.spotlight.intensity = Math.abs(s) * this.maxIntensity;

        // Color: one full sine per color
        if (s >= 0.0) {
            this.spotlight.color.set(0xff0000); // red
        } else {
            this.spotlight.color.set(0x00ff00); // green
        }
    }
}
