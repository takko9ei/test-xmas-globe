# 🎄 Christmas Globe Project - Team Handbook

Hello Team! 👋

Welcome to our Graphics project! To make sure we can work together smoothly without worrying about complex configurations or breaking the code, I have set up a project skeleton for us.

This guide will show you how to set up your environment(git stuffs), where to write your code, and how to submit your work using GitHub.

For the skeleton preview, you can clone this repository, and use Live Server to start a local server, to view the 3D scene. Also, the github page of this repository is available at https://takko9ei.github.io/test-xmas-globe/. This page need seconds to load, because of the large size of HDRI resource.

---

## 1. Quick Setup (No Installation Required)

We are using a "No-Build" approach. You do **not** need to install Node.js or run complex commands.

1.  **Install VS Code:** If you haven't already.
2.  **Install "Live Server":**
    - Open VS Code.
    - Click the **Extensions** icon on the left sidebar (the four squares).
    - Search for `Live Server`.
    - Click **Install** (The icon is a purple signal tower).
3.  **Accept GitHub Invitation:**
    - Check your email for an invitation to this repository.
    - Click **"Accept Invitation"**.
    - **Note:** You are added as a "Collaborator". This means you have direct access to this repository. **You do NOT need to Fork this project.** Just Clone it directly.
    - If you have not been invited, please contact me(Li Zhuohang).
4.  **Prepare Git:**
    - Access git official website to install git.
    - You can clone the repository by:
    1. Locate the folder where you want to clone the repository.
    2. Right click, and select `Git Bash here`.
    3. Run the command `git clone https://github.com/takko9ei/test-xmas-globe.git`.
    4. Wait for the cloning to complete.
    5. Open the cloned repository in VS Code.
    - Once you have the repository folder, you can open it in VS Code. In VS Code, press `CTRL + `` to open the terminal, the terminal will be "located" in the repository folder, you can use git commands in the terminal.

---

## 2. How to Run the Project

1.  Open this project folder in VS Code.
2.  Find the `index.html` file in the file explorer.
3.  Right-click anywhere in the code area of `index.html`.
4.  Select **Open with Live Server**.
5.  A browser window will pop up automatically showing our 3D scene. It may tooks seconds to load, because of the large size of HDRI resource.
    - _Tip: Whenever you save your code (`Ctrl + S`), the browser will refresh automatically._

---

## 3. Where to Write Code?

I have designed the project using a **Modular Structure**. Please only edit the file assigned to your role to avoid conflicts.

### File Structure

```text
project/
├── index.html          # [DO NOT EDIT] The entry point
├── js/
│   ├── main.js         # [DO NOT EDIT] The engine that runs the loop
│   ├── BaseObject.js   # [DO NOT EDIT] The parent class
│   │
│   ├── GlobeGlass.js   # 🟢 (Role A) Write your Glass code here
│   ├── SnowSystem.js   # 🔵 (Role B) Write your Snow code here
│   ├── InnerWorld.js   # 🟡 (Role C) Write your Interior code here
│   └── BaseStand.js    # 🟠 (Role D) Write your Base code here
│
└── assets/
    └── textures/       # Put your texture images here
    └── models/         # Put your 3D model files here
```

### Your Task ("Fill in the Blanks")

Open your assigned `.js` file (e.g., `SnowSystem.js`). You will see a Class structure. You need to focus on two functions:

1. **`init()`**:

- Create your meshes (Box, Sphere, etc.) and materials here.
- **Crucial:** Don't forget `this.add(yourMesh)` at the end.
- You can refer to existing skeleton code.

2. **`update(time)`**:

- If you want animation (rotation, movement), write logic here.
- `time` is the time in seconds.
- You can refer to existing skeleton code.

---

## 4. How to Submit Your Work (GitHub Workflow)

We are working together on the same repository. To prevent accidents, I have enabled **Branch Protection**.

**⚠️ GOLDEN RULE: You cannot push directly to the `main` branch.**
If you try to `git push origin main`, it will fail. Please follow the steps below.

Some of these operations can also be done through the GUI in VS Code, at the third tab on the left(Source control).

### Step 1: Start of the Day (Sync)

Before you start coding, make sure you have the latest code from everyone else.

```bash
git checkout main      # Go to the main folder
git pull origin main   # Download updates from the cloud
```

### Step 2: Create Your Workspace (Branch)

Create a separate "branch" for your work. Think of this as a "Save Slot" or a copy of the project.

- **Naming convention:** `feature/yourName-task`

```bash
# Example: git checkout -b feature/alex-snow
git checkout -b feature/yourName-task

```

### Step 3: Work & Save (Commit)

Write your code -> Save the file -> Check the browser(Live server).

When you are happy with your progress:

```bash
git add .                          # 1. Select all changes
git commit -m "Added rotation animation to snow"  # 2. Save with a message

```

### Step 4: Upload (Push)

Upload your branch to GitHub.

```bash
git push -u origin feature/yourName-task

```

### Step 5: Merge (Pull Request)When you are done with a feature (or finished for the week):

1. Go to our GitHub Repository page.
2. You will see a yellow banner: **"Compare & pull request"**. Click it.
3. Write a short title describing what you did.
4. Click **Create Pull Request**.
5. **Let me know.** I will review the code and merge it into the main project.

---

## 5. Resources & Help

### Cheat Sheets (Copy-Paste from here!)

**Official Three.js Examples:** [https://threejs.org/examples/](https://threejs.org/examples/)

- _Search for: `geometry`, `material`, `transparency`._
- _Click the `< >` button at the bottom right to see the code._

- **Documentation:** [https://threejs.org/docs/](https://threejs.org/docs/)

### Troubleshooting

**Error: "Push declined" or "Protected branch":** You are trying to push to `main`. Please create a new branch (`Step 2`) and push that instead.

- **Browser Screen is Black:** Check the **Console** (Press F12 -> Console tab). If there is a red error, screenshot it and send it to the group chat.
