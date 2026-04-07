const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const dotenv = require('dotenv');
const { callLLM } = require('./llmAdapters');
const crypto = require('crypto');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

dotenv.config();

const PORT = process.env.AGENT_A_PORT || 3000;
const PEER_URL = process.env.AGENT_B_URL || 'http://localhost:3001';
const AGENT_NAME = 'Agent A';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let memory = [];
const processedEventIds = new Set();
let peerSocket = null;

function addMemory(event) {
    memory.push(event);
    if (memory.length > 10) memory.shift();
    // Broadcast to dashboard
    io.emit('dashboard_update', event);
}

function generateEventId() {
    return crypto.randomUUID();
}

async function handleIncomingEvent(event) {
    if (processedEventIds.has(event.event_id)) return;
    processedEventIds.add(event.event_id);
    
    // add to memory
    addMemory(event);

    const provider = process.env.LLM_PROVIDER || 'openai';
    const systemPrompt = `You are an autonomous AI agent (${AGENT_NAME}) communicating with another AI agent.

Analyze the incoming event and recent memory.
Decide:
- Is this event important?
- Should I respond?
- What is the most meaningful response?

Rules:
- Be concise
- Avoid unnecessary replies
- Prevent infinite loops
- Respond only if value is added
- You MUST output ONLY valid JSON format. Example: {"should_respond": true, "response_type": "MESSAGE", "msg": "Understood, proceeding."}
If you should not respond, return {"should_respond": false}`;

    const context = {
        incoming_event: event,
        recent_memory: memory.slice(-3)  // Only last 3 events to save tokens
    };

    // Throttle LLM calls only for real APIs; Mock should be instant
    if (provider !== 'mock') {
        await new Promise(r => setTimeout(r, 5000));
    }


    console.log(`[${AGENT_NAME}] Calling LLM (${provider}) on event from ${event.source}...`);
    const llmResponseText = await callLLM(provider, systemPrompt, context);
    
    if (!llmResponseText) {
        console.log(`[${AGENT_NAME}] LLM call failed or returned empty.`);
        io.emit('dashboard_update', {
            event_id: generateEventId(),
            source: 'System Runtime',
            event_type: 'ERROR',
            payload: { msg: `Error: The LLM (${provider.toUpperCase()}) failed to respond. Check API keys or console logs.` },
            timestamp: new Date().toISOString()
        });
        return;
    }

    let decision;
    try {
        const cleaned = llmResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        decision = JSON.parse(cleaned);
    } catch (e) {
        console.error(`[${AGENT_NAME}] Failed to parse LLM response:`, llmResponseText);
        io.emit('dashboard_update', {
            event_id: generateEventId(),
            source: 'System Runtime',
            event_type: 'ERROR',
            payload: { msg: `Failed to parse LLM JSON: ${llmResponseText.substring(0, 100)}...` },
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (decision && decision.should_respond && decision.msg) {
        const outEvent = {
            event_id: generateEventId(),
            source: AGENT_NAME,
            event_type: decision.response_type || 'MESSAGE',
            payload: { msg: decision.msg },
            timestamp: new Date().toISOString(),
            provider_used: provider
        };
        
        console.log(`[${AGENT_NAME}] Replied:`, decision.msg);
        
        // Wait a slight random delay before sending back to seem natural and prevent race cascades
        setTimeout(() => {
            // we can just add to memory immediately as 'my sent event' 
            addMemory(outEvent);
            if (peerSocket && peerSocket.connected) {
                peerSocket.emit('peer_message', outEvent);
            } else {
                console.log(`[${AGENT_NAME}] Peer not connected, broadcasting via local server...`);
                io.emit('peer_message', outEvent); 
            }
        }, 1000 + Math.random() * 2000);

    } else {
        console.log(`[${AGENT_NAME}] Decided not to respond.`);
    }
}

function connectToPeer() {
    console.log(`[${AGENT_NAME}] Attempting to connect to peer at ${PEER_URL}...`);
    peerSocket = Client(PEER_URL, { reconnection: true, reconnectionDelay: 2000 });
    
    peerSocket.on('connect', () => {
        console.log(`[${AGENT_NAME}] Connected to peer ${PEER_URL}`);
    });
    
    peerSocket.on('peer_dashboard_update', (event) => {
        // PROXY Agent B's events to the dashboard
        io.emit('dashboard_update', event);
    });

    peerSocket.on('peer_message', (event) => {
        handleIncomingEvent(event);
    });
}

connectToPeer();

io.on('connection', (socket) => {
    console.log(`[${AGENT_NAME}] New connection (likely Agent B or Dashboard)`);
    socket.emit('memory_sync', memory);
    
    // Listen for Agent B's dashboard events to proxy them to the UI
    socket.on('peer_dashboard_update', (event) => {
        console.log(`[${AGENT_NAME}] Proxying event from Peer to Dashboard:`, event.source);
        io.emit('dashboard_update', event);
    });

    socket.on('peer_message', (event) => {
        console.log(`[${AGENT_NAME}] Received message from Peer over socket.`);
        handleIncomingEvent(event);
    });
});

app.post('/trigger', (req, res) => {
    const { msg, type } = req.body;
    const provider = process.env.LLM_PROVIDER || 'system';
    const outEvent = {
        event_id: generateEventId(),
        source: `${AGENT_NAME} (Internal Trigger)`,
        event_type: type || 'ALERT',
        payload: { msg: msg || 'Manual trigger' },
        timestamp: new Date().toISOString(),
        provider_used: provider
    };
    
    addMemory(outEvent);
    
    if (peerSocket && peerSocket.connected) {
        peerSocket.emit('peer_message', outEvent);
    } else {
        io.emit('peer_message', outEvent); 
    }
    
    res.json({ success: true, event: outEvent });
});

app.get('/memory', (req, res) => res.json(memory));

app.post('/config', (req, res) => {
    const { provider, apiKey } = req.body;
    if (provider) process.env.LLM_PROVIDER = provider.toLowerCase();
    
    if (apiKey) {
        const p = (provider || process.env.LLM_PROVIDER || 'openai').toLowerCase();
        if (p === 'openai') process.env.OPENAI_API_KEY = apiKey;
        else if (p === 'gemini') process.env.GEMINI_API_KEY = apiKey;
        else if (p === 'grok') process.env.GROK_API_KEY = apiKey;
        else if (p === 'sarvam') process.env.SARVAM_API_KEY = apiKey;

        // Persist to .env file so it survives restarts
        try {
            const envPath = path.join(__dirname, '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');
            const keyName = p === 'openai' ? 'OPENAI_API_KEY' :
                            p === 'gemini' ? 'GEMINI_API_KEY' :
                            p === 'grok' ? 'GROK_API_KEY' : 'SARVAM_API_KEY';
            // Update the key line and provider line
            envContent = envContent.replace(/^LLM_PROVIDER=.*/m, `LLM_PROVIDER=${p}`);
            envContent = envContent.replace(new RegExp(`^${keyName}=.*`, 'm'), `${keyName}=${apiKey}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log(`[${AGENT_NAME}] Saved ${keyName} to .env file.`);
        } catch (err) {
            console.error(`[${AGENT_NAME}] Failed to write .env:`, err.message);
        }
    }
    console.log(`[${AGENT_NAME}] Runtime Config Updated: Provider=${provider}`);
    res.json({ success: true });
});

server.listen(PORT, () => {
    console.log(`[${AGENT_NAME}] Server running on port ${PORT}`);
});
