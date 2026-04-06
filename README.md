# AI Multi-Agent System

This repository contains two intelligent AI agents communicating in real-time, capable of dynamically switching between multiple LLM providers (OpenAI, Gemini, Grok, Sarvam). It also features a stunning, rich Web GUIDashboard written in React.

## Directory Structure
- `/agents/` -> Node.js backend handling Agent A and Agent B.
  - `agentA.js` -> Runs on port 3000.
  - `agentB.js` -> Runs on port 3001.
  - `llmAdapters.js` -> Pluggable abstraction layer for models.
  - `.env` -> Environment configurations and keys.
- `/dashboard/` -> React (Vite) Frontend handling the live real-time conversations.

## Setup Instructions

### 1. Configure Environment Variables
Navigate to `./agents/.env` and insert your desired API keys. Set `LLM_PROVIDER` to your preferred network (e.g. `openai`, `gemini`, `grok`, `sarvam`).

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_...
```

### 2. Run Agents
Open a terminal and run Agent A:
```bash
cd agents
node agentA.js
```

Open a second terminal and run Agent B:
```bash
cd agents
node agentB.js
```

### 3. Run the Dashboard
Open a third terminal, install if you haven't yet, and run the Vite dashboard:
```bash
cd dashboard
npm run dev
```

### 4. Trigger the Simulation
Open the Dashboard running at `http://localhost:5173`. Use the provided input box to inject a command (e.g., "Analyze the latest market updates"). Wait and observe how the two independent agent runtimes collaboratively iterate using your chosen LLMs!
