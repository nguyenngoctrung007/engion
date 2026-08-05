# 🚀 Engion - Modern English Tray Learner & Anki Deck Player

<p align="center">
  <img src="public/icon.png" width="96" height="96" alt="Engion Logo" />
</p>

<p align="center">
  <strong>Lightweight, High-Performance Desktop Tray Application for Micro-Learning Vocabulary & Playing Anki Decks</strong>
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License MIT"></a>
  <a href="https://electronjs.org"><img src="https://img.shields.io/badge/Electron-30+-47848F?logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white" alt="Vite"></a>
</p>

---

## 📌 Overview

**Engion** is a modern, non-intrusive desktop application built with Electron, React, and TypeScript. Designed for continuous language acquisition without interrupting your workflow, Engion sits silently in your **Windows System Tray** and periodically triggers floating micro-learning popups (Flashcards, Fill-in-the-blank, Multiple Choice Quizzes).

It features a **Pure Client-Side Anki Package (`.apkg`) Importer**, allowing you to load thousands of vocabulary cards from AnkiWeb directly in memory with instant preview and custom deck organization.

---

## ✨ Key Features

### 🔔 1. System Tray & Floating Micro-Popups
- **Live Tooltip Countdown**: Hovering over the tray icon displays real-time countdown to your next review session.
- **Minimize-to-Tray**: Minimizing (`_`) or closing (`X`) the main window hides it directly to the system tray.
- **Global Hotkeys**: Press `Alt + E` or `Ctrl + Shift + E` anytime to trigger instant review sessions.
- **Dual Mode Architecture**: Non-blocking popup window with continuous session counters (`🔥 Learnt 5 words`).

### 🎴 2. Direct Anki Package (`.apkg`) Importer & Player
- **100% In-Memory Parsing**: Powered by `JSZip` for instantaneous parsing of Anki SQLite databases without temporary file pollution.
- **Smart Field Detector**: Automatically extracts English words, IPA phonetics, parts of speech, Vietnamese definitions, and example sentences across different Anki field structures.
- **Import Preview Modal**: Inspect sample cards, preview word counts, and customize deck names before finalizing import.

### 🤖 3. Smart Dictionary, Translation & Speech Recognition
- **Auto Lookup**: 1-click auto-fill for IPA phonetics, part of speech, Vietnamese translations (Google Translate Engine), and example sentences.
- **🎙️ Pronunciation Evaluator**: Integrated Web Speech Recognition API evaluates your spoken pronunciation in real time with visual feedback (`✅ Correct` or `❌ Try Again`).

### ⚡ 4. High-Performance Pagination Engine
- **Butter-Smooth 60fps**: Pagination engine renders 24/48/96 cards per page, allowing smooth navigation across 5,000+ vocabulary items without DOM lag.

### 🛠️ 5. Flexible Deck & Data Management
- **Universal Deletion**: Delete any card or custom/preset deck with 1-click.
- **Inline Editing**: Quick-edit any word, phonetic, definition, or example directly inside the floating popup card or dashboard.
- **2-Mode Data Reset**: Reset to clean default presets or clean everything for a completely fresh 0-word starting slate.
- **Anki CSV Export**: Export starred favorites or full vocabulary banks to UTF-8 `.csv` format compatible with Anki and Quizlet.

---

## 🛠️ Technology Stack

- **Core**: Electron, React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with modern Glassmorphism, tailored Dark Theme, and CSS tokens
- **Parsing & Archiving**: `JSZip`, SQLite Anki Database Extractor
- **Icons**: Lucide React
- **Browser APIs**: Web Speech API, Web Audio API, Speech Synthesis

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation & Local Development

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/engion.git
   cd engion
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build Production Executable**:
   ```bash
   npm run build
   ```

---

## 📚 Project Documentation

Detailed architectural and developer guides are available in the `docs/` folder:
- 📖 [FEATURES.md](docs/FEATURES.md): Complete list of business logic and UI capabilities.
- 🏗️ [ARCHITECTURE.md](docs/ARCHITECTURE.md): Electron IPC bridge, window management, and state flow.
- 🛠️ [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md): Developer environment setup and build scripts.
- 📜 [RULES.md](docs/RULES.md): Coding guidelines and quality standards.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
