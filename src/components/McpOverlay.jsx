import React, { useState, useEffect } from 'react';
import { X, Cpu, Plus, Trash2, Power, Code, ShieldAlert, RefreshCw, Layers } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function McpOverlay({ isOpen, onClose }) {
  const { token, user } = useApp();

  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedServer, setExpandedServer] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('stdio');
  const [command, setCommand] = useState('');
  const [argsInput, setArgsInput] = useState('');
  const [url, setUrl] = useState('');
  const [envInput, setEnvInput] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = true;

  const loadServers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/mcp/servers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setServers(await res.json());
      }
    } catch (err) {
      console.error('Error loading MCP servers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadServers();
      setError('');
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (id) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`http://localhost:5001/api/mcp/servers/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Server state toggled.');
        setTimeout(() => setMessage(''), 3000);
        loadServers();
      }
    } catch (err) {
      console.error('Error toggling MCP server:', err);
    }
  };

  const handleDelete = async (id, serverName) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete MCP Server "${serverName}"? This will terminate its running process.`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/mcp/servers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('MCP server configuration deleted.');
        setTimeout(() => setMessage(''), 3000);
        loadServers();
      }
    } catch (err) {
      console.error('Error deleting MCP server:', err);
    }
  };

  const handleAddServer = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError('');
    setMessage('');

    if (!name.trim()) {
      return setError('Server name is required.');
    }

    // Parse arguments
    let args = [];
    if (type === 'stdio' && argsInput.trim()) {
      args = argsInput.split(',').map(arg => arg.trim()).filter(Boolean);
    }

    // Parse env json
    let env = {};
    if (envInput.trim()) {
      try {
        env = JSON.parse(envInput);
      } catch (err) {
        return setError('Environment variables must be a valid JSON object.');
      }
    }

    try {
      const res = await fetch('http://localhost:5001/api/mcp/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          command: type === 'stdio' ? command.trim() : undefined,
          args: type === 'stdio' ? args : undefined,
          url: type === 'sse' ? url.trim() : undefined,
          env,
          enabled: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        return setError(data.error || 'Failed to create MCP server.');
      }

      setMessage('MCP server added and launching...');
      setTimeout(() => setMessage(''), 3000);
      
      // Reset form
      setName('');
      setCommand('');
      setArgsInput('');
      setUrl('');
      setEnvInput('');
      
      loadServers();
    } catch (err) {
      console.error('Create MCP server error:', err);
      setError('Server error creating MCP configuration.');
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          height: '85%',
          maxHeight: '600px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>MCP Server Settings</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="sidebar-btn" 
            style={{ padding: '6px' }}
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message / Error Banners */}
        {message && (
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', borderBottom: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '8px 16px', fontSize: '12px', textAlign: 'center', fontWeight: '500' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', fontSize: '12px', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left panel: List of servers */}
          <div style={{ flex: 1.2, borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px' }} className="scroller">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configured Servers</span>
              <button onClick={loadServers} className="sidebar-btn" style={{ padding: '4px' }} title="Reload statuses">
                <RefreshCw size={12} className={isLoading ? 'spinning' : ''} />
              </button>
            </div>

            {servers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', padding: '40px 10px' }}>
                No MCP servers configured yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {servers.map(s => {
                  const statusColors = {
                    connected: '#22c55e',
                    connecting: '#eab308',
                    disconnected: '#ef4444',
                    error: '#ef4444',
                    disabled: '#6b7280'
                  };
                  const color = statusColors[s.status] || '#6b7280';
                  const isExpanded = expandedServer === s._id;

                  return (
                    <div 
                      key={s._id} 
                      style={{ 
                        border: '1px solid var(--border-primary)', 
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        style={{ 
                          padding: '12px 14px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedServer(isExpanded ? null : s._id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: color }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{s.name}</span>
                          <span style={{ fontSize: '9px', backgroundColor: 'var(--border-primary)', color: 'var(--text-muted)', padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            {s.type}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          {isAdmin && (
                            <>
                              <button 
                                className="sidebar-btn" 
                                onClick={() => handleToggle(s._id)} 
                                style={{ padding: '4px', color: s.enabled ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
                                title={s.enabled ? "Disable server" : "Enable server"}
                              >
                                <Power size={13} />
                              </button>
                              <button 
                                className="sidebar-btn" 
                                onClick={() => handleDelete(s._id, s.name)} 
                                style={{ padding: '4px', color: '#ef4444' }}
                                title="Delete server"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expandable tools summary */}
                      {isExpanded && (
                        <div style={{ padding: '0 14px 12px 14px', borderTop: '1px solid var(--border-primary)', fontSize: '12px', backgroundColor: 'var(--bg-primary)' }}>
                          <div style={{ padding: '10px 0 6px 0', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            Exposed Tools ({s.toolsCount})
                          </div>
                          {s.tools.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                              No active tools registered. Check server log output.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              {s.tools.map(t => (
                                <div key={t.name} style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--accent-cyan)', fontSize: '11.5px' }}>
                                    <Code size={11} />
                                    <span>{t.name}</span>
                                  </div>
                                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
                                    {t.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Add server form (Admins only) */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="scroller">
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Configure MCP Connection
            </span>

            {!isAdmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                <ShieldAlert size={28} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '12.5px' }}>
                  Only administrators can create or edit local process/SSE configurations.
                </span>
              </div>
            ) : (
              <form onSubmit={handleAddServer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Server Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. sqlite-database"
                    className="settings-input"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    className="settings-input"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="stdio">Local subprocess (stdio)</option>
                    <option value="sse">SSE remote connection (URL)</option>
                  </select>
                </div>

                {type === 'stdio' ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Command</label>
                      <input 
                        type="text" 
                        value={command} 
                        onChange={e => setCommand(e.target.value)} 
                        placeholder="e.g. npx or node"
                        className="settings-input"
                        required
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Arguments (Comma separated)</label>
                      <input 
                        type="text" 
                        value={argsInput} 
                        onChange={e => setArgsInput(e.target.value)} 
                        placeholder="e.g. -y, @modelcontextprotocol/server-sqlite, --db, dev.db"
                        className="settings-input"
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>SSE Service URL</label>
                    <input 
                      type="text" 
                      value={url} 
                      onChange={e => setUrl(e.target.value)} 
                      placeholder="e.g. http://localhost:3001/sse"
                      className="settings-input"
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Environment Variables (JSON format)</label>
                  <textarea 
                    value={envInput} 
                    onChange={e => setEnvInput(e.target.value)} 
                    placeholder='e.g. { "DB_PATH": "/data" }'
                    className="settings-input"
                    rows={3}
                    style={{ fontFamily: 'monospace', resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="accent-btn" 
                  style={{ marginTop: '6px', gap: '6px', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                  <span>Launch Server</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default McpOverlay;
