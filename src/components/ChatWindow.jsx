/* ChatWindow.jsx - Markdown Viewport with Edit, Regenerate, and Comparison Split View for Much */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { 
  Sparkles, Cpu, Library, ArrowUp, Copy, Check, Edit2, RotateCw, X, Save, Code, Terminal, Volume2, VolumeX
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import SafeImage from './SafeImage';
import { useApp } from '../contexts/AppContext';

function ChatWindow({ messages, onSelectSuggestion }) {
  const { 
    editUserMessage, 
    regenerateMessage, 
    currentChatId, 
    isGenerating,
    settings,
    agents
  } = useApp();

  const [playingMsgId, setPlayingMsgId] = useState(null);

  // Stop reading when leaving page or switching conversations
  useEffect(() => {
    return () => {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    };
  }, []);

  const toggleSpeak = (msgId, text) => {
    if (playingMsgId === msgId) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      setPlayingMsgId(null);
    } else {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      
      const cleanText = text
        .replace(/`{3}[\s\S]*?`{3}/g, '')
        .replace(/`[\s\S]*?`/g, '')
        .replace(/\[([\s\S]*?)\]\(([\s\S]*?)\)/g, '$1')
        .replace(/[*_#\-]/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        
        // Priority order for selecting warm, natural voices:
        const sweetVoice = 
          enVoices.find(v => v.name.includes('Google US English')) ||
          enVoices.find(v => v.name.includes('Samantha')) ||
          enVoices.find(v => v.name.includes('Siri')) ||
          enVoices.find(v => v.name.includes('Google UK English Female')) ||
          enVoices.find(v => v.name.includes('Zira')) ||
          enVoices.find(v => v.name.includes('Google')) ||
          enVoices[0];

        if (sweetVoice) {
          utterance.voice = sweetVoice;
        }
      }

      // Adjust pace and pitch to sound human
      utterance.rate = 0.95; // A tiny bit slower than default creates a relaxed, natural cadence
      utterance.pitch = 1.05; // Marginally higher pitch sounds warmer and friendlier

      utterance.onend = () => {
        setPlayingMsgId(null);
      };
      utterance.onerror = () => {
        setPlayingMsgId(null);
      };

      setPlayingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const endRef = useRef(null);
  const containerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Message UI states
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Auto-scroll to bottom: snap instantly during active streaming, animate smoothly on message completion
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      if (isGenerating) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      } else {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isGenerating]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // User is within 120px of the bottom: anchor scrolling
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    shouldAutoScroll.current = isAtBottom;
  };

  const suggestions = [
    {
      title: 'Explain React Server Components',
      desc: 'Understand client vs server rendering logic.',
      prompt: 'Explain React Server Components in detail, including client/server boundaries.'
    },
    {
      title: 'Refactor Layout Grid',
      desc: 'Optimize dashboard layout for CSS Grid.',
      prompt: 'Write clean CSS rules to create a responsive 3-column dashboard using CSS Grid.'
    },
    {
      title: 'Configure Ollama locally',
      desc: 'Enable cross-origin requests on macOS.',
      prompt: 'How do I resolve CORS blocks when connecting a web app to local Ollama on Mac?'
    },
    {
      title: 'Write unit tests in Vitest',
      desc: 'Set up automated tests for React hooks.',
      prompt: 'Write unit tests for a custom React hook that manages local storage state.'
    }
  ];

  const getModelBadgeColor = (provider) => {
    switch (provider) {
      case 'gemini': return 'var(--accent-color)';
      case 'groq': return 'var(--accent-cyan)';
      case 'nvidia': return 'var(--accent-cyan)';
      case 'ollama': return 'hsl(142, 70%, 45%)';
      default: return 'var(--text-muted)';
    }
  };

  // Copy message text
  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  // Toggle edit state
  const startEditing = (msgId, currentContent) => {
    setEditingMsgId(msgId);
    setEditText(currentContent);
  };

  const cancelEditing = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const saveEdit = async (msgId, msgProvider, msgModel) => {
    if (!editText.trim()) return;
    const provider = msgProvider || settings.defaultProvider;
    const model = msgModel || settings.defaultModel;
    
    // Clear state
    setEditingMsgId(null);
    
    // Trigger resubmission on AppContext
    await editUserMessage(currentChatId, msgId, editText.trim(), provider, model);
    setEditText('');
  };

  const handleRegenerate = async (msgProvider, msgModel) => {
    const provider = msgProvider || settings.defaultProvider;
    const model = msgModel || settings.defaultModel;
    await regenerateMessage(currentChatId, provider, model);
  };

  // Helper to extract plain text from React children tree recursively
  const getTextFromChildren = (children) => {
    if (typeof children === 'string') {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map(getTextFromChildren).join('');
    }
    if (children && children.props) {
      return getTextFromChildren(children.props.children);
    }
    return '';
  };

  // Markdown Custom Element Renderers
  const markdownComponents = useMemo(() => ({
    pre({ children }) {
      return <div className="code-block-pre-wrap">{children}</div>;
    },
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;

      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      const rawCode = getTextFromChildren(children);

      return (
        <CodeBlock 
          language={match[1]} 
          value={rawCode.replace(/\n$/, '')}
        >
          <code className={className} {...props}>
            {children}
          </code>
        </CodeBlock>
      );
    },
    img({ node, src, alt, ...props }) {
      return <SafeImage src={src} alt={alt} {...props} />;
    }
  }), []);

  const renderMessageCard = (msg, index) => {
    const isEditing = editingMsgId === msg.id;
    const isUser = msg.role === 'user';
    
    const agentProfile = (!isUser && msg.provider === 'agent') 
      ? agents.find(a => a._id === msg.model)
      : null;

    return (
      <div 
        key={msg.id || index} 
        className={`message-card ${msg.role === 'assistant' ? 'assistant' : 'user'}`}
        style={{ width: '100%', maxWidth: 'none', margin: '4px 0', border: 'none', backgroundColor: 'transparent' }}
      >
        <div 
          className={`message-avatar ${msg.role}`}
          style={(!isUser && agentProfile) ? { fontSize: '15px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' } : {}}
        >
          {isUser ? 'U' : (agentProfile ? agentProfile.avatar : 'M')}
        </div>
        <div className="message-content-wrapper" style={{ flex: 1, minWidth: 0 }}>
          <div className="message-meta">
            <span className="message-sender">
              {isUser ? 'You' : (agentProfile ? agentProfile.name : 'Much AI')}
            </span>
            {!isUser && msg.model && (
              <span 
                className="message-model-badge"
                style={{ 
                  borderColor: getModelBadgeColor(agentProfile ? agentProfile.provider : msg.provider), 
                  color: getModelBadgeColor(agentProfile ? agentProfile.provider : msg.provider) 
                }}
              >
                {agentProfile ? agentProfile.model : msg.model}
              </span>
            )}
          </div>

          <div className="message-body">
            {isEditing ? (
              <div className="inline-editor-container">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="inline-editor-textarea"
                  rows={Math.max(2, editText.split('\n').length)}
                  aria-label="Edit message prompt"
                />
                <div className="inline-editor-controls">
                  <button 
                    onClick={cancelEditing} 
                    className="sidebar-btn" 
                    style={{ padding: '6px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}
                    title="Cancel Editing"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button 
                    onClick={() => saveEdit(msg.id, msg.provider, msg.model)} 
                    className="accent-btn" 
                    style={{ padding: '6px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}
                    disabled={isGenerating}
                    title="Save Changes and Resubmit"
                  >
                    <Save size={13} /> Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="markdown-content">
                {msg.fileAttachment && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    marginBottom: '10px',
                    width: 'fit-content',
                    maxWidth: '280px',
                    userSelect: 'none'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      flexShrink: 0
                    }}>
                      {msg.fileAttachment.name.split('.').pop().toUpperCase() || 'FILE'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {msg.fileAttachment.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {(msg.fileAttachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                )}

                <ReactMarkdown 
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {msg.content || '*(Generating response...)*'}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="message-actions">
              <button
                onClick={() => handleCopyMessage(msg.id, msg.content)}
                className="message-action-btn"
                title="Copy message"
                aria-label="Copy message content"
              >
                {copiedMsgId === msg.id ? <Check size={13} /> : <Copy size={13} />}
              </button>

              {!isUser && (
                <button
                  onClick={() => toggleSpeak(msg.id, msg.content)}
                  className="message-action-btn"
                  title={playingMsgId === msg.id ? "Stop reading" : "Read response out loud"}
                  aria-label="Read response out loud"
                  style={playingMsgId === msg.id ? { color: 'var(--accent-cyan)' } : {}}
                >
                  {playingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              )}

              {isUser ? (
                <button
                  onClick={() => startEditing(msg.id, msg.content)}
                  className="message-action-btn"
                  disabled={isGenerating}
                  title="Edit message"
                  aria-label="Edit user message"
                >
                  <Edit2 size={13} />
                </button>
              ) : (
                index === messages.length - 1 && (
                  <button
                    onClick={() => handleRegenerate(msg.provider, msg.model)}
                    className="message-action-btn"
                    disabled={isGenerating}
                    title="Regenerate response"
                    aria-label="Regenerate AI response"
                  >
                    <RotateCw size={13} />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-window scroller" ref={containerRef} onScroll={handleScroll}>
        <div className="landing-container">
          <img src="/logo.png" alt="Much Logo" style={{ width: '96px', height: '96px', objectFit: 'contain', marginBottom: '16px' }} />
          <h1 className="landing-title text-gradient">Much</h1>
          <p className="landing-subtitle">
            A local-first multi-model AI workspace. Interact with Gemini, Groq, OpenRouter, and Ollama in a single fluid interface.
          </p>

          <div className="suggestion-grid">
            {suggestions.map((card, index) => (
              <div 
                key={index} 
                className="glass-card suggestion-card"
                onClick={() => onSelectSuggestion(card.prompt)}
              >
                <div className="suggestion-card-title">{card.title}</div>
                <div className="suggestion-card-desc">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pre-process messages list to group adjacent assistant messages into comparative rows
  const rows = [];
  let i = 0;
  while (i < messages.length) {
    const current = messages[i];
    if (current.role === 'user') {
      rows.push({ type: 'user', data: current, index: i });
      i++;
    } else if (current.role === 'assistant') {
      const next = messages[i + 1];
      if (next && next.role === 'assistant') {
        rows.push({ type: 'compare', data: [current, next], index: i });
        i += 2;
      } else {
        rows.push({ type: 'single-assistant', data: current, index: i });
        i++;
      }
    } else {
      rows.push({ type: 'other', data: current, index: i });
      i++;
    }
  }

  const hasCompare = rows.some(row => row.type === 'compare');

  return (
    <div className="chat-window scroller" ref={containerRef} onScroll={handleScroll}>
      <div 
        className="message-list" 
        style={{ 
          maxWidth: hasCompare ? '1200px' : '800px', 
          margin: '0 auto', 
          width: '100%', 
          padding: '0 20px',
          boxSizing: 'border-box'
        }}
      >
        {rows.map((row, rIdx) => {
          if (row.type === 'compare') {
            const [msgA, msgB] = row.data;
            return (
              <div 
                key={`row_${rIdx}`} 
                style={{ 
                  display: 'flex', 
                  gap: '28px', 
                  width: '100%', 
                  marginBottom: '24px',
                  alignItems: 'stretch'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', borderRight: '1px solid var(--border-primary)', paddingRight: '24px' }}>
                  {renderMessageCard(msgA, row.index)}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
                  {renderMessageCard(msgB, row.index + 1)}
                </div>
              </div>
            );
          } else if (hasCompare) {
            // Centered layout for single cards when comparative rows are active on screen
            return (
              <div key={`row_${rIdx}`} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                  {renderMessageCard(row.data, row.index)}
                </div>
              </div>
            );
          } else {
            // Standard full-width layout for normal conversations
            return (
              <div key={`row_${rIdx}`} style={{ width: '100%', marginBottom: '16px' }}>
                {renderMessageCard(row.data, row.index)}
              </div>
            );
          }
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default ChatWindow;
