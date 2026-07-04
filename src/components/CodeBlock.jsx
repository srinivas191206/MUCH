/* CodeBlock.jsx - Custom Code block container with WebAssembly Python & JS Interpreter for Much */

import React, { useState } from 'react';
import { Copy, Check, Eye, Play, Terminal, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Global singletons for Pyodide script injection
let pyodideLoadingPromise = null;
let pyodideInstance = null;

const loadPyodideScript = () => {
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve(window.loadPyodide);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
    script.onload = () => resolve(window.loadPyodide);
    script.onerror = (err) => {
      pyodideLoadingPromise = null;
      reject(new Error('Failed to load Pyodide WebAssembly runtime script. Check network connection.'));
    };
    document.head.appendChild(script);
  });

  return pyodideLoadingPromise;
};

function CodeBlock({ language, value, children }) {
  const { setActiveArtifact, chats, currentChatId } = useApp();
  const [copied, setCopied] = useState(false);

  // Interpreter UI states
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code block content:', err);
    }
  };

  const handlePreview = () => {
    const activeChat = chats.find(c => c.id === currentChatId);
    let htmlCode = value;
    let cssCode = '';
    let jsCode = '';
    let targetLanguage = language;
    let titleName = 'Code Preview';

    if (activeChat) {
      const message = activeChat.messages.find(m => m.content && m.content.includes(value));
      if (message) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
        let match;
        const blocks = [];
        while ((match = codeBlockRegex.exec(message.content)) !== null) {
          blocks.push({
            language: match[1]?.toLowerCase() || '',
            code: match[2]
          });
        }

        const htmlBlock = blocks.find(b => b.language === 'html');
        const cssBlock = blocks.find(b => b.language === 'css');
        const jsBlock = blocks.find(b => ['javascript', 'js'].includes(b.language));

        if (htmlBlock) {
          htmlCode = htmlBlock.code;
          if (cssBlock) cssCode = cssBlock.code;
          if (jsBlock) jsCode = jsBlock.code;
          targetLanguage = 'html';
          titleName = 'Interactive Preview';
        }
      }
    }

    let finalCode = htmlCode;
    if (targetLanguage === 'html') {
      if (cssCode) {
        finalCode = finalCode.replace(/<link[^>]*href=["'][^"']*style\.css["'][^>]*>/i, '');
        finalCode = finalCode.replace(/<link[^>]*href=["'][^"']*style\.css["'][^>]*\/>/i, '');
        
        if (finalCode.includes('</head>')) {
          finalCode = finalCode.replace('</head>', `<style>\n${cssCode}\n</style>\n</head>`);
        } else {
          finalCode = `<style>\n${cssCode}\n</style>\n` + finalCode;
        }
      }
      
      if (jsCode) {
        finalCode = finalCode.replace(/<script[^>]*src=["'][^"']*script\.js["'][^>]*><\/script>/i, '');
        finalCode = finalCode.replace(/<script[^>]*src=["'][^"']*script\.js["'][^>]*\/>/i, '');

        if (finalCode.includes('</body>')) {
          finalCode = finalCode.replace('</body>', `<script>\n${jsCode}\n</script>\n</body>`);
        } else {
          finalCode = finalCode + `\n<script>\n${jsCode}\n</script>`;
        }
      }
    }

    setActiveArtifact({
      value: finalCode,
      language: targetLanguage,
      title: titleName
    });
  };

  // Run Code Interpreter Sandbox execution
  const handleRunCode = async () => {
    const lang = language?.toLowerCase();
    setShowOutput(true);
    setIsRunning(true);
    setOutput('Starting execution sandbox...');

    if (['python', 'py'].includes(lang)) {
      try {
        const loadPyodide = await loadPyodideScript();
        if (!pyodideInstance) {
          setOutput('Loading Pyodide WebAssembly packages (this may take a few seconds)...');
          pyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
          });
        }

        setOutput('Executing code...');
        let outputBuffer = [];
        pyodideInstance.setStdout({
          batched: (text) => {
            outputBuffer.push(text);
            setOutput(outputBuffer.join('\n'));
          }
        });
        pyodideInstance.setStderr({
          batched: (text) => {
            outputBuffer.push(text);
            setOutput(outputBuffer.join('\n'));
          }
        });

        // Run python code async
        await pyodideInstance.runPythonAsync(value);

        if (outputBuffer.length === 0) {
          setOutput('(Execution completed successfully with no console print output)');
        }
      } catch (err) {
        setOutput(`Traceback (most recent call last):\n  RuntimeError: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
    } 
    else if (['javascript', 'js'].includes(lang)) {
      const originalLog = console.log;
      const originalError = console.error;
      const logs = [];

      console.log = (...args) => {
        const formatted = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
        logs.push(formatted);
        setOutput(logs.join('\n'));
      };

      console.error = (...args) => {
        const formatted = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
        logs.push(`Error: ${formatted}`);
        setOutput(logs.join('\n'));
      };

      try {
        // Run inside wrapped Function to capture context
        const runFn = new Function(value);
        runFn();

        if (logs.length === 0) {
          setOutput('(Execution completed successfully with no console print output)');
        }
      } catch (err) {
        logs.push(`TypeError: ${err.message}`);
        setOutput(logs.join('\n'));
      } finally {
        console.log = originalLog;
        console.error = originalError;
        setIsRunning(false);
      }
    }
  };

  const supportPreview = ['html', 'svg', 'css', 'javascript', 'js', 'xml'].includes(language?.toLowerCase());
  const supportRun = ['python', 'py', 'javascript', 'js'].includes(language?.toLowerCase());

  return (
    <div className="code-block-container" style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div className="code-block-header" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
        <span className="code-block-lang" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>{language || 'code'}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {supportRun && (
            <button 
              type="button" 
              onClick={handleRunCode} 
              className="code-copy-btn"
              title="Run code in sandbox"
              style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              disabled={isRunning}
            >
              <Play size={12} fill="currentColor" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}
          {supportPreview && (
            <button 
              type="button" 
              onClick={handlePreview} 
              className="code-copy-btn"
              title="Open preview panel"
              style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          )}
          <button 
            type="button" 
            onClick={handleCopy} 
            className="code-copy-btn"
            aria-label="Copy code to clipboard"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      
      {/* Main highlighted scrollable viewport */}
      <pre className="code-block-pre scroller" style={{ margin: 0, padding: '14px', overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', fontSize: '13px' }}>
        {children}
      </pre>

      {/* Console Output Drawer */}
      {showOutput && (
        <div style={{
          backgroundColor: '#0c0f12',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#e5e7eb'
        }}>
          {/* Console Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 12px',
            backgroundColor: '#161b22',
            borderBottom: '1px solid #21262d',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <Terminal size={12} />
              <span>Console Output</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setOutput('')}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                title="Clear console output"
              >
                <Trash2 size={11} /> Clear
              </button>
              <button 
                onClick={() => setShowOutput(false)}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                title="Close console"
              >
                <X size={12} /> Close
              </button>
            </div>
          </div>

          {/* Console Viewport */}
          <pre style={{
            margin: 0,
            padding: '12px',
            overflowY: 'auto',
            maxHeight: '180px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: output.startsWith('Traceback') || output.startsWith('Error') || output.startsWith('TypeError') ? '#f87171' : '#34d399',
            lineHeight: '1.5'
          }}>
            {output || '(Console is empty)'}
            {isRunning && (
              <span className="console-cursor" style={{ marginLeft: '4px', animation: 'blink 1s step-end infinite' }}>▒</span>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

export default CodeBlock;
