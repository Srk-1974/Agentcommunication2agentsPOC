# 🧪 War Room: QA & Tester Protocol

This protocol outlines the essential tests for verifying the distributed multi-agent system.

---

## 1. Zero-Initial State Check
Verify that the system starts in a clean "IDLE" state before any interaction.

```powershell
# Verify Gateway is reachable & memory is empty
$resp = Invoke-RestMethod -Uri http://localhost:3004/
if ($resp.memory.count -eq 0) { Write-Host "✅ Zero-State Verified" }
```

---

## 2. Distributed Communication Test (The Handshake)
Confirm that Agent A can successfully relay a command to Agent B and that Agent B replies back through the proxy.

*   **Step**: Send a trigger to Agent A targeting Agent B.
*   **Command**:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/trigger `
  -ContentType "application/json" `
  -Body '{"msg":"Ping Agent B via Gateway", "target":"Agent B"}'
```
*   **Success Metric**: The dashboard shows a message from **Agent A** followed by a response from **Agent B** within 5 seconds.

---

## 3. Negative Testing: Error Transparency
Verify that Agent B's internal failures are correctly proxied and displayed on the dashboard.

*   **Step**: Set Agent B to an invalid provider key.
*   **Command**:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3004/config `
  -ContentType "application/json" `
  -Body '{"provider":"openai", "apiKey":"INVALID_KEY", "target":"Agent B"}'
```
*   **Trigger**: Send any message to Agent B.
*   **Success Metric**: The dashboard displays a red **"ERROR"** card with the message: `"Incorrect API key provided"`.

---

## 4. Concurrency & Loop Stress Test
Test the system's ability to handle rapid triggers and prevent infinite loops.

*   **Step**: Send 3 triggers in rapid succession (under 2 seconds).
```powershell
1..3 | ForEach-Object { 
  Invoke-RestMethod -Method Post -Uri http://localhost:3004/trigger `
    -ContentType "application/json" `
    -Body '{"msg":"Stress Trigger $_", "type":"USER_INPUT"}' 
}
```
*   **Success Metric**: The agents should process all 3 unique IDs correctly without crashing and should **stop** talking after 5-6 total responses (due to the Loop Breaker logic).

---

## 5. Persistence & Sync Test
Verify that the dashboard and agents stay in sync after a refresh.

*   **Step**: Click **RESET OPS** in the UI.
*   **Command (Verification)**:
```powershell
Invoke-RestMethod -Uri http://localhost:3004/
```
*   **Success Metric**: The JSON response `memory` field should be `[]` (empty array).
