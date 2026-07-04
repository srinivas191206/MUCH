import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Paperclip, Search, Compass, Cpu, Mic, ArrowUp, Code, Terminal, Square, X, Image
} from 'lucide-react';

// Loader helper for PDF.js CDN
const loadPdfjs = () => {
  return new Promise((resolve) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (arrayBuffer) => {
  const pdfjsLib = await loadPdfjs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
};

// Client-Side Keyword Matching Search (RAG)
const performRAG = (fileText, query) => {
  if (fileText.length < 2000) {
    return fileText; // Small file: Inject entire context (safe for token limits)
  }

  // Split document by paragraphs or chunks of ~500 characters
  const paragraphs = fileText.split(/\n\s*\n/);
  const chunks = [];
  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmed];
      let currentChunk = '';
      sentences.forEach(s => {
        if (currentChunk.length + s.length > 500) {
          chunks.push(currentChunk.trim());
          currentChunk = s;
        } else {
          currentChunk += s;
        }
      });
      if (currentChunk) chunks.push(currentChunk.trim());
    } else {
      chunks.push(trimmed);
    }
  });

  if (chunks.length === 0) return fileText;

  // Score chunks by keyword intersections
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) {
    return chunks.slice(0, 2).join('\n\n'); // Limit to top 2 chunks
  }

  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    queryTerms.forEach(term => {
      if (chunkLower.includes(term)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  // Sort and retrieve top 2 matched chunks
  scoredChunks.sort((a, b) => b.score - a.score);
  const selected = scoredChunks
    .filter(item => item.score > 0)
    .slice(0, 2)
    .map(item => item.chunk);

  if (selected.length === 0) {
    return chunks.slice(0, 2).join('\n\n');
  }

  return selected.join('\n\n');
};

function ChatInput({ onSendMessage, defaultProvider, defaultModel }) {
  const { 
    isGenerating, 
    cancelGeneration, 
    inputText, 
    setInputText, 
    setIsMcpOpen, 
    token,
    currentChatId,
    generateAIImage,
    createNewChat
  } = useApp();
  const navigate = useNavigate();
  const [showPromptHint, setShowPromptHint] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [readingFile, setReadingFile] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [mcpStatus, setMcpStatus] = useState('disconnected');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Image Generation states
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageModel, setImageModel] = useState('flux');
  const [imageAspect, setImageAspect] = useState('landscape');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Voice input is not supported in this browser. Please try Chrome, Edge, or Safari!");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => {
            const separator = prev.endsWith(' ') || prev.length === 0 ? '' : ' ';
            return prev + separator + finalTranscript;
          });
        }
      };

      rec.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        if (err.error === 'not-allowed') {
          alert("⚠️ Microphone access was denied. Please allow microphone permissions in Safari settings or by clicking the microphone icon in your address bar.");
        } else {
          alert(`🎙️ Microphone / Speech Error: ${err.error}. Check browser permissions.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      alert(`⚠️ Failed to start speech engine: ${err.message}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Voice typing is not supported in this browser version. Please try Chrome, Edge, or update Safari.");
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5001/api/mcp/servers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const anyActive = data.some(s => s.status === 'connected');
        setMcpStatus(anyActive ? 'connected' : 'disconnected');
      })
      .catch(err => console.error(err));
  }, [token]);

  // Auto-resize the textarea based on content height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [inputText]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    
    if (value.startsWith('/')) {
      setShowPromptHint(true);
    } else {
      setShowPromptHint(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setReadingFile(true);
    const parsedFiles = [];

    try {
      for (const file of files) {
        let text = '';
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          text = await extractTextFromPdf(arrayBuffer);
        } else {
          // Read text/code documents
          text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
          });
        }

        if (text && text.trim()) {
          parsedFiles.push({
            name: file.name,
            text,
            size: file.size
          });
        }
      }

      if (parsedFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...parsedFiles]);
      } else {
        alert("⚠️ Much was unable to extract text from the selected document(s). Please try text-based PDF or text/code files.");
      }
    } catch (err) {
      console.error('Error reading attachments:', err);
      alert('Failed to parse document: ' + err.message);
    } finally {
      setReadingFile(false);
      e.target.value = ''; // Reset input element
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
    }
    
    if (isGenerating) {
      cancelGeneration();
      return;
    }

    if (!inputText.trim() && attachedFiles.length === 0) return;

    onSendMessage && onSendMessage(inputText.trim(), attachedFiles, webSearchActive);
    
    setInputText('');
    setAttachedFiles([]);
    setShowPromptHint(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleInsertShortcut = (text) => {
    setInputText(text);
    setShowPromptHint(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleGenerateImageSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!imagePrompt.trim()) return;

    const promptText = imagePrompt.trim();
    const model = imageModel;
    const aspect = imageAspect;

    setImagePrompt('');
    setShowImageGen(false);

    let targetChatId = currentChatId;
    if (!targetChatId) {
      targetChatId = createNewChat(null);
      navigate(`/chat/${targetChatId}`, { replace: true });
    }

    generateAIImage(targetChatId, promptText, model, aspect);
  };

  return (
    <div className="input-area-container">
      {/* Hidden file input */}
      <input 
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md,.json,.csv,.js,.py,.html,.css,.xml,.pdf"
        style={{ display: 'none' }}
      />

      {/* Tooltip hint when typing / */}
      {showPromptHint && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '8px 12px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '8px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            border: '1px solid var(--border-secondary)',
            boxShadow: 'var(--shadow-premium)'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Quick Prompts
          </div>
          
          <button 
            type="button"
            onClick={() => handleInsertShortcut('Explain React Server Components simply.')}
            style={{ 
              padding: '6px 8px', 
              textAlign: 'left', 
              borderRadius: 'var(--radius-sm)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              transition: 'background var(--transition-fast)' 
            }}
            className="chat-item"
          >
            <Code size={13} style={{ color: 'var(--accent-color)' }} />
            <span>Explain RSC</span>
          </button>
          
          <button 
            type="button"
            onClick={() => handleInsertShortcut('Write unit tests for this React component.')}
            style={{ 
              padding: '6px 8px', 
              textAlign: 'left', 
              borderRadius: 'var(--radius-sm)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              transition: 'background var(--transition-fast)' 
            }}
            className="chat-item"
          >
            <Terminal size={13} style={{ color: 'hsl(142, 70%, 45%)' }} />
            <span>Write Unit Tests</span>
          </button>
        </div>
      )}

      {/* Message pill */}
      <form onSubmit={handleSubmit} className="chat-input-pill" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* Render attached file indicators */}
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '6px 12px 2px 12px' }}>
            {attachedFiles.map((file, fIdx) => (
              <div 
                key={fIdx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--border-primary)',
                  border: '1px solid var(--border-secondary)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  width: 'fit-content'
                }}
              >
                <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <button 
                  type="button" 
                  onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== fIdx))}
                  style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {readingFile && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 12px 2px 12px', fontStyle: 'italic' }}>
            Reading document and extracting text...
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? "Much is generating a response..." : `Message Much using ${defaultModel}...`}
          className="input-text-area scroller"
          rows={1}
          disabled={isGenerating}
          aria-label="Message Input"
        />

        {/* Lower control toolbar */}
        <div className="input-actions-bar">
          <div className="input-actions-left">
            <button 
              type="button" 
              className="input-action-icon-only" 
              title="Attach files"
              onClick={handleFileClick}
              disabled={isGenerating || readingFile}
              aria-label="Attach files to message"
            >
              <Paperclip size={16} />
            </button>
            <button 
              type="button" 
              className="input-action-btn"
              disabled={isGenerating}
              title="Toggle Web Search"
              onClick={() => setWebSearchActive(prev => !prev)}
              style={webSearchActive ? {
                borderColor: 'var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                backgroundColor: 'rgba(6, 182, 212, 0.1)'
              } : {}}
            >
              <Search size={14} />
              <span>Search</span>
            </button>
            <button 
              type="button" 
              className="input-action-btn"
              disabled={isGenerating}
              title="Toggle Artifact creation"
            >
              <Compass size={14} />
              <span>Artifacts</span>
            </button>
            <button 
              type="button" 
              className="input-action-btn"
              disabled={isGenerating}
              title="Generate AI Image"
              onClick={() => {
                setImagePrompt(''); // Reset old prompt
                setShowImageGen(true);
              }}
            >
              <Image size={14} />
              <span>Draw Image</span>
            </button>
            <button 
              type="button" 
              className="input-action-btn"
              disabled={isGenerating}
              title="MCP Server Status"
              onClick={() => setIsMcpOpen(true)}
            >
              <Cpu size={14} style={{ color: mcpStatus === 'connected' ? 'var(--accent-cyan)' : 'inherit' }} />
              <span>MCP Servers</span>
              {mcpStatus === 'connected' && (
                <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: '#22c55e', marginLeft: '4px' }} />
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              className={`input-action-icon-only ${isListening ? 'listening-active' : ''}`}
              disabled={isGenerating}
              onClick={toggleListening}
              title={isListening ? "Stop Voice Input" : "Start Voice Input"}
              aria-label="Toggle voice input"
              style={isListening ? { 
                color: '#ef4444', 
                backgroundColor: 'rgba(239, 68, 68, 0.12)'
              } : {}}
            >
              <Mic size={16} />
            </button>
            
            {isGenerating ? (
              <button 
                type="button" 
                onClick={cancelGeneration} 
                className="input-send-btn glow-border" 
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
                title="Stop generating"
                aria-label="Stop generating"
              >
                <Square size={12} fill="var(--text-primary)" style={{ color: 'var(--text-primary)' }} />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!inputText.trim() && attachedFiles.length === 0} 
                className="input-send-btn" 
                title="Send Message"
                aria-label="Send Message"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      {showImageGen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 17, 0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div 
            className="glass-panel"
            style={{
              width: '90%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: 'var(--shadow-premium)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={18} style={{ color: 'var(--accent-color)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>AI Image Generator</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowImageGen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGenerateImageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Image Prompt / Concept
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A futuristic cybernetic garden under a glass dome, vibrant colors, neon details, highly detailed..."
                  required
                  rows={3}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Model Engine
                  </label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="flux">Flux AI (High Quality)</option>
                    <option value="turbo">Stable Diffusion Turbo (Fast)</option>
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Aspect Ratio
                  </label>
                  <select
                    value={imageAspect}
                    onChange={(e) => setImageAspect(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="landscape">Landscape (4:3)</option>
                    <option value="square">Square (1:1)</option>
                    <option value="portrait">Portrait (3:4)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="sidebar-btn"
                  onClick={() => setShowImageGen(false)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-btn"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Generate Image
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ChatInput;
