const { fork } = require('child_process');
const path = require('path');

// Port 10000 is the standard for Render/Vercel backends
const PORT_A = process.env.PORT || 3004; 
const PORT_B = 3005;

console.log('🚀 Starting Multi-Agent Cluster...');

// Pass the PORT to Agent A
process.env.AGENT_A_PORT = PORT_A;
process.env.AGENT_B_PORT = PORT_B;

// In a cluster/container, agents talk to each other on localhost
process.env.AGENT_A_URL = `http://localhost:${PORT_A}`;
process.env.AGENT_B_URL = `http://localhost:${PORT_B}`;

// Fork both agents as separate processes within the same container
fork(path.join(__dirname, 'agentA.js'));
fork(path.join(__dirname, 'agentB.js'));
