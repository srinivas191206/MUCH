# Much 🌌

A professional-grade, local-first AI workspace featuring sandboxed WebAssembly execution, multi-model hot-swapping, vector RAG pipelines, and Model Context Protocol (MCP) integrations.

![Much Preview Workspace](src/assets/preview.png)

---

## Key Features

*   🧠 **Unified Models Hub**: Hot-swap between Gemini, Groq, OpenRouter, and local Ollama models in a single conversation thread.
*   🖥️ **Pyodide Wasm Sandbox**: Run Python scripts, analyze dataframes with Pandas, and render interactive Matplotlib plots directly in your browser.
*   📦 **Live Coding Artifacts**: Real-time rendering of React widgets, HTML pages, and Mermaid flow diagrams.
*   🔌 **Model Context Protocol (MCP)**: Native edge integration connecting models directly to filesystem paths, databases, and third-party APIs.
*   📂 **Semantic Batch RAG**: Upload multiple files (PDFs, CSVs, TXT) for parallel local cosine-similarity vector queries.
*   🔒 **Local Privacy Memory**: Encrypted settings and chat history stored securely in your local MongoDB instance.
*   🎨 **Sleek Bento Design**: Gorgeous, glassmorphic bento-grid feature console with adaptive light and dark themes.

---

## Tech Stack

*   **Frontend**: React (Vite), React Router, Lucide Icons, Pyodide Wasm
*   **Styling**: Vanilla CSS, Glassmorphic Design Tokens
*   **Backend**: Node.js, Express, MongoDB

---

## Quickstart Setup

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/) installed and running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/much.git
cd much
```

### 2. Install Dependencies
Install packages for both the client application and backend server:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory:
```bash
touch server/.env
```
Add your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/much
JWT_SECRET=YOUR_SUPER_SECRET_KEY

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret
```

### 4. Run Locally
Start the server and frontend dashboard concurrently:
```bash
# Start backend server (runs on port 5000)
npm run server

# Start frontend dashboard (runs on port 5173)
npm run dev
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
