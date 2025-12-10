import * as THREE from 'three';

// 这是一个“容器”，所有人的代码都继承这个
export class BaseObject extends THREE.Group {
    constructor() {
        super();
        // 自动运行初始化
        this.init();
    }

    // 【给组员填空的地方 1】：初始化你的模型
    init() {
        console.log("BaseObject init");
    }

    // 【给组员填空的地方 2】：每一帧怎么动
    update(time) {
        // 默认啥也不做
    }
}