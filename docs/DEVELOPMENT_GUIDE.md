# Engion - Developer Guide & Onboarding

Welcome to the **Engion** developer guide! This document provides instructions on how to set up, run, build, and extend the project.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **OS**: Windows 10/11 (or macOS / Linux)

### Installation
```bash
# 1. Clone repository
git clone <repo-url>
cd engion

# 2. Install dependencies
npm install
```

---

## 🚀 Running Locally

```bash
npm run dev
```

This starts the Vite dev server for React and launches Electron concurrently:
- Renderer Vite Dev Server: `http://localhost:5173`
- Electron Main Process: automatically connects to Vite dev server and opens System Tray + Dashboard.

---

## 📦 Building & Production Release

### 1. Compile & Build Dist
```bash
npm run build
```
Executes:
1. `node scripts/create-icon.js`: Generates `icon.png` (32x32)
2. `tsc`: Type-checks TypeScript code
3. `vite build`: Bundles React frontend into `dist/` and Electron scripts into `dist-electron/`

### 2. Package Executable Installer (Electron Builder)
```bash
npm run dist
# Hoặc: npx electron-builder
```
Tự động biên dịch mã nguồn và đóng gói thành file cài đặt Windows (`Engion Setup 1.0.0.exe`) hoặc bản chạy ngay (`Engion 1.0.0.exe` portable) nằm trong thư mục `dist_electron/`.

Người dùng trên máy khác chỉ cần tải file `.exe` này về nhấp đúp để cài đặt/chạy mà **không cần cài Node.js, npm hay VSCode**.

---

## 📜 Key Engineering Guidelines & Architectural Safeguards

1. **Popup Window Layout Protection**:
   - The popup window is created at 440x500px.
   - `App.tsx` guards popup mode using dimension locks (`innerWidth <= 550 && innerHeight <= 600`) and URL query/hash parameters (`mode=popup#popup`).
   - **DO NOT** remove this guard to prevent full Dashboard rendering inside small popups.

2. **Non-Blocking UI Notifications**:
   - All success & error notifications in Settings & Modal forms MUST use `position: fixed` floating toasts or inline non-blocking error elements.
   - **DO NOT** use browser `alert()` or inline block elements that cause layout shifts.

3. **Win32 Click Reactivity**:
   - Floating popups use `onMouseDown` handlers on close buttons alongside `onClick` to prevent Win32 focus-swallowing click delays.

4. **IPC Security**:
   - `contextIsolation: true` and `nodeIntegration: false` are enforced in `webPreferences`.
   - All Main <-> Renderer communication must pass through `electron/preload.js` context bridge.
