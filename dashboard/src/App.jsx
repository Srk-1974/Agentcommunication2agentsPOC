import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [messages, setMessages] = useState([]);
  const [connectedA, setConnectedA] = useState(false);
  const [inputText, setInputText] = useState('');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('https://agentcommunication2agentspoc.onrender.com');
  const [activeProvider, setActiveProvider] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Single Gateway Architecture: Only talk to Agent A
    const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
    const socketA = io(urlA);

    socketA.on('connect', () => {
      console.log('Connected to Gateway (Agent A)');
      setConnectedA(true);
    });

    socketA.on('disconnect', () => setConnectedA(false));
    
    socketA.on('dashboard_update', (event) => {
      console.log('Received cloud update:', event);
      setMessages(prev => {
        if (prev.find(m => m.event_id === event.event_id)) return prev;
        return [...prev, event].slice(-20);
      });
      scrollToBottom();
    });

    socketA.on('memory_sync', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    return () => {
      socketA.disconnect();
    };
  }, [backendUrl]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) return;
    try {
      const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;
      const urlB = backendUrl.includes('localhost') ? `${backendUrl}:3005` : backendUrl;

      await Promise.all([
        fetch(`${urlA}/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey }) }),
        fetch(`${urlB}/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey }) })
      ]);
      setActiveProvider(provider);
      alert(`Successfully saved ${provider} API Key!`);
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('Failed to update agent configuration. Check console.');
    }
  };

  const handleTrigger = async () => {
    if (!inputText.trim()) return;
    
    const urlA = backendUrl.includes('localhost') ? `${backendUrl}:3004` : backendUrl;

    try {
      await fetch(`${urlA}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: inputText, type: 'USER_INPUT' })
      });
      setInputText('');
      scrollToBottom();
    } catch (err) {
      console.error('Failed to trigger agent:', err);
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Dynamic Agents</h1>
        <div className="status-indicators" style={{alignItems: 'center'}}>
          <select 
            value={provider} 
            onChange={e => setProvider(e.target.value)} 
            className="input-field" 
            style={{padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', marginRight: '0.5rem', width: 'auto'}}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="grok">Grok</option>
            <option value="sarvam">Sarvam</option>
            <option value="mock">🤖 Mock (No API Key)</option>
          </select>
          <input 
            type="password" 
            placeholder="API Key..." 
            className="input-field" 
            style={{padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', marginRight: '0.5rem', width: '150px'}}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="http://localhost" 
            className="input-field" 
            style={{padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', marginRight: '0.5rem', width: '150px'}}
            value={backendUrl}
            onChange={e => setBackendUrl(e.target.value)}
          />
          <button className="btn btn-primary" style={{padding: '0.4rem 1rem'}} onClick={handleSaveConfig}>Save Key</button>

          <div className="status-badge" style={{marginLeft: '1rem'}}>
            <span className={`dot ${connectedA ? 'connected' : 'disconnected'}`}></span>
            System Live {activeProvider && <span style={{opacity: 0.8, marginLeft: '4px'}}>| Mode: {activeProvider.toUpperCase()}</span>}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="chat-container">
          {messages.length === 0 && (
            <div className="message-wrapper system">
              <div className="message-bubble">Waiting for events...</div>
            </div>
          )}
          
          {messages.map((msg) => {
            const isA = msg.source === 'Agent A';
            const isB = msg.source === 'Agent B';
            const wrapperClass = isA ? 'agent-a' : isB ? 'agent-b' : 'system';
            
            return (
              <div key={msg.event_id} className={`message-wrapper ${wrapperClass}`}>
                <div className="message-header">
                  <span className="agent-name">{msg.source}</span>
                  {msg.provider_used && (
                    <span className="provider-badge">{msg.provider_used}</span>
                  )}
                </div>
                <div className="message-bubble">
                  {msg.payload?.msg || JSON.stringify(msg.payload)}
                </div>
                <div className="timestamp">{formatTime(msg.timestamp)}</div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="controls">
          <input
            type="text"
            className="input-field"
            placeholder="Type a trigger or inject an insight..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrigger()}
          />
          <button className="btn btn-primary" onClick={handleTrigger}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send Trigger
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
