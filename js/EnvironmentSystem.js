import * as THREE from "three";
import { BaseObject } from "./BaseObject.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

export class EnvironmentSystem extends BaseObject {
    init() {
        console.log("EnvironmentSystem: initializing...");

        // 使用 EXRLoader 加载 .exr 环境贴图
        // 等等，BaseObject 里没有 renderer。
        // 通常环境贴图只需要直接设给 scene.environment，Three.js 会自动处理 PMREM (如果用 .exr 最好预处理，但为了简单，先直接加载)

        // 实际上，现代 Three.js (r130+) 对 environment 支持很好，可以直接把 texture 赋给 scene.environment
        // EXRLoader 返回的是 DataTexture

        const loader = new EXRLoader();
        loader.load(
            "./assets/textures/warm_restaurant_night_4k.exr",
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                // 因为是异步加载，加载完的时候，this.parent 应该已经是 scene 了 (如果不确定，可以用 setInterval check 或者事件)
                // 按照 main.js 的逻辑：
                // 1. new EnvironmentSystem()
                // 2. scene.add(instance) -> 此时 this.parent = scene
                // 3. loader.load callback -> 肯定在 add 之后

                if (this.parent) {
                    console.log("EnvironmentSystem: Texture loaded, applying to scene.");
                    this.parent.environment = texture;
                    this.parent.background = texture; // 如果也想作为背景
                    // this.parent.backgroundBlurriness = 0.5; // 可选：模糊背景
                } else {
                    console.warn("EnvironmentSystem: Loaded texture but no parent scene found!");
                }
            },
            (xhr) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error("EnvironmentSystem: An error occurred loading the HDRI", error);
            }
        );
    }
}
