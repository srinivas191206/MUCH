<p align="center">
  <img src="public/logo.png" width="130" alt="Much Logo" />
</p>

<h1 align="center">Much</h1>

<p align="center">
  <b>A premium self-hosted AI workspace that unifies all major cloud and local AI providers in a single, privacy-focused interface.</b>
</p>

<p align="center">
  <a href="https://github.com/srinivas191206/MUCH/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-green.svg?style=for-the-badge" alt="License" />
  </a>
  <a href="https://github.com/srinivas191206/MUCH">
    <img src="https://img.shields.io/badge/PRs-WELCOME-blue.svg?style=for-the-badge" alt="PRs Welcome" />
  </a>
  <a href="https://github.com/srinivas191206/MUCH">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-RAILWAY-0B0D0E?style=for-the-badge&logo=railway" alt="Deploy to Railway" />
  </a>
  <a href="https://github.com/srinivas191206/MUCH">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-RENDER-4642b4?style=for-the-badge&logo=render" alt="Deploy to Render" />
  </a>
</p>

---

Beyond a standard chat interface, **Much** provides a lightweight, local-first footprint. While other self-hosted platforms require massive Docker containers for code sandboxes or vector databases, Much runs secure Python calculations and document semantic search directly inside your web browser.

---

## ✨ Features

*   **🖥️ ChatGPT-Inspired Workspace**: A premium interface built with modern glassmorphism, responsive drawers, and global theme triggers.
*   **🧠 Unified Models Hub**: Hot-swap between model providers (Gemini, Groq, OpenRouter, or local Ollama instances) mid-conversation.
*   **🖥️ In-Browser Python Sandbox**: Run Python scripts, analyze dataframes with Pandas, and render interactive Matplotlib plots directly in your browser. Powered by Pyodide WebAssembly.
*   **🪄 Generative UI & Code Artifacts**: Real-time rendering and hot-swapping of React components, static HTML pages, and Mermaid flow diagrams.
*   **🔌 Model Context Protocol (MCP)**: Native edge integration connecting models directly to filesystem paths, databases, and third-party APIs.
*   **📂 Multi-File Batch RAG**: Upload spreadsheets, PDFs, or text documents and calculate cosine similarity embeddings locally for instant context retrieval.
*   **🎨 Image Generation & Editing**: Safe, offline Stable Diffusion XL (SDXL) image generation with progressive loading spinners and permanent URL locking.
*   **👥 Secure Access**: Full-page OAuth2 credentials authentication (Google & GitHub) with session state management.
*   **🔒 Local Privacy Memory**: Conversational memory and credentials encrypted locally and saved to MongoDB.

---

## 🚀 Setup & Execution

### Prerequisites
*   Node.js (v18+)
*   MongoDB (running locally on port 27017)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/srinivas191206/MUCH.git
cd MUCH

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Variables
Create a `server/.env` file with your credentials (this is safely ignored by Git):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/much
JWT_SECRET=your_secret_signature

# Social Login Integrations
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
```

### 3. Start Development Servers
```bash
# Start backend server
npm run server

# Start frontend client
npm run dev
```

---

## 📜 License
Distributed under the MIT License.
