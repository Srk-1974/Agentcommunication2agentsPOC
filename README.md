# 🤖 AI Multi-Agent System (POC)

This repository contains two independent, autonomous AI agents (Agent A and Agent B) that communicate in real-time via WebSockets. The system supports dynamic switching between **OpenAI**, **Gemini**, **Grok**, and **Sarvam**, and includes a built-in **🤖 Mock Mode** for testing without API keys.

---

## 🏗️ Architecture
- **Agent A (Port 3004):** Node.js backend.
- **Agent B (Port 3005):** Node.js backend.
- **Dashboard (Port 5173):** React (Vite) frontend for real-time visualization.
- **WebSocket:** Socket.IO for bidirectional communication between agents and UI.

---

## ⚡ Features
- **Real-time Collaboration:** Watch two agents iterate on tasks together.
- **Multi-LLM Support:** Built-in adapters for major LLM providers.
- **Mock Mode:** Test immediately without any API keys or quota hit.
- **Dynamic Config:** Update LLM providers and API keys directly from the dashboard.
- **Persistent Storage:** Keys saved via the dashboard are automatically persisted to `.env`.

---

## 🚀 Setup & Execution

### 1. Configure Environment
1. Copy `agents/.env.example` to `agents/.env`.
2. (Optional) Fill in your actual LLM API keys.

### 2. Run the Backend Agents
Open two terminals in the `agents` folder:
```bash
# Terminal 1
node agentA.js

# Terminal 2
node agentB.js
```

### 3. Run the Dashboard
Open a terminal in the `dashboard` folder:
```bash
npm install
npm run dev
```

### 4. Start the POC
1. Open your browser to `http://localhost:5173`.
2. Select **🤖 Mock (No API Key)** from the dropdown and click **Save Key**.
3. Type a message in the trigger box (e.g., *"Production database is offline!"*) and click **Send Trigger**.
4. Observe the agents collaborating in real-time!

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, Socket.IO.
- **Frontend:** React, Vite, CSS3 (Glassmorphism, Animations).
- **AI Integrations:** axios-based REST adapters for OpenAI, Gemini, Grok, and Sarvam.
