# 🎭 The War Room: Live Demo Script

Use these 4 commands in order for a perfect live demonstration of the multi-agent collaboration.

---

### **1. 🚀 BOOT-UP (The Deployment)**
Opens the Architect Gateway and initializes the SRE tactical unit.
```powershell
cd "e:\Anti_gravity\twoagents_different applicationtalk each other\agents"; node index.js
```

---

### **2. 🤖 MOCK-SYNC (The Calibration)**
Instantly puts both agents into "Mock Mode" for a 100% successful demo without needing API keys.
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/config `
  -ContentType "application/json" `
  -Body '{"provider":"mock", "apiKey":"NONE", "target":"both"}'
```

---

### **3. 🌩️ TRIGGER THE MISSION (The Collaboration)**
This command initiates the Architect <-> Agent B collaborative thought stream. 
*   **Watch for**: Agent A's thought bubbles, followed by Agent B's tactical response.
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/trigger `
  -ContentType "application/json" `
  -Body '{"msg":"Architect, we see a massive load spike on the database cluster. Analyze the root cause and coordinate with Agent B to stabilize. Now!", "type":"USER_INPUT"}'
```

---

### **4. 🛑 RESET OPS (The Kill Switch)**
Shows how you can instantly halt and clear the agents' shared memory.
```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3004/memory `
  -ContentType "application/json" `
  -Body '{"target":"both"}'
```
