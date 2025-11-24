<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1R10sHTriX92WcSdUFALnCSQaWvg8jSKH

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# 🛠️ Technical Stack

This document outlines the modern full-stack architecture used in the **DistilledChild** portfolio project. The application combines high-performance frontend rendering with real-time backend capabilities.

## 💻 Core Technologies

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Language** | **TypeScript** | Provides static typing for enhanced code reliability and developer experience. (Node.js backend uses JavaScript). |
| **Frontend** | **React + Vite** | Utilizes Vite for lightning-fast builds and HMR, powering a modern React application. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework for rapid, consistent, and responsive UI development. |
| **3D Graphics** | **Three.js (R3F)** | Implements the interactive 3D DNA double-helix visualization using `@react-three/fiber`. |
| **Data Viz** | **Recharts** | React-based composable charting library used for the Research page visualizations. |
| **Backend** | **Node.js + Socket.io** | Custom server handling real-time bidirectional communication for the chat feature. |

## ☁️ Infrastructure & Deployment

The application employs a decoupled architecture for optimal performance and cost-efficiency.

### 1. Frontend Hosting: [Vercel](https://vercel.com)
- **Role**: Hosts the static assets and React application.
- **Domain**: `distilledchild.space`
- **Why Vercel**: Optimized for React/Vite, providing global CDN distribution and automatic deployments via GitHub integration.

### 2. Backend Hosting: [Railway](https://railway.app)
- **Role**: Hosts the persistent Node.js server for Socket.io.
- **Why Railway**: Unlike serverless functions (which sleep), Railway provides a persistent environment required for maintaining active WebSocket connections for the real-time chat queue system.

## 🎨 Design System

- **Core**: Built on **Tailwind CSS** with a custom color palette (`pastel-green`, `pastel-blue`, etc.) to match the brand identity.
- **Animations**:
  - **Native CSS Keyframes**: Used for lightweight, performant animations (e.g., blinking text, modal transitions) instead of heavy libraries like Framer Motion.
  - **Glassmorphism**: Applied semi-transparent, blurred backgrounds to UI elements like the chat interface and cards.
- **Icons**: **Lucide React** for clean, consistent, and lightweight SVG icons.

---
*This project demonstrates a blend of domain expertise in Computational Biology (Data Visualization) with modern Web Engineering (3D Graphics, Real-time Systems).*
