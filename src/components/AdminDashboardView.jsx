import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, BarChart3, ShieldAlert, ShieldCheck as ShieldCheckIcon, UserMinus, LogOut, RefreshCw, Cpu, Power, Trash2, Plus, Code } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function AdminDashboardView() {
  const { 
    token,
    user,
    logout,
    fetchUsers, 
    updateUserRole, 
    updateUserStatus, 
    deleteUser, 
    fetchAnalytics 
  } = useApp();

  const [activeTab, setActiveTab] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [mcpServers, setMcpServers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedMcp, setExpandedMcp] = useState(null);

  // MCP Server form states
  const [mcpName, setMcpName] = useState('');
  const [mcpType, setMcpType] = useState('stdio');
  const [mcpCommand, setMcpCommand] = useState('');
  const [mcpArgsInput, setMcpArgsInput] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');
  const [mcpEnvInput, setMcpEnvInput] = useState('');
  const [mcpError, setMcpError] = useState('');

  const loadMcpServers = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5001/api/mcp/servers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMcpServers(await res.json());
      }
    } catch (err) {
      console.error('Error loading MCP servers in admin portal:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setMcpError('');
    try {
      if (activeTab === 'users') {
        const u = await fetchUsers();
        setUsersList(u);
      } else if (activeTab === 'analytics') {
        const a = await fetchAnalytics();
        setAnalytics(a);
      } else if (activeTab === 'mcp') {
        await loadMcpServers();
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRoleToggle = async (userId, currentRole) => {
    if (userId === user?.id) {
      alert("You cannot change your own admin privileges.");
      return;
    }
    const targetRole = currentRole === 'admin' ? 'member' : 'admin';
    const success = await updateUserRole(userId, targetRole);
    if (success) {
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: targetRole } : u));
      setMessage('Role updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert('Failed to update user role.');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    if (userId === user?.id) {
      alert("You cannot suspend your own admin account.");
      return;
    }
    const targetStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const success = await updateUserStatus(userId, targetStatus);
    if (success) {
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, status: targetStatus } : u));
      setMessage('User account status updated.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (userId === user?.id) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!confirm(`Are you absolutely sure you want to permanently delete user account "${email}"? This will clean up all associated usage logs and chats.`)) {
      return;
    }
    const success = await deleteUser(userId);
    if (success) {
      setUsersList(prev => prev.filter(u => u._id !== userId));
      setMessage('User deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert('Failed to delete user account.');
    }
  };

  // MCP Control Handlers
  const handleMcpToggle = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/mcp/servers/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Server state toggled.');
        setTimeout(() => setMessage(''), 3000);
        loadMcpServers();
      }
    } catch (err) {
      console.error('Error toggling MCP server:', err);
    }
  };

  const handleMcpDelete = async (id, serverName) => {
    if (!confirm(`Are you sure you want to delete MCP Server "${serverName}"? This will terminate its running process.`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/mcp/servers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('MCP server configuration deleted.');
        setTimeout(() => setMessage(''), 3000);
        loadMcpServers();
      }
    } catch (err) {
      console.error('Error deleting MCP server:', err);
    }
  };

  const handleMcpAddServer = async (e) => {
    e.preventDefault();
    setMcpError('');
    setMessage('');

    if (!mcpName.trim()) {
      return setMcpError('Server name is required.');
    }

    let args = [];
    if (mcpType === 'stdio' && mcpArgsInput.trim()) {
      args = mcpArgsInput.split(',').map(arg => arg.trim()).filter(Boolean);
    }

    let env = {};
    if (mcpEnvInput.trim()) {
      try {
        env = JSON.parse(mcpEnvInput);
      } catch (err) {
        return setMcpError('Environment variables must be a valid JSON object.');
      }
    }

    try {
      const res = await fetch('http://localhost:5001/api/mcp/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: mcpName.trim(),
          type: mcpType,
          command: mcpType === 'stdio' ? mcpCommand.trim() : undefined,
          args: mcpType === 'stdio' ? args : undefined,
          url: mcpType === 'sse' ? mcpUrl.trim() : undefined,
          env,
          enabled: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        return setMcpError(data.error || 'Failed to create MCP server.');
      }

      setMessage('MCP server added and launching...');
      setTimeout(() => setMessage(''), 3000);
      
      setMcpName('');
      setMcpCommand('');
      setMcpArgsInput('');
      setMcpUrl('');
      setMcpEnvInput('');
      
      loadMcpServers();
    } catch (err) {
      console.error('Create MCP server error:', err);
      setMcpError('Server error creating MCP configuration.');
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden'
      }}
    >
      {/* Header bar */}
      <header 
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '6px', borderRadius: '8px', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: '700', margin: 0, letterSpacing: '0.3px' }}>Much Admin Portal</h1>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>System Monitoring & User Management</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </span>
          <button 
            type="button"
            onClick={logout}
            className="sidebar-btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-secondary)',
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main dashboard content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side Tab Navigation */}
        <aside 
          style={{
            width: '240px',
            borderRight: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
            Dashboard Options
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              backgroundColor: activeTab === 'users' ? 'var(--bg-glass-active)' : 'transparent',
              color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <Users size={16} style={{ color: activeTab === 'users' ? 'var(--accent-cyan)' : 'inherit' }} />
            <span>User Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              backgroundColor: activeTab === 'analytics' ? 'var(--bg-glass-active)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <BarChart3 size={16} style={{ color: activeTab === 'analytics' ? 'var(--accent-cyan)' : 'inherit' }} />
            <span>Usage Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mcp')}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              backgroundColor: activeTab === 'mcp' ? 'var(--bg-glass-active)' : 'transparent',
              color: activeTab === 'mcp' ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <Cpu size={16} style={{ color: activeTab === 'mcp' ? 'var(--accent-cyan)' : 'inherit' }} />
            <span>MCP Servers</span>
          </button>

          <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border-primary)' }}>
            <button
              type="button"
              onClick={loadData}
              className="sidebar-btn"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </aside>

        {/* Right Scrollable Panel Viewport */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="scroller">
          
          {/* Notification Banner */}
          {message && (
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius-md)', color: 'var(--accent-cyan)', padding: '10px 16px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
              {message}
            </div>
          )}

          {mcpError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', color: '#ef4444', padding: '10px 16px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
              {mcpError}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spinning" />
              <span style={{ fontSize: '13px' }}>Loading admin dashboard data...</span>
            </div>
          ) : activeTab === 'users' ? (
            // User Administration Page
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>User Accounts</h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>Review, approve, promote, or restrict user access permissions for Much.</p>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--border-primary)', borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      <th style={{ padding: '14px 20px' }}>Email Address</th>
                      <th style={{ padding: '14px 20px' }}>Joined Date</th>
                      <th style={{ padding: '14px 20px' }}>Role</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} className="chat-item-hover">
                        <td style={{ padding: '14px 20px', fontWeight: '500' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{u.email}</span>
                            {u._id === user?.id && (
                              <span style={{ fontSize: '9px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Admin</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString()} at {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ 
                            fontSize: '11.5px', 
                            fontWeight: '600', 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            backgroundColor: u.role === 'admin' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                            color: u.role === 'admin' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-secondary)'}`
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ 
                            fontSize: '11.5px', 
                            fontWeight: '600', 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            backgroundColor: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                            color: u.status === 'suspended' ? '#ef4444' : '#22c55e',
                            border: `1px solid ${u.status === 'suspended' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleRoleToggle(u._id, u.role)}
                              className="sidebar-btn"
                              style={{ padding: '6px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              disabled={u._id === user?.id}
                              title={u.role === 'admin' ? 'Demote User to Member' : 'Promote User to Admin'}
                            >
                              {u.role === 'admin' ? <ShieldAlert size={13} /> : <ShieldCheckIcon size={13} />}
                              <span>{u.role === 'admin' ? 'Demote' : 'Make Admin'}</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(u._id, u.status)}
                              className="sidebar-btn"
                              style={{ padding: '6px 10px', fontSize: '11.5px' }}
                              disabled={u._id === user?.id}
                              title={u.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                            >
                              <span>{u.status === 'suspended' ? 'Activate' : 'Suspend'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="sidebar-btn"
                              style={{ padding: '6px', color: '#ef4444' }}
                              disabled={u._id === user?.id}
                              title="Delete Account Permanently"
                            >
                              <UserMinus size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            // Usage Analytics Dashboard View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>Usage Analytics</h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>Monitor system request rates and API token usage aggregates.</p>
              </div>

              {/* KPI cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Chat Invocations</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                    {analytics?.summary?.totalRequests || 0}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Prompt Tokens</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                    {Math.round((analytics?.summary?.totalPromptChars || 0) / 4).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Generated Tokens</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                    {Math.round((analytics?.summary?.totalCompletionChars || 0) / 4).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tokens Usage</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                    {Math.round(((analytics?.summary?.totalPromptChars || 0) + (analytics?.summary?.totalCompletionChars || 0)) / 4).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Share graphs row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {/* Providers distribution */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                    Usage Share by Provider
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics?.providers?.map((p, idx) => {
                      const percentage = analytics.summary.totalRequests > 0 ? (p.count / analytics.summary.totalRequests) * 100 : 0;
                      return (
                        <div key={p._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{p._id}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{p.count} requests ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${percentage}%`, 
                              backgroundColor: idx === 0 ? 'var(--accent-cyan)' : idx === 1 ? 'var(--accent-color)' : '#22c55e', 
                              borderRadius: '4px' 
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics?.providers || analytics.providers.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>No provider analytics logged.</div>
                    )}
                  </div>
                </div>

                {/* Models distribution */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                    Invoked Models share
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }} className="scroller">
                    {analytics?.models?.map((m, idx) => {
                      const percentage = analytics.summary.totalRequests > 0 ? (m.count / analytics.summary.totalRequests) * 100 : 0;
                      return (
                        <div key={m._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px', fontWeight: '500' }}>{m._id.split('/').pop()}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{m.count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${percentage}%`, 
                              backgroundColor: 'var(--text-secondary)', 
                              borderRadius: '4px' 
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics?.models || analytics.models.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>No model analytics logged.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Series History */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                  Daily Chat Invocation Timeline (Past 7 Days)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', padding: '10px 40px', gap: '16px' }}>
                  {analytics?.daily?.map(day => {
                    const maxCount = Math.max(...analytics.daily.map(d => d.count), 1);
                    const barHeight = (day.count / maxCount) * 140; // max height of 140px
                    
                    return (
                      <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{day.count}</div>
                        <div style={{ 
                          height: `${barHeight}px`, 
                          width: '100%', 
                          maxWidth: '48px',
                          backgroundColor: 'var(--accent-cyan)', 
                          borderRadius: '6px 6px 0 0',
                          minHeight: '4px',
                          transition: 'height 0.3s ease'
                        }} />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', transform: 'rotate(-25deg)', transformOrigin: 'top center', marginTop: '6px', whiteSpace: 'nowrap' }}>
                          {day._id.split('-').slice(1).join('/')}
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.daily || analytics.daily.length === 0) && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No time-series request events logged in the last 7 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // MCP Servers Administration Tab View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>MCP Server Configuration</h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>Register and manage Model Context Protocol (MCP) tool servers for AI models.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
                {/* Left Side: Server Status List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Exposed Active Servers</h3>
                  
                  {mcpServers.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No MCP tool servers configured yet. Use the configuration form to launch one.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {mcpServers.map(s => {
                        const statusColors = {
                          connected: '#22c55e',
                          connecting: '#eab308',
                          disconnected: '#ef4444',
                          error: '#ef4444',
                          disabled: '#6b7280'
                        };
                        const color = statusColors[s.status] || '#6b7280';
                        const isExpanded = expandedMcp === s._id;

                        return (
                          <div 
                            key={s._id} 
                            style={{ 
                              border: '1px solid var(--border-primary)', 
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-secondary)',
                              overflow: 'hidden'
                            }}
                          >
                            <div 
                              style={{ 
                                padding: '14px 16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                              }}
                              onClick={() => setExpandedMcp(isExpanded ? null : s._id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: color }} />
                                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{s.name}</strong>
                                <span style={{ fontSize: '9px', backgroundColor: 'var(--border-primary)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                  {s.type}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <button 
                                  className="sidebar-btn" 
                                  onClick={() => handleMcpToggle(s._id)} 
                                  style={{ padding: '6px', color: s.enabled ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
                                  title={s.enabled ? "Deactivate Server Process" : "Activate Server Process"}
                                >
                                  <Power size={14} />
                                </button>
                                <button 
                                  className="sidebar-btn" 
                                  onClick={() => handleMcpDelete(s._id, s.name)} 
                                  style={{ padding: '6px', color: '#ef4444' }}
                                  title="Delete Configuration"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible exposed tools list */}
                            {isExpanded && (
                              <div style={{ padding: '14px', borderTop: '1px solid var(--border-primary)', fontSize: '12.5px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                                  Exposed Tool Functions ({s.toolsCount})
                                </div>
                                {s.tools.length === 0 ? (
                                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                    No active tools parsed. Verify command line settings.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {s.tools.map(t => (
                                      <div key={t.name} style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                                          <Code size={13} />
                                          <span>{t.name}</span>
                                        </div>
                                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11.5px', lineHeight: '1.4' }}>
                                          {t.description}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Side: Configuration Add Form */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 14px 0' }}>Configure New Tool Server</h3>
                  
                  <form onSubmit={handleMcpAddServer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Server Name</label>
                      <input 
                        type="text" 
                        value={mcpName} 
                        onChange={e => setMcpName(e.target.value)} 
                        placeholder="e.g. filesystem"
                        className="settings-input"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Connection Type</label>
                      <select 
                        value={mcpType} 
                        onChange={e => setMcpType(e.target.value)}
                        className="settings-input"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="stdio">Local process command (stdio)</option>
                        <option value="sse">SSE web host url (SSE)</option>
                      </select>
                    </div>

                    {mcpType === 'stdio' ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Command Binary</label>
                          <input 
                            type="text" 
                            value={mcpCommand} 
                            onChange={e => setMcpCommand(e.target.value)} 
                            placeholder="e.g. npx or python3"
                            className="settings-input"
                            required
                          />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Arguments (Comma separated)</label>
                          <input 
                            type="text" 
                            value={mcpArgsInput} 
                            onChange={e => setMcpArgsInput(e.target.value)} 
                            placeholder="e.g. -y, @modelcontextprotocol/server-filesystem, /Users/path"
                            className="settings-input"
                          />
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>SSE Service URL</label>
                        <input 
                          type="text" 
                          value={mcpUrl} 
                          onChange={e => setMcpUrl(e.target.value)} 
                          placeholder="e.g. http://localhost:3001/sse"
                          className="settings-input"
                          required
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Environment Parameters (JSON Dictionary)</label>
                      <textarea 
                        value={mcpEnvInput} 
                        onChange={e => setMcpEnvInput(e.target.value)} 
                        placeholder='e.g. { "API_KEY": "xyz" }'
                        className="settings-input"
                        rows={3}
                        style={{ fontFamily: 'monospace', resize: 'vertical' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="accent-btn" 
                      style={{ marginTop: '8px', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                      <span>Launch Connection</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardView;
