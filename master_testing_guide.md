# 🛡️ Master Testing & Operations Guide (War Room v1.2)

This guide provides a step-by-step master list of commands for testing the **AI War Room** locally and in production.

---

## 1. Environment Setup
Prepare the cluster for a fresh deployment.

```powershell
# Dashboard (Frontend) Initialization
cd "e:\Anti_gravity\twoagents_different applicationtalk each other\dashboard"
npm install
npm run dev # Dashboard live on http://localhost:5173

# Agent Cluster (Backend) Initialization
cd "e:\Anti_gravity\twoagents_different applicationtalk each other\agents"
npm install
node index.js # Gateway live on http://localhost:3004
```

---

## 2. Configuration & Initialization Commands
Always verify that the agents are synced correctly.

### **Initialize Agents in Mock Mode (No Key Required)**
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/config `
  -ContentType "application/json" `
  -Body '{"provider":"mock", "apiKey":"NONE", "target":"both"}'
```

---

## 3. Core Functional Test Commands
The following commands drive the interaction loop between the Architect (Agent A) and the SRE (Agent B).

### **Trigger Strategic Collaboration (Start Interaction)**
This command initiates the Agent A <-> Agent B thought stream.
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/trigger `
  -ContentType "application/json" `
  -Body '{"msg":"Architect, run a diagnostic sweep on the Kubernetes cluster.", "type":"USER_INPUT"}'
```

### **Target Agent B Directly (Proxy Check)**
Verify that Agent A correctly proxies messages meant for Agent B.
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/trigger `
  -ContentType "application/json" `
  -Body '{"msg":"SRE Unit, increase logging verbosity on the API server.", "target":"Agent B"}'
```

---

## 4. Stability & Kill Switch Commands
Prevent infinite loops and reset the system for a new run.

### **Global System Reset**
Instantly clears distributed memory and stops the chatter.
```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3004/memory `
  -ContentType "application/json" `
  -Body '{"target":"both"}'
```

---

## 5. Verification Commands (For QA/Testers)
Track internal state without the dashboard.

### **Memory Health Check**
Check the distributed memory length and current providers.
```powershell
Invoke-RestMethod -Uri http://localhost:3004/
```

---

> [!IMPORTANT]
> **Production vs. Local**: If you are testing the live site at `https://agentcommunication2agents-poc.vercel.app/`, you can use the dashboard's UI buttons (Sync, RESET OPS, EXECUTE) which perform these exact JSON payloads under the hood.
