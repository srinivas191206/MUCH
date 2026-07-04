# Much 🌌 — The Local-First Developer's AI Workspace

A professional-grade, privacy-focused AI workspace that unifies cloud and local models inside a single, premium web interface. 

While platforms like **LibreChat** require heavy server-side Docker containers to run agent tools and code execution, **Much** is engineered for a **local-first, lightweight footprint**—running secure code interpretation, vector calculations, and database integrations directly inside the client context.

---

## 🆚 Much vs. LibreChat: Core Comparison

| Feature | Much (Our App) | LibreChat |
| :--- | :--- | :--- |
| **Model Hosting** | Cloud (Gemini, Groq, OpenRouter) & Local (Ollama) | Cloud (OpenAI, Anthropic, Bedrock) & Local (Ollama, llama.cpp) |
| **Code Interpreter** | **Local-First Wasm**: Runs Python, Pandas, and Matplotlib inside your browser (Pyodide) with zero server load. | **Server-Side**: Requires external Docker containers, sandboxes, and databases (ClickHouse). |
| **Image Generation** | Stable Diffusion XL (Keyless & Free option) + DALL-E 3 (Paid option). | DALL-E 3 (Paid only) or custom MCP server configurations. |
| **Vector RAG** | **Local Embeddings**: Files (PDFs, CSVs, TXT) are read and searched locally using browser-based vector matching. | **Server-Side**: Requires hosting an external RAG API container. |
| **Integrations** | Native Model Context Protocol (MCP) clients for databases and filesystems. | Advanced MCP support, presets, and customized prompt libraries. |
| **Interface** | Sleek modern bento layout with sun/moon theme triggers. | Standard ChatGPT-style interface with customizable dropdowns. |

---

## 🎨 Feature Summary

### 🧠 Unified Models Hub
Hot-swap between model providers (Gemini 2.5 Flash, Llama 3.3, DeepSeek R1, or local Ollama instances) mid-conversation. Adjust parameters like Temperature, Top P, and Max Tokens live inside the parameters panel.

### 🖥️ In-Browser Python Sandbox
Write and run Python scripts securely. The integrated Pyodide compiler loads `numpy`, `pandas`, and captures `matplotlib` figures directly in the chat preview panel—running completely offline in WebAssembly.

### 🪄 Generative UI & Artifacts
Build and run live React components, static HTML pages, and Mermaid flow diagrams side-by-side. Code in the chat window, compile instantly in the preview panel, and copy cleaner files with one click.

### 🔌 MCP Ecosystem
Connect models directly to local SQLite databases, filesystem paths, and Git repositories using standard Model Context Protocol servers.

### 📂 Multi-File Batch RAG
Drag-and-drop spreadsheets, PDFs, or JSON files. Much indexes documents locally to find the most relevant context blocks before injecting them into prompts.

### 🔒 Privacy-First Database
User settings, key overrides, and chat histories are saved locally inside your private MongoDB instance, ensuring your conversations are never read by third-party database brokers.

---

## 🚀 Setup & Execution

### Prerequisites
*   Node.js (v18+)
*   MongoDB (running locally on port 27017)

### 1. Installation
Clone the repository and install the dependencies:
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
