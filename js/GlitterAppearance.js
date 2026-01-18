import { BaseObject } from './BaseObject.js';
import * as THREE from 'three';

export class GlitterAppearance extends BaseObject {
    constructor() {
        super();
        this.particles = null;
    }

    /**
     * 初期化処理：ここでキラキラの粒子を作成します
     */
    init() {
        // 1. 粒子の数（多すぎると重くなるので調整してください）
        const particleCount = 1500;

        // 2. ジオメトリ（粒子の位置を管理する箱）の作成
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];

        // キラキラの色定義（ゴールドとシルバー）
        const colorGold = new THREE.Color(0xffcc00);
        const colorSilver = new THREE.Color(0xffffff);
        const tempColor = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            // 配置：スノードームの中（半径9以内）にランダム配置
            // (球状に分布させる計算)
            const r = 9 * Math.cbrt(Math.random()); // 中心に集まりすぎないように補正
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions.push(x, y, z);

            // 色：ゴールドとシルバーをランダムに混ぜる
            const mixRatio = Math.random();
            tempColor.copy(colorSilver).lerp(colorGold, mixRatio);
            colors.push(tempColor.r, tempColor.g, tempColor.b);

            // サイズ：大小ランダム
            sizes.push(Math.random() * 0.2 + 0.05);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // 3. マテリアル（見た目・質感）の作成
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true, // 上で決めた個別の色を使う
            map: this.createSparkleTexture(), // ★工夫点：手書きテクスチャ生成
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending, // ★工夫点：光を加算合成して輝かせる
            depthWrite: false, // ガラス越しでも綺麗に見えるように
        });

        // 4. メッシュ（物体）の作成と追加
        this.particles = new THREE.Points(geometry, material);
        this.add(this.particles);
    }

    /**
     * アニメーション処理：時間経過でキラキラさせる
     * @param {number} time - 経過時間
     */
    update(time) {
        if (!this.particles) return;

        // 全体をゆっくり回転させて「浮遊感」を出す
        this.particles.rotation.y = time * 0.05;
        
        // 縦方向（Y軸）にふわふわ揺らす
        this.particles.position.y = Math.sin(time * 0.5) * 0.2;

        // ★工夫点：キラキラの明滅（サイズの変化に見えるような演出）
        // ※ 本来はシェーダーを使いますが、簡易的にスケール振動で表現
        const scale = 1 + Math.sin(time * 3) * 0.1;
        this.particles.scale.set(scale, scale, scale);
    }

    /**
     * ★工夫点：外部画像を読み込まず、コードで光の画像を生成する関数
     */
    createSparkleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');

        // 中心から広がるグラデーション（光の玉）を描く
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // 中心は白く強く
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // 外側は透明

        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}