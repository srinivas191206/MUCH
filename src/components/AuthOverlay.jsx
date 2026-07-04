/* AuthOverlay.jsx - Secure Full-Page & Popup Login/Signup Portal for Much Workspace */

import React, { useState } from 'react';
import { X, LogIn, UserPlus, LogOut, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { API_URL } from '../config';

export default function AuthOverlay({ isOpen, onClose, isFullScreen = false }) {
  const { user, login, signup, logout, settings, updateTheme } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('All fields are required.');
      setLoading(false);
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      setEmail('');
      setPassword('');
      setFullName('');
      setUsername('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setErrorMsg('');
    setLoading(true);
    window.location.href = `${API_URL}/api/auth/${provider.toLowerCase()}`;
  };

  const toggleTheme = () => {
    updateTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  // --------------------------------------------------------------------------
  // Full Screen View (Premium SaaS-style Branded Login Portal)
  // --------------------------------------------------------------------------
  if (isFullScreen && !user) {
    const isDark = settings.theme === 'dark';

    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: isDark ? '#090d16' : '#f9fafb',
          backgroundImage: isDark 
            ? 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.03) 50%, transparent 100%)' 
            : 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.04) 0%, rgba(6, 182, 212, 0.02) 60%, transparent 100%)',
          color: isDark ? '#f3f4f6' : '#111827',
          fontFamily: 'var(--font-primary, "Inter", sans-serif)',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999999
        }}
      >
        {/* Main centered card wrapper */}
        <div 
          style={{
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px'
          }}
        >
          {/* Logo directly rendered at a large size without background container */}
          <img 
            src="/logo.png" 
            alt="Much Logo" 
            style={{ 
              width: '96px', 
              height: '96px', 
              objectFit: 'contain'
            }} 
          />

          {/* Clean minimalist form wrapper */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div 
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    color: '#ef4444',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Optional Registration Fields */}
              {isRegister && (
                <>
                  {/* Full Name input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                        backgroundColor: isDark ? '#111827' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Username input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (optional)"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                        backgroundColor: isDark ? '#111827' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Email input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '12px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password input (Registration only) */}
              {isRegister && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 16px',
                      borderRadius: '8px',
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      color: isDark ? '#ffffff' : '#000000',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '12px', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {/* Forgot password */}
              {!isRegister && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-4px' }}>
                  <a 
                    href="#forgot-password" 
                    onClick={(e) => { e.preventDefault(); alert("Mock password reset link sent to your email!"); }}
                    style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              {/* Action Continue Button (Premium Blue) */}
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>

              {/* Switch view prompt */}
              <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '6px' }}>
                <span style={{ color: '#9ca3af' }}>{isRegister ? "Already have an account?" : "Don't have an account?"} </span>
                <button 
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
                  style={{ fontSize: '13px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
                >
                  {isRegister ? 'Login' : 'Sign up'}
                </button>
              </div>
            </form>

            {/* OR Divider */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}></div>
            </div>

            {/* Social OAuth Options (Only Google & GitHub Stack) */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Google */}
              <button 
                type="button"
                onClick={() => handleSocialLogin('Google')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '11px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark ? '#111827' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* GitHub */}
              <button 
                type="button"
                onClick={() => handleSocialLogin('GitHub')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '11px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark ? '#1f2937' : '#111827',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                Continue with Github
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Theme Toggle and Footer Links */}
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
            fontSize: '12px',
            color: '#9ca3af'
          }}
        >
          {/* Theme toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Privacy & Terms */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#privacy" style={{ color: '#9ca3af', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>Privacy policy</a>
            <span>|</span>
            <a href="#terms" style={{ color: '#9ca3af', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>Terms of service</a>
          </div>
          
          {/* Empty spacer to align right link items */}
          <div style={{ width: '18px' }}></div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Default Drawer/Modal View (For Profile Management when logged in)
  // --------------------------------------------------------------------------
  return (
    <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="glass-panel settings-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
      >
        {/* Header */}
        <div className="drawer-header" style={{ padding: '20px' }}>
          <h2 className="drawer-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? <LogOut size={18} /> : (isRegister ? <UserPlus size={18} /> : <LogIn size={18} />)}
            {user ? 'Account Settings' : (isRegister ? 'Create Company Account' : 'Company Member Login')}
          </h2>
          <button className="sidebar-btn" onClick={onClose} aria-label="Close auth portal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body" style={{ padding: '20px' }}>
          {user ? (
            /* Logged In Profile View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--accent-color)', 
                  color: 'white', 
                  fontSize: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Logged in as</h3>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{user.email}</span>
              </div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '8px 0' }}>
                Your chats, folders, and configs are securely synced with the database and available across devices.
              </div>

              <button 
                className="accent-btn" 
                onClick={() => { logout(); onClose(); }}
                style={{ width: '100%', gap: '8px', backgroundColor: 'hsl(346, 77%, 49%)', color: 'white' }}
              >
                <LogOut size={16} />
                Log Out of Account
              </button>
            </div>
          ) : (
            /* Login/Register Modal Form View (Fallback) */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div 
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '6px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    color: 'hsl(0, 85%, 65%)',
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="settings-input"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="settings-input"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                className="accent-btn" 
                disabled={loading}
                style={{ width: '100%', gap: '8px', marginTop: '8px' }}
              >
                {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Log In')}
              </button>

              {/* Toggle Auth Mode */}
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
                  style={{ fontSize: '12px', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
