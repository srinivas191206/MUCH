import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function SettingsOverlay({ 
  isOpen, 
  onClose, 
  theme, 
  onToggleTheme, 
  apiKeys, 
  onSaveKeys,
  defaultProvider,
  defaultModel,
  onModelChange 
}) {
  const { chats, folders, settings: contextSettings, importBackup } = useApp();
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState('');
  const [keys, setKeys] = useState({ ...apiKeys });
  const [showKeys, setShowKeys] = useState({ groq: false, gemini: false, openrouter: false, nvidia: false, cohere: false, openai: false, huggingface: false });

  const handleExportBackup = () => {
    const data = {
      chats,
      folders,
      settings: contextSettings
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `much_workspace_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.chats || !parsed.folders || !parsed.settings) {
          setImportStatus('Error: Invalid backup structure.');
          return;
        }
        const success = importBackup(parsed);
        if (success) {
          setImportStatus('Success: Workspace restored!');
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Error: Failed to restore backup.');
        }
      } catch (err) {
        setImportStatus('Error: Failed to parse backup.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Keep local input in sync with external parameters
  useEffect(() => {
    setKeys({ ...apiKeys });
  }, [apiKeys]);

  const handleKeyChange = (provider, value) => {
    setKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleToggleShow = (provider) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSave = () => {
    onSaveKeys(keys);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="glass-panel settings-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
      >
        {/* Header */}
        <div className="drawer-header" style={{ padding: '20px' }}>
          <h2 className="drawer-title" style={{ fontSize: '16px' }}>Much Workspace Settings</h2>
          <button className="sidebar-btn" onClick={onClose} aria-label="Close settings dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body">
          {/* Theme selection */}
          <div className="settings-row">
            <label className="settings-label">Interface Mode</label>
            <button 
              className="accent-btn" 
              style={{ width: 'fit-content', gap: '10px' }}
              onClick={onToggleTheme}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Toggle {theme === 'dark' ? 'Light Fallback' : 'Dark Premium'} Mode
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)' }} />

          {/* API Key fields */}
          <div className="settings-row">
            <label className="settings-label">Credentials & Keys</label>
            
            {/* Gemini Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Google Gemini API Key</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.gemini ? "text" : "password"} 
                  value={keys.gemini} 
                  onChange={(e) => handleKeyChange('gemini', e.target.value)}
                  placeholder="AIzaSy..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('gemini')}
                >
                  {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Groq Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Groq API Key</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.groq ? "text" : "password"} 
                  value={keys.groq} 
                  onChange={(e) => handleKeyChange('groq', e.target.value)}
                  placeholder="gsk_..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('groq')}
                >
                  {showKeys.groq ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* OpenRouter Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OpenRouter API Key</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.openrouter ? "text" : "password"} 
                  value={keys.openrouter} 
                  onChange={(e) => handleKeyChange('openrouter', e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('openrouter')}
                >
                  {showKeys.openrouter ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nvidia Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NVIDIA NIM API Key</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.nvidia ? "text" : "password"} 
                  value={keys.nvidia} 
                  onChange={(e) => handleKeyChange('nvidia', e.target.value)}
                  placeholder="nvapi-..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('nvidia')}
                >
                  {showKeys.nvidia ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Cohere Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cohere API Key</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.cohere ? "text" : "password"} 
                  value={keys.cohere || ''} 
                  onChange={(e) => handleKeyChange('cohere', e.target.value)}
                  placeholder="Paste Cohere key..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('cohere')}
                >
                  {showKeys.cohere ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* OpenAI Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OpenAI API Key (For DALL-E 3 Image Generation)</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.openai ? "text" : "password"} 
                  value={keys.openai || ''} 
                  onChange={(e) => handleKeyChange('openai', e.target.value)}
                  placeholder="sk-proj-..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('openai')}
                >
                  {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Hugging Face Token */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hugging Face Token (Free FLUX.1 Image Gen)</span>
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type={showKeys.huggingface ? "text" : "password"} 
                  value={keys.huggingface || ''} 
                  onChange={(e) => handleKeyChange('huggingface', e.target.value)}
                  placeholder="hf_..."
                  className="settings-input"
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}
                  onClick={() => handleToggleShow('huggingface')}
                >
                  {showKeys.huggingface ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)' }} />

          {/* Defaults info */}
          <div className="settings-row">
            <label className="settings-label">Default LLM Configuration</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default Provider</span>
                <select 
                  value={defaultProvider} 
                  onChange={(e) => {
                    const prov = e.target.value;
                    const defaultModels = {
                      gemini: 'gemini-2.5-flash',
                      groq: 'llama-3.1-8b-instant',
                      openrouter: 'google/gemini-2.5-flash:free',
                      ollama: 'llama3',
                      nvidia: 'meta/llama-3.1-8b-instruct'
                    };
                    onModelChange(prov, defaultModels[prov]);
                  }}
                  className="settings-select"
                  style={{ marginTop: '4px' }}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq Cloud</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="nvidia">NVIDIA NIM</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)' }} />

          {/* Backup & Restore */}
          <div className="settings-row">
            <label className="settings-label">Workspace Backup</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                className="accent-btn" 
                style={{ width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}
                onClick={handleExportBackup}
                title="Export all chats, folders, and settings"
              >
                Export Workspace
              </button>
              <button 
                type="button" 
                className="accent-btn" 
                style={{ 
                  width: 'fit-content', 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Restore chats and folders from backup"
              >
                Import Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportBackup} 
                accept=".json" 
                style={{ display: 'none' }} 
              />
            </div>
            {importStatus && (
              <span style={{ 
                fontSize: '12px', 
                color: importStatus.startsWith('Success') ? 'hsl(142, 70%, 45%)' : 'red', 
                display: 'block', 
                marginTop: '8px',
                fontWeight: '600'
              }}>
                {importStatus}
              </span>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px', 
              borderRadius: 'var(--radius-md)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)'
            }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="accent-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsOverlay;
