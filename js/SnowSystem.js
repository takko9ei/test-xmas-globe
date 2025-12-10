import * as THREE from 'three';
import { BaseObject } from './BaseObject.js';

// B同学，请在这里写你的雪花代码
export class SnowSystem extends BaseObject {
    
    // 覆盖父类的 init 方法
    init() {
        console.log("正在创建雪花...");
        
        // 1. 创建几何体
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        // 2. 创建材质
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // 3. 创建物体
        this.mesh = new THREE.Mesh(geometry, material);
        
        // 4. 【重要】一定要 add 到 this，而不是 scene
        this.add(this.mesh);
    }

    // 覆盖父类的 update 方法
    update(time) {
        // 这里写动画逻辑，time 是当前时间（秒）
        if (this.mesh) {
            this.mesh.position.y = Math.sin(time); // 简单的上下移动示例
            this.mesh.rotation.y += 0.01;
        }
    }
}