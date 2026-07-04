import React, { useState } from 'react';
import { Sliders, Key, BookOpen, PanelRightClose, Code, Terminal, Sparkles, Save, Plus, Trash2, Cpu, Globe, Library } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const modelList = {
  gemini: {
    name: 'Google Gemini',
    icon: <Sparkles size={13} style={{ color: 'var(--accent-color)' }} />,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
    ]
  },
  groq: {
    name: 'Groq Cloud',
    icon: <Cpu size={13} style={{ color: 'var(--accent-cyan)' }} />,
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    icon: <Globe size={13} style={{ color: 'var(--text-secondary)' }} />,
    models: [
      { id: 'openrouter/free', name: 'Auto Free Router' }
    ]
  },
  pollinations: {
    name: 'Pollinations AI (Free)',
    icon: <Globe size={13} style={{ color: 'hsl(142, 70%, 45%)' }} />,
    models: [
      { id: 'openai', name: 'GPT-4o' },
      { id: 'mistral-nemo', name: 'Mistral Nemo' },
      { id: 'qwen-coder', name: 'Qwen 2.5 Coder' }
    ]
  },
  ollama: {
    name: 'Ollama (Local)',
    icon: <Library size={13} style={{ color: 'hsl(142, 70%, 45%)' }} />,
    models: [
      { id: 'llama3', name: 'Llama 3 (Local)' },
      { id: 'mistral', name: 'Mistral (Local)' }
    ]
  },
  nvidia: {
    name: 'NVIDIA NIM',
    icon: <Cpu size={13} style={{ color: 'var(--accent-cyan)' }} />,
    models: [
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B NIM' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B NIM' },
      { id: 'nvidia/llama-3.1-nemotron-51b-instruct', name: 'Nemotron 51B' }
    ]
  }
};

