import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, 
  ChevronDown, MessageSquare, Columns, Plus, Sparkles, Cpu, Library, Globe,
  Download
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function Header({ 
  isSidebarOpen, 
  isRightDrawerOpen, 
  onToggleSidebar, 
  onToggleRightDrawer, 
  defaultProvider, 
  defaultModel, 
  onModelChange 
}) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const { 
    chats, 
    agents,
    compareMode,
    setCompareMode,
    compareProvider,
    setCompareProvider,
    compareModel,
    setCompareModel
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenCompare, setIsDropdownOpenCompare] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const activeChat = chats.find(c => c.id === chatId);

  const handleExportMarkdown = () => {
    if (!activeChat) return;
    let content = `# ${activeChat.title}\n\n`;
    activeChat.messages.forEach(msg => {
      const sender = msg.role === 'user' ? 'You' : `Much AI (${msg.model || 'assistant'})`;
      content += `### ${sender}\n\n${msg.content}\n\n---\n\n`;
    });
    downloadFile(content, `${activeChat.title.toLowerCase().replace(/\s+/g, '_')}.md`, 'text/markdown');
    setIsExportOpen(false);
  };

  const handleExportText = () => {
    if (!activeChat) return;
    let content = `${activeChat.title}\n${'='.repeat(activeChat.title.length)}\n\n`;
    activeChat.messages.forEach(msg => {
      const sender = msg.role === 'user' ? 'YOU' : 'MUCH AI';
      content += `${sender}:\n${msg.content}\n\n${'-'.repeat(20)}\n\n`;
    });
    downloadFile(content, `${activeChat.title.toLowerCase().replace(/\s+/g, '_')}.txt`, 'text/plain');
    setIsExportOpen(false);
  };

  const handleExportJSON = () => {
    if (!activeChat) return;
    const jsonStr = JSON.stringify(activeChat, null, 2);
    downloadFile(jsonStr, `${activeChat.title.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
    setIsExportOpen(false);
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  // Define available providers and their models
  const modelList = {
    gemini: {
      name: 'Google Gemini',
      icon: <Sparkles size={14} style={{ color: 'var(--accent-color)' }} />,
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'In Progress' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Pro' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Pro' }
      ]
    },
    groq: {
      name: 'Groq Cloud',
      icon: <Cpu size={14} style={{ color: 'var(--accent-cyan)' }} />,
      models: [
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
      ]
    },
    openrouter: {
      name: 'OpenRouter',
      icon: <Globe size={14} style={{ color: 'var(--text-secondary)' }} />,
      models: [
        { id: 'openrouter/free', name: 'Auto Free Router (Guaranteed)' }
      ]
    },
    pollinations: {
      name: 'Pollinations AI (Keyless)',
      icon: <Globe size={14} style={{ color: 'hsl(142, 70%, 45%)' }} />,
      models: [
        { id: 'openai', name: 'GPT-4o (Free)' },
        { id: 'mistral-nemo', name: 'Mistral Nemo (Free)' },
        { id: 'qwen-coder', name: 'Qwen 2.5 Coder (Free)' }
      ]
    },
    ollama: {
      name: 'Ollama (Local)',
      icon: <Library size={14} style={{ color: 'hsl(142, 70%, 45%)' }} />,
      models: [
        { id: 'llama3', name: 'Llama 3 (Local)' },
        { id: 'mistral', name: 'Mistral (Local)' }
      ]
    },
    nvidia: {
      name: 'NVIDIA NIM',
      icon: <Cpu size={14} style={{ color: 'var(--accent-cyan)' }} />,
      models: [
        { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B NIM', tag: 'Pro' },
        { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B NIM', tag: 'Pro' },
        { id: 'nvidia/llama-3.1-nemotron-51b-instruct', name: 'Nemotron 51B', tag: 'Pro' }
      ]
    }
  };

  const getCurrentModelLabel = (provider, model) => {
    if (provider === 'agent') {
      const agent = agents.find(a => a._id === model);
      return agent ? `${agent.avatar} ${agent.name}` : 'Custom Assistant';
    }
    const pInfo = modelList[provider];
    if (!pInfo) return 'Select Model';
    const mInfo = pInfo.models.find(m => m.id === model);
    return mInfo ? `${pInfo.name}: ${mInfo.name}` : `${pInfo.name}: ${model}`;
  };

  const getChatTitle = () => {
    if (!chatId) return 'New Workspace';
    return activeChat ? activeChat.title : 'Active Chat';
  };

  return (
    <header className="header">
      {/* Left controls */}
      <div className="header-left">
        {!isSidebarOpen && (
          <button 
            className="sidebar-btn" 
            onClick={onToggleSidebar}
            title="Expand Sidebar"
            aria-label="Expand Left Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} className="text-muted" style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{getChatTitle()}</span>
        </div>
      </div>

      {/* Center switcher dropdowns */}
      <div className="header-center" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Dropdown A (Model A) */}
        <div style={{ position: 'relative' }}>
          <button 
            className="model-dropdown-btn" 
            onClick={() => {
              setIsDropdownOpen(prev => !prev);
              setIsDropdownOpenCompare(false);
            }}
            title="Switch Model A"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            {defaultProvider === 'agent' ? (
              <span style={{ fontSize: '14px', marginRight: '6px' }}>
                {agents.find(a => a._id === defaultModel)?.avatar || '🤖'}
              </span>
            ) : (
              modelList[defaultProvider]?.icon
            )}
            <span>{getCurrentModelLabel(defaultProvider, defaultModel)}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {isDropdownOpen && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '44px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '300px', 
                borderRadius: 'var(--radius-lg)', 
                padding: '8px', 
                maxHeight: '380px', 
                overflowY: 'auto',
                boxShadow: 'var(--shadow-premium)',
                zIndex: 100,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)'
              }}
              role="listbox"
            >
              {Object.entries(modelList).map(([providerId, provider]) => (
                <div key={providerId} style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    color: 'var(--text-muted)',
                    padding: '4px 8px'
                  }}>
                    {provider.icon}
                    <span>{provider.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {provider.models.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange(providerId, model.id);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: defaultModel === model.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                          backgroundColor: defaultModel === model.id ? 'var(--bg-glass-active)' : 'transparent',
                          fontWeight: defaultModel === model.id ? '600' : '400',
                          width: '100%',
                          transition: 'background-color var(--transition-fast)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        role="option"
                        aria-selected={defaultModel === model.id}
                      >
                        <span>{model.name}</span>
                        {model.tag && (
                          <span style={{
                            fontSize: '8px',
                            fontWeight: '600',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: model.tag === 'Pro' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                            color: model.tag === 'Pro' ? 'var(--accent-color)' : 'var(--accent-cyan)',
                            border: `1px solid ${model.tag === 'Pro' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {model.tag}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {compareMode && (
          <>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)', userSelect: 'none' }}>vs</span>
            
            {/* Dropdown B (Model B) */}
            <div style={{ position: 'relative' }}>
              <button 
                className="model-dropdown-btn" 
                onClick={() => {
                  setIsDropdownOpenCompare(prev => !prev);
                  setIsDropdownOpen(false);
                }}
                title="Switch Model B"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpenCompare}
                style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              >
                {compareProvider === 'agent' ? (
                  <span style={{ fontSize: '14px', marginRight: '6px' }}>
                    {agents.find(a => a._id === compareModel)?.avatar || '🤖'}
                  </span>
                ) : (
                  modelList[compareProvider]?.icon
                )}
                <span>{getCurrentModelLabel(compareProvider, compareModel)}</span>
                <ChevronDown size={14} style={{ color: 'var(--accent-cyan)' }} />
              </button>

              {isDropdownOpenCompare && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '44px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: '300px', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '8px', 
                    maxHeight: '380px', 
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-premium)',
                    zIndex: 100,
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-secondary)'
                  }}
                  role="listbox"
                >
                  {Object.entries(modelList).map(([providerId, provider]) => (
                    <div key={providerId} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        textTransform: 'uppercase', 
                        color: 'var(--text-muted)',
                        padding: '4px 8px'
                      }}>
                        {provider.icon}
                        <span>{provider.name}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {provider.models.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setCompareProvider(providerId);
                              setCompareModel(model.id);
                              setIsDropdownOpenCompare(false);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12.5px',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              color: compareModel === model.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                              backgroundColor: compareModel === model.id ? 'var(--bg-glass-active)' : 'transparent',
                              fontWeight: compareModel === model.id ? '600' : '400',
                              width: '100%',
                              transition: 'background-color var(--transition-fast)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            role="option"
                            aria-selected={compareModel === model.id}
                          >
                            <span>{model.name}</span>
                            {model.tag && (
                              <span style={{
                                fontSize: '8px',
                                fontWeight: '600',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: model.tag === 'Pro' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                                color: model.tag === 'Pro' ? 'var(--accent-color)' : 'var(--accent-cyan)',
                                border: `1px solid ${model.tag === 'Pro' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {model.tag}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="header-right" style={{ position: 'relative' }}>
        {activeChat && (
          <>
            <button 
              className={`sidebar-btn ${isExportOpen ? 'active' : ''}`}
              onClick={() => setIsExportOpen(prev => !prev)}
              title="Export Conversation"
              aria-label="Export Conversation Menu"
            >
              <Download size={18} />
            </button>
            
            {isExportOpen && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: '40px', 
                  right: '72px', 
                  width: '180px', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '6px',
                  boxShadow: 'var(--shadow-premium)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <button
                  onClick={handleExportMarkdown}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    width: '100%',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  className="chat-item"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={handleExportText}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    width: '100%',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  className="chat-item"
                >
                  Export as Plain Text (.txt)
                </button>
                <button
                  onClick={handleExportJSON}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    width: '100%',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  className="chat-item"
                >
                  Export as JSON (.json)
                </button>
              </div>
            )}
          </>
        )}
        <button 
          className="sidebar-btn" 
          onClick={() => navigate('/')} 
          title="New Chat Session"
          aria-label="New Chat Session"
        >
          <Plus size={18} />
        </button>
        <button 
          className={`sidebar-btn ${compareMode ? 'active' : ''}`}
          onClick={() => setCompareMode(!compareMode)}
          title={compareMode ? "Disable Split View" : "Enable Split View (Compare Models)"}
          aria-label="Split Screen Layout"
          style={compareMode ? { color: 'var(--accent-cyan)', backgroundColor: 'rgba(6, 182, 212, 0.12)' } : {}}
        >
          <Columns size={18} />
        </button>
        {!isRightDrawerOpen && (
          <button 
            className="sidebar-btn" 
            onClick={onToggleRightDrawer}
            title="Expand Configuration"
            aria-label="Expand Right Sidebar"
          >
            <PanelRightOpen size={18} />
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
