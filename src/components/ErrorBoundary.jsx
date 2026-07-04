/* ErrorBoundary.jsx - React Exception Catcher and Logger for Much */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Much Workspace caught error in boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#1e1e2e', 
          color: '#cdd6f4', 
          minHeight: '100vh', 
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            maxWidth: '800px', 
            width: '100%', 
            backgroundColor: '#181825', 
            borderRadius: '12px', 
            border: '1px solid #f38ba8', 
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: '#f38ba8', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Workspace Render Crash
            </h2>
            <p style={{ color: '#a6adc8', fontSize: '14px', lineHeight: '1.5' }}>
              React encountered an uncaught exception during rendering. See details below:
            </p>
            <pre style={{ 
              backgroundColor: '#11111b', 
              padding: '16px', 
              borderRadius: '8px', 
              overflowX: 'auto', 
              fontSize: '13px', 
              color: '#f5e0dc',
              border: '1px solid #313244',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '16px', 
                padding: '10px 20px', 
                backgroundColor: '#f38ba8', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                color: '#11111b', 
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