function RightDrawer({ isOpen, onClose, parameters, onUpdateParameters, apiKeys }) {
  const { setInputText, settings, createPreset, memories, createMemory, deleteMemory, updateDefaultModel, presets, deletePreset, applyPreset, agents } = useApp();
  const [memoryInput, setMemoryInput] = useState('');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetTitleInput, setPresetTitleInput] = useState('');
  
  // Accordion state management
  const [openSections, setOpenSections] = useState({
    parameters: true,
    memories: true,
    integrations: false,
    prompts: false,
    agents: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSliderChange = (param, value) => {
    onUpdateParameters({
      ...parameters,
      [param]: value
    });
  };

  const handleSavePresetClick = () => {
    setPresetTitleInput('');
    setShowSavePresetModal(true);
  };

  const handleConfirmSavePreset = async (e) => {
    if (e) e.preventDefault();
    if (!presetTitleInput || !presetTitleInput.trim()) return;

    const success = await createPreset({
      title: presetTitleInput.trim(),
      provider: settings.defaultProvider,
      model: settings.defaultModel,
      temperature: parameters.temperature,
      maxTokens: parameters.maxTokens,
      topP: parameters.topP
    });

    if (success) {
      setShowSavePresetModal(false);
    } else {
      alert("Failed to save preset. Make sure you are signed in!");
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!memoryInput.trim()) return;
    const success = await createMemory(memoryInput.trim());
    if (success) {
      setMemoryInput('');
    } else {
      alert("Failed to save memory fact. Please make sure you are signed in!");
    }
  };

  const isKeyActive = (keyVal) => {
    return keyVal && keyVal.trim().length > 0;
  };

  if (!isOpen) return null;

  return (
    <aside className={`drawer-right scroller ${isOpen ? '' : 'collapsed'}`}>
      {/* Header */}
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} />
          <span className="drawer-title">Parameters & Tools</span>
        </div>
        <button 
          className="sidebar-btn" 
          onClick={onClose} 
          title="Collapse Panel"
          aria-label="Collapse Right Drawer"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="drawer-content scroller" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', padding: '12px' }}>
        
        {/* Accordion 1: Model Settings */}
        <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            onClick={() => toggleSection('parameters')}
            style={{ display: 'flex', alignItems: 'center', justifyPanel: 'space-between', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 4px', fontSize: '13px', fontWeight: '600' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span>Model Settings & Presets</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{openSections.parameters ? '▼' : '▶'}</span>
          </div>
          
          {openSections.parameters && (
            <div style={{ padding: '8px 4px 16px 4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Temperature */}
              <div className="parameter-slider-group">
                <div className="parameter-slider-header">
                  <span>Temperature</span>
                  <span className="parameter-value-badge">{parameters.temperature.toFixed(2)}</span>
                </div>
                <div className="parameter-slider-wrapper">
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.05"
                    value={parameters.temperature}
                    onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                    className="parameter-slider"
                    aria-label="Temperature slider"
                  />
                </div>
              </div>

              {/* Max Tokens */}
              <div className="parameter-slider-group">
                <div className="parameter-slider-header">
                  <span>Max Tokens</span>
                  <span className="parameter-value-badge">{parameters.maxTokens}</span>
                </div>
                <div className="parameter-slider-wrapper">
                  <input 
                    type="range" 
                    min="256" 
                    max="8192" 
                    step="128"
                    value={parameters.maxTokens}
                    onChange={(e) => handleSliderChange('maxTokens', parseInt(e.target.value))}
                    className="parameter-slider"
                    aria-label="Max tokens slider"
                  />
                </div>
              </div>

              {/* Top P */}
              <div className="parameter-slider-group">
                <div className="parameter-slider-header">
                  <span>Top P</span>
                  <span className="parameter-value-badge">{parameters.topP.toFixed(2)}</span>
                </div>
                <div className="parameter-slider-wrapper">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={parameters.topP}
                    onChange={(e) => handleSliderChange('topP', parseFloat(e.target.value))}
                    className="parameter-slider"
                    aria-label="Top P slider"
                  />
                </div>
              </div>

              {/* Save as Preset */}
              <button 
                type="button"
                onClick={handleSavePresetClick}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
              >
                <Save size={13} />
                <span>Save as Preset</span>
              </button>

              {/* Saved Configuration Presets list */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Saved Configuration Presets
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }} className="scroller">
                  {presets.map(preset => (
                    <div 
                      key={preset._id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: settings.defaultModel === preset.model ? 'var(--bg-glass-active)' : 'transparent'
                      }}
                    >
                      <button
                        onClick={() => applyPreset(preset)}
                        style={{
                          fontSize: '12px',
                          color: settings.defaultModel === preset.model ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: settings.defaultModel === preset.model ? '600' : '400',
                          flex: 1,
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          minWidth: 0
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '600' }}>{preset.title}</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            {preset.provider}: {preset.model} (t={preset.temperature})
                          </span>
                        </div>
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete preset "${preset.title}"?`)) {
                            deletePreset(preset._id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete Preset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {presets.length === 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
                      No presets saved yet.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Accordion 2: Memories */}
        <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            onClick={() => toggleSection('memories')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 4px', fontSize: '13px', fontWeight: '600' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={14} style={{ color: 'var(--accent-color)' }} />
              <span>Memories</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{openSections.memories ? '▼' : '▶'}</span>
          </div>

          {openSections.memories && (
            <div style={{ padding: '8px 4px 16px 4px' }}>
              <form onSubmit={handleAddMemory} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input 
                  type="text"
                  placeholder="Remember fact about me..."
                  value={memoryInput}
                  onChange={(e) => setMemoryInput(e.target.value)}
                  className="search-input"
                  style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                />
                <button 
                  type="submit" 
                  className="sidebar-btn" 
                  style={{ padding: '6px', display: 'flex', alignItems: 'center' }}
                  title="Add Memory"
                >
                  <Plus size={14} />
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }} className="scroller">
                {memories.map(m => (
                  <div 
                    key={m._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--border-primary)',
                      border: '1px solid var(--border-secondary)',
                      fontSize: '11.5px',
                      color: 'var(--text-primary)',
                      gap: '8px'
                    }}
                  >
                    <span style={{ wordBreak: 'break-word', flex: 1 }}>{m.content}</span>
                    <button
                      type="button"
                      onClick={() => deleteMemory(m._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Forget Memory"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {memories.length === 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                    No memories saved yet. Teach the model facts about you!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: API Integrations */}
        <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            onClick={() => toggleSection('integrations')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 4px', fontSize: '13px', fontWeight: '600' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={14} style={{ color: 'hsl(142, 70%, 45%)' }} />
              <span>API Integrations</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{openSections.integrations ? '▼' : '▶'}</span>
          </div>

          {openSections.integrations && (
            <div style={{ padding: '8px 4px 16px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="key-status-indicator">
                <span>Google Gemini</span>
                <span className={`key-status-badge ${isKeyActive(apiKeys.gemini) ? 'active' : 'inactive'}`}>
                  {isKeyActive(apiKeys.gemini) ? 'Active' : 'Unset'}
                </span>
              </div>
              <div className="key-status-indicator">
                <span>Groq Server</span>
                <span className={`key-status-badge ${isKeyActive(apiKeys.groq) ? 'active' : 'inactive'}`}>
                  {isKeyActive(apiKeys.groq) ? 'Active' : 'Unset'}
                </span>
              </div>
              <div className="key-status-indicator">
                <span>OpenRouter API</span>
                <span className={`key-status-badge ${isKeyActive(apiKeys.openrouter) ? 'active' : 'inactive'}`}>
                  {isKeyActive(apiKeys.openrouter) ? 'Active' : 'Unset'}
                </span>
              </div>
              <div className="key-status-indicator">
                <span>NVIDIA NIM</span>
                <span className={`key-status-badge ${isKeyActive(apiKeys.nvidia) ? 'active' : 'inactive'}`}>
                  {isKeyActive(apiKeys.nvidia) ? 'Active' : 'Unset'}
                </span>
              </div>
              <div className="key-status-indicator">
                <span>Cohere API</span>
                <span className={`key-status-badge ${isKeyActive(apiKeys.cohere) ? 'active' : 'inactive'}`}>
                  {isKeyActive(apiKeys.cohere) ? 'Active' : 'Unset'}
                </span>
              </div>
              <div className="key-status-indicator">
                <span>Ollama (Local)</span>
                <span className="key-status-badge active">Localhost</span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 4: Quick Prompts */}
        <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            onClick={() => toggleSection('prompts')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 4px', fontSize: '13px', fontWeight: '600' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={14} style={{ color: 'var(--text-secondary)' }} />
              <span>Quick Prompts</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{openSections.prompts ? '▼' : '▶'}</span>
          </div>

          {openSections.prompts && (
            <div style={{ padding: '8px 4px 16px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                className="key-status-indicator" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onClick={() => setInputText("Refactor this code to follow clean, DRY principles and add descriptive comments:\n\n```\n\n```")}
              >
                <Code size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Code Refactor</span>
              </div>
              <div 
                className="key-status-indicator" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onClick={() => setInputText("Explain the following concept simply using a clear real-world analogy:\n\n")}
              >
                <Sparkles size={13} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Explain Simply</span>
              </div>
              <div 
                className="key-status-indicator" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onClick={() => setInputText("Write comprehensive unit tests for the following code snippet:\n\n```\n\n```")}
              >
                <Terminal size={13} style={{ color: 'hsl(142, 70%, 45%)' }} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Write Tests</span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 5: Agents (Assistants) */}
        <div style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div 
            onClick={() => toggleSection('agents')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 4px', fontSize: '13px', fontWeight: '600' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-color)' }} />
              <span>Agents (Assistants)</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{openSections.agents ? '▼' : '▶'}</span>
          </div>

          {openSections.agents && (
            <div style={{ padding: '8px 4px 16px 4px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }} className="scroller">
              {agents.map(agent => (
                <button
                  key={agent._id}
                  type="button"
                  onClick={() => {
                    updateDefaultModel('agent', agent._id);
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: settings.defaultModel === agent._id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: settings.defaultModel === agent._id ? 'var(--bg-glass-active)' : 'transparent',
                    fontWeight: settings.defaultModel === agent._id ? '600' : '400',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span>{agent.avatar}</span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{agent.name}</span>
                </button>
              ))}
              {agents.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                  No custom assistants created yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Save Preset Dialog Modal Overlay */}
      {showSavePresetModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <form 
            onSubmit={handleConfirmSavePreset}
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-premium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Save Configuration Preset
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Enter a descriptive title to save your current temperature, max tokens, and top P parameters.
            </div>
            <input 
              type="text"
              placeholder="e.g. Creative Coding, Precise Logic..."
              value={presetTitleInput}
              onChange={(e) => setPresetTitleInput(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              autoFocus
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="settings-tab-btn"
                style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="chat-action-btn"
                style={{ 
                  padding: '6px 16px', 
                  fontSize: '12px', 
                  backgroundColor: 'var(--accent-cyan)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 'var(--radius-md)', 
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}

export default RightDrawer;
