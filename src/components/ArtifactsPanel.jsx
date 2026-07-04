/* ArtifactsPanel.jsx - Interactive Split-Screen Preview, Code Panel & Python Sandbox for Much */

import React, { useState, useEffect, useRef } from 'react';
import { X, Code, Eye, Copy, Check, Sparkles, Play, Terminal, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import SafeImage from './SafeImage';

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
      reject(new Error('Failed to load Pyodide WebAssembly runtime script.'));
    };
    document.head.appendChild(script);
  });
  return pyodideLoadingPromise;
};

export default function ArtifactsPanel() {
  const { activeArtifact, setActiveArtifact } = useApp();
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  // Python Sandbox States
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [plotImage, setPlotImage] = useState(null);
  const [runError, setRunError] = useState('');

  // Default to code view if preview is not supportable
  useEffect(() => {
    if (activeArtifact) {
      const lang = activeArtifact.language?.toLowerCase();
      const supportable = ['html', 'svg', 'xml', 'css', 'javascript', 'js', 'python', 'py'].includes(lang);
      setActiveTab(supportable ? 'preview' : 'code');
      
      // Clear previous execution states when switching artifacts
      setOutput('');
      setPlotImage(null);
      setRunError('');
    }
  }, [activeArtifact]);

  if (!activeArtifact) return null;

  const { value: code, language, title } = activeArtifact;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy artifact code:', err);
    }
  };

  // Run Python inside Wasm sandbox
  const handleRunPython = async () => {
    setIsRunning(true);
    setRunError('');
    setOutput('Starting Pyodide WebAssembly execution sandbox...');
    setPlotImage(null);

    try {
      const loadPyodide = await loadPyodideScript();
      if (!pyodideInstance) {
        setOutput('Loading Pyodide WebAssembly core modules (this may take a few seconds)...');
        pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
        });
      }

      // Check package requirements
      const packagesToLoad = [];
      if (code.includes('matplotlib') || code.includes('plt.')) {
        packagesToLoad.push('matplotlib');
      }
      if (code.includes('pandas') || code.includes('pd.')) {
        packagesToLoad.push('pandas');
      }
      if (code.includes('numpy') || code.includes('np.')) {
        packagesToLoad.push('numpy');
      }

      if (packagesToLoad.length > 0) {
        setOutput(`Loading Python packages: ${packagesToLoad.join(', ')}...`);
        await pyodideInstance.loadPackage(packagesToLoad);
      }

      setOutput('Executing Python script...');
      let outputBuffer = [];
      let capturedPlot = null;

      pyodideInstance.setStdout({
        batched: (text) => {
          if (text.startsWith('__PLOT_BASE64__::')) {
            capturedPlot = text.replace('__PLOT_BASE64__::', '');
          } else {
            outputBuffer.push(text);
            setOutput(outputBuffer.join('\n'));
          }
        }
      });

      pyodideInstance.setStderr({
        batched: (text) => {
          outputBuffer.push(text);
          setOutput(outputBuffer.join('\n'));
        }
      });

      // Clear any prior active matplotlib figures
      await pyodideInstance.runPythonAsync(`
import sys
if 'matplotlib.pyplot' in sys.modules:
    import matplotlib.pyplot as plt
    plt.close('all')
      `);

      // Run code
      await pyodideInstance.runPythonAsync(code);

      // Extract current figure if matplotlib has active axes
      await pyodideInstance.runPythonAsync(`
import sys
if 'matplotlib' in sys.modules:
    import matplotlib.pyplot as plt
    import io, base64
    try:
        fig = plt.gcf()
        if fig and fig.get_axes():
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            buf.seek(0)
            img_str = base64.b64encode(buf.read()).decode('utf-8')
            print("__PLOT_BASE64__::" + img_str)
            plt.close('all')
    except Exception as e:
        print("Matplotlib export error: " + str(e))
      `);

      if (capturedPlot) {
        setPlotImage(`data:image/png;base64,${capturedPlot}`);
      }

      if (outputBuffer.length === 0) {
        setOutput('Code executed successfully. No stdout logged.');
      }

    } catch (err) {
      console.error(err);
      setRunError(err.message);
      setOutput(`Traceback (most recent call last):\n  RuntimeError: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Compile sandboxed iframe content depending on language
  const getIframeSrcDoc = () => {
    const lang = language?.toLowerCase();
    
    if (lang === 'html') {
      return code;
    }
    
    if (lang === 'svg') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 24px;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #0f172a;
              color: #f8fafc;
              font-family: sans-serif;
              box-sizing: border-box;
            }
            svg {
              max-width: 100%;
              max-height: 90vh;
              filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
        </html>
      `;
    }

    if (lang === 'javascript' || lang === 'js') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background-color: #0f172a;
              color: #38bdf8;
              font-family: monospace;
              font-size: 14px;
              line-height: 1.5;
            }
            #console {
              background-color: #020617;
              border: 1px solid #1e293b;
              border-radius: 8px;
              padding: 16px;
              min-height: 80vh;
              white-space: pre-wrap;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            }
            .log-info { color: #f8fafc; }
            .log-warn { color: #f59e0b; }
            .log-error { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <h3>JavaScript Sandbox Output console:</h3>
          <div id="console"></div>

          <script>
            const consoleDiv = document.getElementById('console');
            
            // Redirect console logs to sandbox UI
            const log = (type, args) => {
              const text = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
              ).join(' ');
              const line = document.createElement('div');
              line.className = 'log-' + type;
              line.textContent = '> ' + text;
              consoleDiv.appendChild(line);
            };

            console.log = (...args) => log('info', args);
            console.warn = (...args) => log('warn', args);
            console.error = (...args) => log('error', args);

            try {
              console.log('Running script...');
              ${code}
              console.log('Script execution completed.');
            } catch (err) {
              console.error(err.message);
            }
          </script>
        </body>
        </html>
      `;
    }

    // Fallback/CSS preview page
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background-color: #0f172a;
            color: #f8fafc;
            font-family: sans-serif;
            text-align: center;
          }
          style {
            display: block;
            white-space: pre;
            background-color: #020617;
            padding: 16px;
            border-radius: 8px;
            text-align: left;
            font-family: monospace;
            color: #10b981;
            margin-top: 16px;
          }
        </style>
        <style>${lang === 'css' ? code : ''}</style>
      </head>
      <body>
        <h3>Styling Applied to Sandbox Environment</h3>
        <p>Your CSS styling has been injected. Preview details:</p>
        <button style="padding: 10px 20px; border-radius: 6px; background-color: var(--accent-color, #6366f1); color: white; border: none;">
          Sample Button Element
        </button>
      </body>
      </html>
    `;
  };

  const isPython = ['python', 'py'].includes(language?.toLowerCase());
  const isImage = language?.toLowerCase() === 'image';
  const supportPreview = ['html', 'svg', 'xml', 'css', 'javascript', 'js', 'python', 'py', 'image'].includes(language?.toLowerCase());

  return (
    <div 
      className="glass-panel"
      style={{
        width: '50%',
        minWidth: '360px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border-primary)',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: 'var(--bg-secondary)',
        position: 'relative',
        zIndex: 40
      }}
    >
      {/* Header bar */}
      <div 
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Sparkles size={16} style={{ color: 'var(--accent-color)' }} />
          <span 
            style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              textOverflow: 'ellipsis', 
              overflow: 'hidden', 
              whiteSpace: 'nowrap' 
            }}
          >
            {title || `Artifact: ${language.toUpperCase()}`}
          </span>
        </div>

        {/* Tab Switcher */}
        {supportPreview && (
          <div 
            style={{ 
              display: 'flex', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '6px', 
              padding: '2px' 
            }}
          >
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: activeTab === 'preview' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Eye size={12} />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: activeTab === 'code' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'code' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Code size={12} />
              Code
            </button>
          </div>
        )}

        {/* Action controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className="sidebar-btn" 
            onClick={handleCopy}
            title="Copy source code"
            style={{ padding: '6px' }}
          >
            {copied ? <Check size={14} style={{ color: 'hsl(142, 70%, 45%)' }} /> : <Copy size={14} />}
          </button>
          <button 
            className="sidebar-btn" 
            onClick={() => setActiveArtifact(null)}
            title="Close panel"
            style={{ padding: '6px' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main viewport area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'preview' && supportPreview ? (
          isPython ? (
            /* Python WebAssembly Visual Canvas Sandbox */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0f172a', padding: '16px', boxSizing: 'border-box', gap: '16px' }}>
              {/* Control Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
                  Python WebAssembly Sandbox
                </span>
                <button
                  onClick={handleRunPython}
                  disabled={isRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isRunning ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  <Play size={12} fill="white" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>

              {/* Content Split Layout */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                {/* Graphics Canvas Panel */}
                <div 
                  style={{ 
                    flex: 1.2, 
                    backgroundColor: '#020617', 
                    borderRadius: '8px', 
                    border: '1px solid #1e293b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '12px'
                  }}
                >
                  {plotImage ? (
                    <img 
                      src={plotImage} 
                      alt="Matplotlib Plot Output" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                    />
                  ) : (
                    <div style={{ color: '#475569', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={28} style={{ color: '#334155' }} />
                      <span style={{ color: '#64748b' }}>No generated graphs to display. Click Run Code!</span>
                    </div>
                  )}
                </div>

                {/* Console Logs Panel */}
                <div 
                  style={{ 
                    flex: 0.8, 
                    backgroundColor: '#020617', 
                    borderRadius: '8px', 
                    border: '1px solid #1e293b', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden' 
                  }}
                >
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>
                    <Terminal size={11} />
                    <span>Stdout Console</span>
                  </div>
                  <pre 
                    className="scroller" 
                    style={{ 
                      flex: 1, 
                      margin: 0, 
                      padding: '12px', 
                      overflowY: 'auto', 
                      fontFamily: 'monospace', 
                      fontSize: '12px', 
                      lineHeight: '1.5', 
                      color: runError ? '#f87171' : '#38bdf8', 
                      whiteSpace: 'pre-wrap' 
                    }}
                  >
                    {output || 'Sandbox idle. Waiting for execution...'}
                  </pre>
                </div>
              </div>
            </div>
          ) : isImage ? (
            /* Premium Downloadable Image Canvas */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#020617', padding: '24px', alignItems: 'center', justifyContent: 'center', gap: '24px', boxSizing: 'border-box' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}>
                <SafeImage 
                  src={code} 
                  alt="AI Generated Visual Artifact" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)' }} 
                />
              </div>
              <a 
                href={code} 
                download="much_generated_image.png" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  cursor: 'pointer'
                }}
              >
                Download PNG Image
              </a>
            </div>
          ) : (
            /* Sandboxed iframe execution environment */
            <iframe
              srcDoc={getIframeSrcDoc()}
              title="Artifact Preview Sandbox"
              sandbox="allow-scripts"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#0f172a'
              }}
            />
          )
        ) : (
          /* Code View container */
          <pre 
            className="scroller"
            style={{
              margin: 0,
              padding: '16px',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
