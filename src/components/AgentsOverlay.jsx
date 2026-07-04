/* AgentsOverlay.jsx - Custom AI Assistants Manager for Much Workspace */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Trash2, Edit3, Save, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const AVATAR_OPTIONS = ['🤖', '💻', '💡', '🔥', '🎨', '🚀', '📈', '🧠', '🛠️', '🎓', '🩺', '⚖️'];

export default function AgentsOverlay({ isOpen, onClose }) {
  const { agents, createAgent, updateAgent, deleteAgent, settings } = useApp();
  const [editingAgent, setEditingAgent] = useState(null); // null means listing/creating
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [loading, setLoading] = useState(false);

  // Available models in settings/header mappings
  const MODEL_MAPPINGS = {
    gemini: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
    ],
    groq: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
    ],
    openrouter: [
      { id: 'openrouter/free', name: 'Auto Free Router (Guaranteed)' }
    ],
    pollinations: [
      { id: 'openai', name: 'GPT-4o (Free)' },
      { id: 'mistral-nemo', name: 'Mistral Nemo (Free)' },
      { id: 'qwen-coder', name: 'Qwen 2.5 Coder (Free)' }
    ]
  };

  useEffect(() => {
    // Keep model selection in sync when provider changes
    const models = MODEL_MAPPINGS[provider] || [];
    if (models.length > 0 && !models.find(m => m.id === model)) {
      setModel(models[0].id);
    }
  }, [provider]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setDescription('');
    setSystemPrompt('');
    setAvatar('🤖');
    setProvider('groq');
    setModel('llama-3.3-70b-versatile');
    setEditingAgent(null);
    setIsCreateMode(true);
  };

  const handleStartEdit = (agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setSystemPrompt(agent.systemPrompt);
    setAvatar(agent.avatar || '🤖');
    setProvider(agent.provider);
    setModel(agent.model);
    setIsCreateMode(false);
  };

  const handleCancel = () => {
    setEditingAgent(null);
    setIsCreateMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    setLoading(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      avatar,
      provider,
      model
    };

    try {
      if (editingAgent) {
        await updateAgent(editingAgent._id, payload);
      } else {
        await createAgent(payload);
      }
      handleCancel();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId) => {
    if (window.confirm('Are you sure you want to delete this custom assistant?')) {
      await deleteAgent(agentId);
      if (editingAgent && editingAgent._id === agentId) {
        handleCancel();
      }
    }
  };

  return (
    <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="glass-panel settings-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
      >
        {/* Header */}
        <div className="drawer-header" style={{ padding: '20px' }}>
          <h2 className="drawer-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-color)' }} />
            {isCreateMode ? 'Create AI Assistant' : (editingAgent ? 'Edit AI Assistant' : 'Explore Custom AI Assistants')}
          </h2>
          <button className="sidebar-btn" onClick={onClose} aria-label="Close custom assistant manager">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body scroller" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh' }}>
          
          {/* List View */}
          {!isCreateMode && !editingAgent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configure custom assistants with instructions, personalities, and models.</span>
                <button className="accent-btn" onClick={handleStartCreate} style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}>
                  <Plus size={14} />
                  Create Agent
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {agents.map(agent => (
                  <div 
                    key={agent._id}
                    className="glass-card"
                    style={{ 
                      padding: '14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'between', 
                      gap: '12px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-secondary)' }}>
                        {agent.avatar || '🤖'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{agent.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {agent.description || 'No description provided.'}
                        </div>
                        <div style={{ display: 'inline-block', fontSize: '10px', backgroundColor: 'var(--border-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {agent.model} ({agent.provider.toUpperCase()})
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="sidebar-btn" onClick={() => handleStartEdit(agent)} title="Edit agent specifications">
                        <Edit3 size={14} />
                      </button>
                      <button className="sidebar-btn" onClick={() => handleDelete(agent._id)} title="Delete custom agent" style={{ color: 'hsl(346, 77%, 49%)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {agents.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed var(--border-primary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>No custom AI assistants created yet.</p>
                    <button onClick={handleStartCreate} style={{ fontSize: '12px', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Create your first assistant now!
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form View (Create / Edit) */}
          {(isCreateMode || editingAgent) && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Row 1: Name & Avatar */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '80px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avatar</label>
                  <div style={{ fontSize: '32px', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {avatar}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assistant Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. JavaScript Tutor"
                    className="settings-input"
                    required
                  />
                </div>
              </div>

              {/* Avatar Selector Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select Avatar Icon</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      style={{
                        fontSize: '20px',
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: avatar === emoji ? 'var(--border-secondary)' : 'var(--bg-tertiary)',
                        border: avatar === emoji ? '1px solid var(--accent-color)' : '1px solid var(--border-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this assistant do? (e.g. Explains Node JS concepts)"
                  className="settings-input"
                />
              </div>

              {/* Provider & Model Selectors */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Default Provider</label>
                  <select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value)}
                    className="settings-input"
                    style={{ appearance: 'auto' }}
                  >
                    <option value="groq">Groq Cloud</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="pollinations">Pollinations AI</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Default Model</label>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    className="settings-input"
                    style={{ appearance: 'auto' }}
                  >
                    {(MODEL_MAPPINGS[provider] || []).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* System Prompt / Instructions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Instructions (Behaviors & Context)</label>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Tell the assistant how it should behave... (e.g. 'You are an expert JS debugger. Always review code for security issues and respond with console.logs.')"
                  className="settings-input"
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'sans-serif' }}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
                <div>
                  {editingAgent && (
                    <button 
                      type="button" 
                      onClick={() => handleDelete(editingAgent._id)}
                      className="sidebar-btn" 
                      style={{ color: 'hsl(346, 77%, 49%)', padding: '8px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}
                    >
                      <Trash2 size={14} />
                      Delete Agent
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="sidebar-btn" onClick={handleCancel} style={{ padding: '8px 16px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="accent-btn" disabled={loading} style={{ padding: '8px 16px', gap: '6px' }}>
                    <Save size={14} />
                    {loading ? 'Saving...' : 'Save Agent'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
