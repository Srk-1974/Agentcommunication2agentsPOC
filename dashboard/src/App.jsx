import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [inputText, setInputText] = useState('');
  const [provider, setProvider] = useState('mock');
  const [apiKey, setApiKey] = useState('demo-mode');
  const [backendUrl, setBackendUrl] = useState('https://agentcommunication2agentspoc.onrender.com');
  const [agentStatuses, setAgentStatuses] = useState({});
  const [targetAgent, setTargetAgent] = useState('Agent A');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Gateway connection (Agent A)
    const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
    const socket = io(urlA);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    socket.on('dashboard_update', (event) => {
      setMessages(prev => {
        if (prev.find(m => m.event_id === event.event_id)) return prev;
        return [...prev, event].slice(-30);
      });
      scrollToBottom();
    });

    socket.on('agent_status', (data) => {
      setAgentStatuses(prev => ({
        ...prev,
        [data.agent]: data
      }));
    });

    socket.on('memory_sync', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    return () => socket.disconnect();
  }, [backendUrl]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSaveConfig = async () => {
    try {
      const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
      const res = await fetch(`${urlA}/config`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ provider, apiKey, target: targetAgent }) 
      });
      const data = await res.json();
      if (data.success) {
         alert(`Saved ${provider} config for ${targetAgent}`);
      } else {
         alert(`Error: ${data.error || 'Failed to save'}`);
      }
    } catch (err) {
      console.error('Config error:', err);
      alert('Network error connecting to gateway.');
    }
  };

  const handleTrigger = async () => {
    if (!inputText.trim()) return;
    const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
    try {
      await fetch(`${urlA}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: inputText, type: 'USER_INPUT', target: targetAgent })
      });
      setInputText('');
    } catch (err) {
      console.error('Trigger error:', err);
    }
  };

  const handleReset = async () => {
    const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
    try {
      await fetch(`${urlA}/memory`, { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'both' }) // Clear everything
      });
      setMessages([]);
      alert('System Memory Purged. Collaboration halted.');
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#60a5fa'}}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          WAR ROOM <span style={{opacity: 0.4, fontWeight: 300, marginLeft: '0.5rem'}}>v1.2</span>
        </h1>
        <div className="status-summary">
          <div className="status-item">
            <span className={`dot ${connected ? 'live' : ''}`} style={{background: connected ? '' : '#ef4444'}}></span>
            Gateway {connected ? 'Live' : 'Offline'}
          </div>
          <div className="status-item">
            <span className="dot live" style={{background: '#3b82f6'}}></span>
            Agent A: {agentStatuses['Agent A']?.status || 'IDLE'}
          </div>
          <div className="status-item">
            <span className="dot live" style={{background: '#10b981'}}></span>
            Agent B: {agentStatuses['Agent B']?.status || 'IDLE'}
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="config-panel">
          <div className="config-section">
            <h3>Target Control</h3>
            <div className="radio-group">
              <div className={`radio-item ${targetAgent === 'Agent A' ? 'active' : ''}`} onClick={() => setTargetAgent('Agent A')}>
                <div style={{height: '10px', width: '10px', borderRadius: '50%', background: '#3b82f6'}}></div>
                Agent A (Architect)
              </div>
              <div className={`radio-item ${targetAgent === 'Agent B' ? 'active' : ''}`} onClick={() => setTargetAgent('Agent B')}>
                <div style={{height: '10px', width: '10px', borderRadius: '50%', background: '#10b981'}}></div>
                Agent B (SRE Unit)
              </div>
            </div>
          </div>

          <div className="config-section">
            <h3>Model Provider</h3>
            <select className="input-styled" value={provider} onChange={e => setProvider(e.target.value)}>
              <option value="mock">🤖 Mock Engine</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="gemini">Google Gemini 2.0</option>
              <option value="grok">xAI Grok-2</option>
              <option value="sarvam">Sarvam AI</option>
            </select>
            <input type="password" placeholder="API Key..." className="input-styled" value={apiKey} onChange={e => setApiKey(e.target.value)} />
          </div>

          <div className="config-section">
            <h3>Gateway Endpoint</h3>
            <input type="text" className="input-styled" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} />
          </div>
          <button className="btn-save" style={{background: '#64748b', marginTop: '1rem'}} onClick={handleReset}>RESET OPS</button>
          <button className="btn-save" onClick={handleSaveConfig}>Sync Unit Config</button>
        </aside>

        <section className="chat-viewport">
          <div className="messages">
            {messages.length === 0 && (
              <div className="message-card system">
                <div className="msg-body" style={{textAlign: 'center', opacity: 0.6}}>Waiting for system frequency synchronization...</div>
              </div>
            )}
            
            {messages.map((m) => (
              <div key={m.event_id} className={`message-card ${m.source === 'Agent A' ? 'agent-a' : m.source === 'Agent B' ? 'agent-b' : 'system'}`}>
                <div className="msg-header">
                  <span>{m.source}</span>
                  {m.provider_used && <span className="msg-badge">{m.provider_used}</span>}
                </div>
                <div className="msg-body">{m.payload?.msg || JSON.stringify(m.payload)}</div>
                <div className="msg-footer">{formatTime(m.timestamp)}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          {(agentStatuses['Agent A']?.status === 'THINKING' || agentStatuses['Agent B']?.status === 'THINKING') && (
            <div className="thinking-overlay">
              <span className="thinking-dots">
                Secure link active. Agent {agentStatuses['Agent A']?.status === 'THINKING' ? 'A' : 'B'} is processing via {agentStatuses['Agent A']?.status === 'THINKING' ? agentStatuses['Agent A']?.provider : agentStatuses['Agent B']?.provider}
              </span>
            </div>
          )}
        </section>
      </div>

      <footer className="control-bar">
        <div className="trigger-wrapper">
          <input 
            type="text" 
            placeholder={`Instruct ${targetAgent}...`} 
            className="input-trigger" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrigger()}
          />
        </div>
        <button className="btn-trigger" onClick={handleTrigger}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          EXECUTE
        </button>
      </footer>
    </div>
  );
}

export default App;
