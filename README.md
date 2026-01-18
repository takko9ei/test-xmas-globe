# Christmas Globe 🎄🔮

A beautiful, interactive 3D Christmas Snow Globe built with Three.js. This project features a realistic glass sphere, dynamic lighting, a particle snow system, and a cozy winter scene inside.

## (Screenshot)

![Project Screenshot](placeholder)

---

## 🇬🇧 English

### Description

This project is a WebGL-based 3D scene rendering a Christmas-themed snow globe. It showcases advanced rendering techniques such as physically based rendering (PBR), glass refraction/reflection, and custom shader work for stylized foliage.

### Features

- **Interactive Controls**: A custom-styled GUI panel (located at the top-right) allows users to adjust:
  - **Lights**: Control Intensity, Color, and Position (X, Y, Z) for Main, Fill, and Rim lights.
- **Dynamic Lighting**: Three-point lighting setup (Main, Fill, Rim) to create a studio-like atmosphere.
- **Snow System**: A particle-based snow system with optimized physics for wind and turbulence.
- **Inner World**: A procedurally assembled scene containing:
  - A stylized Christmas Tree with decorations (ornaments, ribbons, star).
  - A Snowman and a Tiny Cabin.
  - Procedural wind sway animation for foliage.
- **Glass Shader**: Custom `GlobeGlass` implementation for realistic refraction and reflection.

### Architecture

The project follows a modular object-oriented architecture:

- **`main.js`**: The entry point. Initializes the Three.js scene, camera, renderer, and the `lil-gui` control panel. It manages the render loop and object updates.
- **`BaseObject.js`**: A base class for all scene entities, ensuring a consistent `update(time)` interface.
- **`Lights.js`**: Manages the three point lights (Main, Fill, Rim) and updates them based on GUI input.
- **`InnerWorld.js`**: Handles the loading and generating of the scene inside the globe (Tree, Snowman, Cabin). Implements custom shader materials for the tree leaves.
- **`GlobeGlass.js`**: Creates the outer glass sphere with physical material properties.
- **`SnowSystem.js`**: Manages the snowflake particles and their movement logic.

### View on GitHub Pages

This project is deployed and visible via GitHub Pages.
[GitHub Pages](https://takko9ei.github.io/test-xmas-globe/)

---

## 🇯🇵 日本語

### 概要

Three.jsを使用して構築された、美しくインタラクティブな3Dクリスマススノードームです。このプロジェクトは、リアルなガラスの球体、ダイナミックなライティング、パーティクル雪システム、そして居心地の良い冬の景色を特徴としています。

### 機能

- **インタラクティブな操作**: 画面右上のカスタムGUIパネルで以下を調整できます：
  - **ライト**: メイン、フィル、リムライトの強度、色、位置（X, Y, Z）を制御可能。
- **ダイナミックライティング**: スタジオのような雰囲気を出すための3点照明セットアップ（メイン、フィル、リム）。
- **雪システム**: 風や乱気流を考慮した物理演算によるパーティクルベースの雪。
- **内部世界**: 手続き型（プロシージャル）に生成・配置されたシーン：
  - 装飾（オーナメント、リボン、星）が施された様式化されたクリスマスツリー。
  - 雪だるまと小さな小屋。
  - 葉の揺れを表現するプロシージャルな風のアニメーション。
- **ガラスシェーダー**: リアルな屈折と反射を実現するカスタム `GlobeGlass` 実装。

### アーキテクチャ

このプロジェクトは、モジュール式のオブジェクト指向アーキテクチャを採用しています：

- **`main.js`**: エントリーポイント。Three.jsのシーン、カメラ、レンダラー、および `lil-gui` コントロールパネルを初期化します。レンダーループとオブジェクトの更新を管理します。
- **`BaseObject.js`**: すべてのシーンエンティティの基底クラス。一貫した `update(time)` インターフェースを保証します。
- **`Lights.js`**: 3つのポイントライト（メイン、フィル、リム）を管理し、GUI入力に基づいて更新します。
- **`InnerWorld.js`**: ドーム内部のシーン（ツリー、雪だるま、小屋）の読み込みと生成を処理します。ツリーの葉のためのカスタムシェーダーマテリアルを実装しています。
- **`GlobeGlass.js`**: 物理マテリアルプロパティを持つ外部ガラス球を作成します。
- **`SnowSystem.js`**: 雪の結晶パーティクルとその動きのロジックを管理します。

### GitHub Pagesで見る

このプロジェクトはGitHub Pagesで公開されています。
[GitHub Pages](https://takko9ei.github.io/test-xmas-globe/)

---

## 🇨🇳 中文

### 简介

这是一个使用 Three.js 构建的精美交互式 3D 圣诞水晶球。本项目包含逼真的玻璃球体、动态光照、粒子雪花系统以及球内温馨的冬季场景。

### 功能特性

- **交互式控制**: 通过右上角的自定义 GUI 面板，用户可以调整：
  - **灯光**: 控制主光（Main）、补光（Fill）和轮廓光（Rim）的强度、颜色以及位置（X, Y, Z）。
- **动态照明**: 采用三点布光法（主光、补光、轮廓光）营造类似摄影棚的氛围。
- **雪花系统**: 基于粒子的雪花系统，包含模拟风和湍流的物理效果。
- **内部世界**: 程序化生成的场景，包含：
  - 带有装饰（挂饰、彩带、星星）的风格化圣诞树。
  - 雪人和小木屋。
  - 植物树叶的程序化随风摆动动画。
- **玻璃着色器**: 自定义的 `GlobeGlass` 实现，用于呈现逼真的折射和反射效果。

### 架构

本项目采用模块化的面向对象架构：

- **`main.js`**: 入口文件。初始化 Three.js 场景、相机、渲染器以及 `lil-gui` 控制面板。负责管理渲染循环和对象更新。
- **`BaseObject.js`**: 所有场景实体的基类，确保统一的 `update(time)` 接口。
- **`Lights.js`**: 管理三个点光源（主光、补光、轮廓光），并根据 GUI 输入进行更新。
- **`InnerWorld.js`**: 处理水晶球内部场景（树、雪人、小屋）的加载和生成。实现了用于树叶的自定义着色器材质。
- **`GlobeGlass.js`**: 创建具有物理材质属性的外部玻璃球。
- **`SnowSystem.js`**: 管理雪花粒子及其运动逻辑。

### 在 GitHub Pages 上查看

本项目已部署并通过 GitHub Pages 可见。
[通过 GitHub Pages 链接访问：](https://takko9ei.github.io/test-xmas-globe/)
