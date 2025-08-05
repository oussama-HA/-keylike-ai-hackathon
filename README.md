# Keylike AI - Keyed-Alike & Duplication Risk Detector

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-5.5-green.svg)](https://capacitorjs.com/)
[![Lit](https://img.shields.io/badge/Lit-3.1-orange.svg)](https://lit.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)

**A privacy-first, offline-capable Progressive Web Application for advanced lock security assessment.**

Keylike AI is a powerful tool that puts a security expert in your pocket. By taking a picture of a lock, you can get an instant, AI-powered analysis of its potential vulnerabilities, with a specific focus on **keyed-alike and duplication risks**. Our application is built with a "privacy-first" philosophy, meaning all analysis happens on your device, and your data is never sent to the cloud.

This project is a submission for the Google Gemma 3n Hackathon, showcasing how powerful AI models can be deployed in a way that respects user privacy and provides tangible, real-world value.

## 📖 User Guide

### Installation
Keylike AI is a Progressive Web App (PWA). To install it:
1.  Open the Keylike AI website in a compatible browser (Chrome, Safari, Firefox).
2.  Look for an "Install" button or an "Add to Home Screen" option in your browser's menu.
3.  Follow the prompts to add the app to your device.

### How to Scan a Lock
1.  **Open the App** and navigate to the scanner.
2.  **Position the Lock**: Center the lock's keyway in the camera frame. Ensure good lighting and focus.
3.  **Capture the Image**: Tap the shutter button.
4.  **Get Your Results**: The app will instantly analyze the image on your device and provide a risk report.

### Understanding Your Results
-   **Duplication Risk Score (0-100)**: A simple score to help you quickly understand the assessed risk of the key being easily duplicated or part of a keyed-alike system. A higher score means a higher risk.
-   **Keyway Identification**: The AI identifies the type of keyway (e.g., SC1, KW1), which is a primary factor in its security and duplication probability.
-   **Vulnerability Report**: Lists potential weaknesses related to mass manufacturing and keyway frequency.
-   **Actionable Recommendations**: Provides clear, prioritized steps you can take to improve your security.

## 🛡️ Privacy-First Design

Privacy is a foundational principle of our architecture.
-   **On-Device Processing**: All sensitive data (images, scan results) is processed and stored locally on your device. Nothing is sent to external servers.
-   **Data Encryption**: All stored data is encrypted at rest using the **Web Crypto API** with the `AES-GCM` algorithm.
-   **Location Anonymization**: We use **geohashing** to store an obfuscated, non-precise location for context, protecting your exact coordinates.
-   **No User Accounts**: The app does not require any form of registration or login.
-   **User Control**: You have full control over your data and can delete it at any time.

## 🛠️ Core Technologies

-   **Stack**: PWA + Capacitor + Lit.dev + TypeScript + TensorFlow.js
-   **AI Model**: Google's **Gemma 3n**, quantized for efficient on-device execution. The architecture supports dynamic switching between different model sizes based on device capability.
-   **UI**: Built with **Lit.dev** for a fast, lightweight, and standards-based component model.
-   **Native Access**: **Capacitor** provides access to native mobile features like the camera from a single web-based codebase.
-   **Offline Storage**: Encrypted data is stored locally in **IndexedDB**, managed by a robust storage service.
-   **Build System**: **Vite** is used for a fast development experience and optimized production builds, including code-splitting and PWA generation.

## 📊 Project Status & Next Steps

**Overall Status: Infrastructure Complete, Awaiting Final Model Integration**

The application's core infrastructure is production-ready. The primary remaining task is to integrate the final, trained **Gemma 3n model**.

### Critical Next Steps:
1.  **Gemma 3n Model Integration**: Place the final `model.json` and weight files into the `public/models/` directory.
2.  **Replace Placeholder Logic**: Update the `ModelService` to use the real model's `predict()` method instead of the current simulation.
3.  **Refactor for Duplication Risk**: Pivot the `RiskAssessmentService` and its database (`duplicationRiskDB`) entirely to focus on keyed-alike and duplication risk analysis, removing logic for general vulnerabilities like picking or bumping.
4.  **Final Testing**: Benchmark performance to ensure inference time is under 2 seconds and memory usage is below 200MB on target devices.

## 🔄 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build for mobile
npm run cap:build

# Open in Android Studio
npm run cap:android
```

## 📱 Mobile Development

This app is built with Capacitor for cross-platform mobile deployment:

```bash
# Add platforms
npm run cap:add:android
npm run cap:add:ios

# Sync native projects
npm run cap:sync

# Open native IDEs
npm run cap:android  # Android Studio
npm run cap:ios      # Xcode
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.