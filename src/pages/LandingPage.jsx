import React, { useState } from 'react';
import { 
  Star, 
  ArrowRight, 
  Bot, 
  Terminal, 
  Layers, 
  Code, 
  Search, 
  Plug, 
  Brain, 
  Globe, 
  Lock, 
  Sun, 
  Moon, 
  Languages,
  Plus,
  MessageSquare,
  ChevronDown,
  Send,
  Sliders,
  FileText
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AuthOverlay from '../components/AuthOverlay';

const GithubIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function LandingPage() {
  const { user, login, signup, settings, updateTheme } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQuickstartOpen, setIsQuickstartOpen] = useState(false);
  const [quickstartTab, setQuickstartTab] = useState(0);
  const [quickstartDemoRun, setQuickstartDemoRun] = useState(false);
  const [quickstartDemoOutput, setQuickstartDemoOutput] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    updateTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  const handleTryDemo = async () => {
    // Instantly log in using a mock guest session for users to try out the app
    try {
      const mockEmail = 'guest@much.ai';
      const mockPassword = 'sociallogin123';
      let success = await login(mockEmail, mockPassword);
      if (!success) {
        await signup(mockEmail, mockPassword);
      }
    } catch (err) {
      console.error('Demo login error:', err);
      // Fallback redirect
      setIsAuthOpen(true);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: isDark ? '#090d16' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        fontFamily: 'var(--font-sans, "Poppins", sans-serif)',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        transition: 'background-color 0.3s, color 0.3s'
      }}
    >
      {/* 1. HEADER / NAVIGATION BAR */}
      <header 
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          backgroundColor: isDark ? 'rgba(9, 13, 22, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          zIndex: 100
        }}
      >
        {/* Left Brand info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Much Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>Much</span>
        </div>

        {/* Center Mock Links */}
        <nav style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: '500' }}>
          <a href="#features" style={{ color: isDark ? '#9ca3af' : '#4b5563', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#quickstart" onClick={(e) => { e.preventDefault(); setIsQuickstartOpen(true); }} style={{ color: isDark ? '#9ca3af' : '#4b5563', textDecoration: 'none', transition: 'color 0.2s' }}>Docs</a>
          <a href="#about" style={{ color: isDark ? '#9ca3af' : '#4b5563', textDecoration: 'none', transition: 'color 0.2s' }}>Changelog</a>
        </nav>

        {/* Right Search, Settings and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mock Search Bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Search Much..." 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{
                width: '180px',
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#9ca3af' : '#4b5563',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
            title="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Selector */}
          <button 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#9ca3af' : '#4b5563',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
            title="Change language"
          >
            <Languages size={18} />
          </button>

          {/* GitHub Star Link */}
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: isDark ? '#9ca3af' : '#4b5563', display: 'flex', alignItems: 'center' }}
          >
            <GithubIcon size={18} />
          </a>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '80px 24px 60px 24px',
          maxWidth: '850px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >

        {/* Hero Title */}
        <h1 
          style={{
            fontSize: '64px',
            fontWeight: '800',
            margin: '0 0 24px 0',
            letterSpacing: '-0.03em',
            lineHeight: '1.1',
            color: isDark ? '#ffffff' : '#111827'
          }}
        >
          The Local-First <br />
          <span style={{ color: '#2563eb' }}>AI Platform</span>
        </h1>

        {/* Hero Subtitle */}
        <p 
          style={{
            fontSize: '20px',
            lineHeight: '1.6',
            color: isDark ? '#9ca3af' : '#4b5563',
            margin: '0 0 36px 0',
            maxWidth: '680px'
          }}
        >
          Much brings together all your AI conversations, sandboxed code execution, and Model Context Protocol servers in one unified, local-first workspace.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setIsAuthOpen(true)}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)',
              transition: 'background-color 0.2s'
            }}
          >
            Get Started
            <ArrowRight size={16} />
          </button>

          <button 
            onClick={handleTryDemo}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              backgroundColor: isDark ? 'transparent' : '#ffffff',
              color: isDark ? '#ffffff' : '#4b5563',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Try Demo
          </button>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT PREVIEW */}
      <section style={{ width: '100%', maxWidth: '1000px', margin: '0 auto 100px auto', padding: '0 24px', boxSizing: 'border-box', position: 'relative' }}>
        {/* Colorful Radial Glow Background Behind Mockup */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 100%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        ></div>

        <div 
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(11, 15, 25, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            boxShadow: isDark 
              ? '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px 0 rgba(37, 99, 235, 0.05)' 
              : '0 30px 60px -15px rgba(0, 0, 0, 0.08), 0 0 50px 0 rgba(37, 99, 235, 0.02)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            aspectRatio: '1.68',
            zIndex: 1
          }}
        >
          {/* Browser Window Header Mockup */}
          <div 
            style={{ 
              height: '42px', 
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0 18px',
              gap: '6px',
              backgroundColor: isDark ? 'rgba(6, 9, 15, 0.5)' : 'rgba(243, 244, 246, 0.5)'
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            
            {/* Mock address bar */}
            <div 
              style={{
                flex: 1,
                maxWidth: '450px',
                height: '24px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
                borderRadius: '6px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: isDark ? '#9ca3af' : '#6b7280',
                letterSpacing: '0.01em'
              }}
            >
              much.ai/workspace
            </div>
          </div>

          {/* Workspace Body Frame mockup */}
          <div style={{ display: 'flex', height: 'calc(100% - 42px)', width: '100%' }}>
            {/* Sidebar Mock */}
            <div style={{ width: '22%', borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: isDark ? 'rgba(6, 9, 15, 0.3)' : 'rgba(255, 255, 255, 0.4)', padding: '16px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '20px',
                cursor: 'default',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
              }}>
                <Plus size={12} />
                <span>New Chat</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: isDark ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Recent Chats</span>
                {[
                  'Financial data analysis',
                  'Matplotlib sales plot',
                  'SQLite query via MCP',
                  'Stable Diffusion render',
                  'Multi-model comparison'
                ].map((title, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: isDark ? '#cbd5e1' : '#4b5563', padding: '6px 8px', borderRadius: '6px', backgroundColor: idx === 1 ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37, 99, 235, 0.06)') : 'transparent', border: idx === 1 ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MessageSquare size={12} style={{ color: '#2563eb', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Frame Mock */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', backgroundColor: isDark ? 'transparent' : 'rgba(249, 250, 251, 0.3)' }}>
              {/* Header inside Workspace Mock */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                  <span style={{ color: isDark ? '#ffffff' : '#111827' }}>Gemini 2.5 Flash</span>
                  <ChevronDown size={12} style={{ color: '#9ca3af' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: isDark ? '#cbd5e1' : '#4b5563', fontWeight: '500' }}>Workspace</span>
                </div>
              </div>

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100% - 90px)', overflow: 'hidden' }}>
                {/* User Message */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '11px', lineHeight: '1.5', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' }}>
                    Can you query my database via MCP and plot the sales growth by month?
                  </div>
                </div>

                {/* AI Response */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0, border: '1px solid rgba(37, 99, 235, 0.15)' }}>M</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#374151', lineHeight: '1.5' }}>
                      Here is the sales growth line plot generated using Python Matplotlib in your local Pyodide sandbox:
                    </div>
                    {/* Plot SVG Graphic */}
                    <div style={{ width: '220px', height: '90px', borderRadius: '8px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', backgroundColor: isDark ? '#0b0f19' : '#ffffff', padding: '8px', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 40">
                        {/* Area Gradient */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        <path d="M 10 35 L 30 25 L 50 28 L 70 12 L 90 5 L 90 35 Z" fill="url(#chartGrad)" />
                        <path d="M 10 35 L 30 25 L 50 28 L 70 12 L 90 5" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                        <circle cx="10" cy="35" r="1.5" fill="#2563eb" />
                        <circle cx="30" cy="25" r="1.5" fill="#2563eb" />
                        <circle cx="50" cy="28" r="1.5" fill="#2563eb" />
                        <circle cx="70" cy="12" r="1.5" fill="#2563eb" />
                        <circle cx="90" cy="5" r="1.5" fill="#2563eb" />
                        {/* Mock labels */}
                        <text x="10" y="39" fontSize="3" fill="#9ca3af" textAnchor="middle">Jan</text>
                        <text x="30" y="39" fontSize="3" fill="#9ca3af" textAnchor="middle">Feb</text>
                        <text x="50" y="39" fontSize="3" fill="#9ca3af" textAnchor="middle">Mar</text>
                        <text x="70" y="39" fontSize="3" fill="#9ca3af" textAnchor="middle">Apr</text>
                        <text x="90" y="39" fontSize="3" fill="#9ca3af" textAnchor="middle">May</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar Mock */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  height: '38px',
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : '#ffffff',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                }}
              >
                <Sliders size={12} style={{ color: '#9ca3af' }} />
                <span style={{ flex: 1, fontSize: '10px', color: '#9ca3af' }}>Ask Much anything...</span>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                  <Send size={10} />
                </div>
              </div>
            </div>

            {/* Right Drawer Mock */}
            <div style={{ width: '20%', borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: isDark ? 'rgba(6, 9, 15, 0.3)' : 'rgba(255, 255, 255, 0.4)', padding: '16px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '20px' }}>
                <Sliders size={12} style={{ color: '#2563eb' }} />
                <span>Parameters</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Temperature', val: '0.7', pct: '70%' },
                  { label: 'Top P', val: '0.9', pct: '90%' },
                  { label: 'Max Tokens', val: '4096', pct: '60%' }
                ].map((param, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '500', color: isDark ? '#cbd5e1' : '#4b5563' }}>
                      <span>{param.label}</span>
                      <span style={{ color: '#2563eb', fontWeight: '600' }}>{param.val}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderRadius: '2px', position: 'relative' }}>
                      <div style={{ width: param.pct, height: '100%', backgroundColor: '#2563eb', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EVERYTHING YOU NEED FEATURE GRID */}
      <section id="features" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto 100px auto', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb' }}>Platform</span>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 12px 0', letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#111827' }}>Engineered for high-performance AI</h2>
          <p style={{ fontSize: '16px', color: '#9ca3af', margin: 0 }}>A professional-grade local ecosystem offering sandboxed runtimes, multi-model execution, and vector-RAG pipelines.</p>
        </div>

        {/* Feature Bento Grid */}
        <div className="bento-grid">
          {/* Card 1: Multi-Model Hub (1 Col) */}
          <div className="bento-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Unified Models Hub</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Hot-swap between Gemini, Groq, OpenRouter, and Ollama inside a single chat stream.
              </p>
            </div>
            
            {/* Model Stack Pill graphic */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontWeight: '600' }}>Gemini 2.5 Flash</span>
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.2)', fontWeight: '600' }}>Llama 3.3 70B</span>
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', fontWeight: '600' }}>DeepSeek R1</span>
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)', fontWeight: '600' }}>Ollama / Local</span>
            </div>
          </div>

          {/* Card 2: Code Interpreter & Matplotlib (2 Cols) */}
          <div className="bento-card bento-span-2" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Terminal size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Pyodide Wasm Sandbox</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Run Python scripts, compile Pandas queries, and render interactive Matplotlib plots natively in your browser.
              </p>
            </div>
            
            {/* Visual Code Mockup */}
            <div style={{ flex: '1 1 280px', height: '140px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: isDark ? '#0b0f19' : '#f8fafc', display: 'flex', overflow: 'hidden' }}>
              {/* Code Panel */}
              <div style={{ width: '50%', borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', padding: '12px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '9px', color: isDark ? '#9ca3af' : '#4b5563' }}>
                <div style={{ color: '#ec4899' }}>import matplotlib.pyplot as plt</div>
                <div style={{ color: '#ec4899' }}>import numpy as np</div>
                <div>x = np.linspace(0, 10, 100)</div>
                <div>plt.plot(x, np.sin(x))</div>
                <div style={{ color: '#2563eb' }}>plt.show()</div>
              </div>
              {/* Chart Panel */}
              <div style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                {/* Mini SVG graph */}
                <svg width="80" height="60" viewBox="0 0 80 60">
                  <path d="M 10 50 Q 25 10, 40 50 T 70 50" fill="none" stroke="#2563eb" strokeWidth="2" />
                  <line x1="5" y1="50" x2="75" y2="50" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Interactive Artifacts (2 Cols) */}
          <div className="bento-card bento-span-2" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '24px' }}>
            {/* Visual React Mockup */}
            <div style={{ flex: '1 1 280px', height: '140px', borderRadius: '8px', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: isDark ? '#0b0f19' : '#f8fafc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '24px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: isDark ? '#06090f' : '#f1f5f9', display: 'flex', gap: '8px', padding: '0 8px', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#2563eb', borderBottom: '2px solid #2563eb', height: '100%', display: 'flex', alignItems: 'center' }}>Preview</span>
                <span style={{ fontSize: '9px', color: '#9ca3af' }}>Code</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0f172a' : '#ffffff', gap: '10px' }}>
                {/* Tiny CSS button mockup */}
                <button style={{ padding: '6px 12px', fontSize: '9px', color: '#ffffff', backgroundColor: '#2563eb', borderRadius: '4px', border: 'none', cursor: 'default' }}>Click Me</button>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Interactive Artifacts</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Build and run live React components, static HTML pages, and Mermaid flow diagrams side-by-side.
              </p>
            </div>
          </div>

          {/* Card 4: MCP Ecosystem (1 Col) */}
          <div className="bento-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plug size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>MCP Ecosystem</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Plug models directly into filesystem paths, SQLite databases, and GitHub repositories using standard MCP.
              </p>
            </div>
            
            {/* Visual Node Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }}></div>
              <div style={{ height: '1px', flex: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', borderStyle: 'dashed' }}></div>
              <div style={{ padding: '4px 8px', borderRadius: '4px', border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', fontSize: '9px', backgroundColor: isDark ? '#111827' : '#f1f5f9' }}>Mock Server</div>
              <div style={{ height: '1px', flex: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', borderStyle: 'dashed' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            </div>
          </div>

          {/* Card 5: RAG Batch Search (1 Col) */}
          <div className="bento-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Semantic Batch RAG</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Upload multiple PDF, TXT, or JSON documents. Search and query them simultaneously via local vector mappings.
              </p>
            </div>
            
            {/* Document badge icons list */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.1)', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: isDark ? 'rgba(37, 99, 235, 0.05)' : '#ffffff' }}>
                <FileText size={12} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: '500' }}>report.pdf</span>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.1)', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: isDark ? 'rgba(37, 99, 235, 0.05)' : '#ffffff' }}>
                <FileText size={12} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: '500' }}>data.csv</span>
              </div>
            </div>
          </div>

          {/* Card 6: Privacy Memory (1 Col) */}
          <div className="bento-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Local Privacy Memory</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                Your model settings, memories, and chats are encrypted and stored inside your local MongoDB database.
              </p>
            </div>
            
            {/* Encryption check badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
              <Lock size={12} fill="#10b981" /> 100% Local Database Encrypted
            </div>
          </div>
        </div>
      </section>

      {/* 5. START BUILDING CALL TO ACTION */}
      <section 
        id="quickstart"
        style={{
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto 100px auto',
          padding: '0 24px',
          boxSizing: 'border-box'
        }}
      >
        <div 
          style={{
            width: '100%',
            borderRadius: '16px',
            padding: '60px 40px',
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.03)' : '#f8fafc',
            border: isDark ? '1px solid rgba(37, 99, 235, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxSizing: 'border-box',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Start building with Much</h2>
          <p style={{ fontSize: '16px', color: '#9ca3af', margin: '0 0 8px 0', maxWidth: '480px' }}>
            Get up and running in minutes with our quickstart workspace environment.
          </p>
          <button 
            onClick={() => setIsQuickstartOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)'
            }}
          >
            Quickstart Guide
          </button>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer 
        style={{
          width: '100%',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          padding: '60px 40px 40px 40px',
          boxSizing: 'border-box',
          backgroundColor: isDark ? '#060a12' : '#f9fafb'
        }}
      >
        <div 
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '40px',
            marginBottom: '40px'
          }}
        >
          {/* Brand Col */}
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.png" alt="Much Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>Much</span>
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
              The premium, local-first multi-model AI platform.
            </p>
          </div>

          {/* Links Cols */}
          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#ffffff' : '#111827' }}>About</span>
              <a href="#about" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={e => e.preventDefault()}>About</a>
              <a href="#features" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={e => e.preventDefault()}>Features</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#ffffff' : '#111827' }}>Resources</span>
              <a href="#docs" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={e => e.preventDefault()}>Changelog</a>
              <a href="#demo" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={handleTryDemo}>Demo</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#ffffff' : '#111827' }}>Legal</span>
              <a href="#privacy" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={e => e.preventDefault()}>Privacy Policy</a>
              <a href="#terms" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }} onClick={e => e.preventDefault()}>Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom copyright block */}
        <div 
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#9ca3af'
          }}
        >
          <span>&copy; 2026 Much. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://github.com" style={{ color: '#9ca3af' }}><GithubIcon size={16} /></a>
          </div>
        </div>
      </footer>

      {/* Fullscreen Authentication Modal Portal */}
      <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} isFullScreen={true} />

      {/* Interactive Quickstart Overlay */}
      {isQuickstartOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsQuickstartOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '16px',
              backgroundColor: isDark ? '#0b0f19' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: isDark ? '#ffffff' : '#111827' }}>Quickstart Guide</h3>
              <button 
                onClick={() => setIsQuickstartOpen(false)}
                style={{
                  fontSize: '22px',
                  lineHeight: '1',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body with tabs/steps */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', boxSizing: 'border-box' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px 0' }}>
                Follow these simple steps to configure your local-first workspace environment.
              </p>

              {/* Step tabs navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['1. Models Setup', '2. Python Sandbox', '3. MCP Connect', '4. File RAG'].map((tabLabel, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuickstartTab(idx)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: quickstartTab === idx ? '#2563eb' : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'),
                      color: quickstartTab === idx ? '#ffffff' : (isDark ? '#cbd5e1' : '#4b5563'),
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {quickstartTab === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: isDark ? '#ffffff' : '#111827' }}>Configure Local & Cloud LLMs</h4>
                  <p style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#4b5563', lineHeight: '1.6', margin: 0 }}>
                    Much coordinates multiple providers directly from the UI context. Ensure Ollama is running on port 11434 for local offline inference, or paste your API key inside the settings parameters:
                  </p>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isDark ? '#06090f' : '#f8fafc', border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0,0,0,0.05)', fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af' }}>
                    <div># Local Ollama endpoint:</div>
                    <div style={{ color: '#2563eb' }}>http://localhost:11434</div>
                    <div style={{ marginTop: '8px' }}># Gemini API key signature:</div>
                    <div style={{ color: '#10b981' }}>sk-proj-xxxxxxxxxxxxxxxx (Auto-detected on paste)</div>
                  </div>
                </div>
              )}

              {quickstartTab === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: isDark ? '#ffffff' : '#111827' }}>Run Sandboxed Python in Wasm</h4>
                  <p style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#4b5563', lineHeight: '1.6', margin: 0 }}>
                    The built-in Pyodide workspace runs mathematical/pandas scripts in your browser safely. Test it out below by clicking **Run Code**:
                  </p>
                  <div style={{ border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', backgroundColor: isDark ? '#06090f' : '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: isDark ? '#cbd5e1' : '#4b5563' }}>interpreter.py</span>
                      <button 
                        onClick={async () => {
                          setQuickstartDemoRun(true);
                          await new Promise(r => setTimeout(r, 1200));
                          setQuickstartDemoOutput('Calculating sine values...\nMatplotlib figure generated: active figure loaded in Preview canvas.\nProcess finished with exit code 0');
                        }}
                        style={{ padding: '4px 10px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Run Code
                      </button>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: isDark ? '#0b0f19' : '#ffffff', fontSize: '11px', fontFamily: 'monospace', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)', color: '#ec4899', whiteSpace: 'pre-line' }}>
                      import numpy as np{"\n"}
                      x = np.linspace(0, 2*np.pi, 50){"\n"}
                      print("Calculating sine values...")
                    </div>
                    {quickstartDemoRun && (
                      <div style={{ padding: '10px', backgroundColor: isDark ? '#06090f' : '#f8fafc', fontSize: '11px', fontFamily: 'monospace', color: '#10b981', whiteSpace: 'pre-line' }}>
                        {quickstartDemoOutput || 'Executing Pyodide kernel...'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {quickstartTab === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: isDark ? '#ffffff' : '#111827' }}>Connect Model Context Protocol (MCP)</h4>
                  <p style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#4b5563', lineHeight: '1.6', margin: 0 }}>
                    Enable models to query local databases and system paths via standard MCP connections. Install a SQLite database server with a single terminal command:
                  </p>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isDark ? '#06090f' : '#f8fafc', border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0,0,0,0.05)', fontSize: '11px', fontFamily: 'monospace', color: '#2563eb' }}>
                    <code>npx -y @modelcontextprotocol/server-sqlite --db sales.db</code>
                  </div>
                </div>
              )}

              {quickstartTab === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: isDark ? '#ffffff' : '#111827' }}>Upload Multiple Files for RAG</h4>
                  <p style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#4b5563', lineHeight: '1.6', margin: 0 }}>
                    Drag-and-drop multiple spreadsheet or PDF document files directly into your workspace. The frontend computes local vectors to feed accurate search context directly into model messages.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsQuickstartOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
