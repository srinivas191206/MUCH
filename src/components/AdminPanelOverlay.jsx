import React, { useState, useEffect } from 'react';
import { X, Users, BarChart3, ShieldAlert, ShieldCheck, UserMinus, Trash2, Cpu, Activity, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function AdminPanelOverlay({ isOpen, onClose }) {
  const { 
    user,
    fetchUsers, 
    updateUserRole, 
    updateUserStatus, 
    deleteUser, 
    fetchAnalytics 
  } = useApp();

  const [activeTab, setActiveTab] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const u = await fetchUsers();
        setUsersList(u);
      } else {
        const a = await fetchAnalytics();
        setAnalytics(a);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

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

  return (
    <div 
      className="modal-backdrop" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '90%',
          maxHeight: '650px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Admin Control Panel</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="sidebar-btn" 
            style={{ padding: '6px' }}
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            padding: '4px 16px',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`settings-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              backgroundColor: activeTab === 'users' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <Users size={15} />
            <span>User Accounts</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`settings-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              backgroundColor: activeTab === 'analytics' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <BarChart3 size={15} />
            <span>Usage Analytics</span>
          </button>

          <button 
            type="button"
            onClick={loadData}
            className="sidebar-btn"
            style={{ marginLeft: 'auto', padding: '6px', alignSelf: 'center' }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', borderBottom: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '8px 16px', fontSize: '12.5px', textAlign: 'center', fontWeight: '500' }}>
            {message}
          </div>
        )}

        {/* Scrollable Dashboard Viewport */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="scroller">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spinning" />
              <span style={{ fontSize: '13px' }}>Loading admin dashboard data...</span>
            </div>
          ) : activeTab === 'users' ? (
            // User management view
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  Showing {usersList.length} registered accounts
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      <th style={{ padding: '12px 16px' }}>Email Address</th>
                      <th style={{ padding: '12px 16px' }}>Joined Date</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{u.email}</span>
                            {u._id === user?.id && (
                              <span style={{ fontSize: '9px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>You</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            backgroundColor: u.role === 'admin' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                            color: u.role === 'admin' ? 'var(--accent-color)' : 'var(--text-secondary)',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-secondary)'}`
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            backgroundColor: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                            color: u.status === 'suspended' ? '#ef4444' : '#22c55e',
                            border: `1px solid ${u.status === 'suspended' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleRoleToggle(u._id, u.role)}
                              className="sidebar-btn"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              disabled={u._id === user?.id}
                              title={u.role === 'admin' ? 'Demote User' : 'Promote to Admin'}
                            >
                              {u.role === 'admin' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(u._id, u.status)}
                              className="sidebar-btn"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              disabled={u._id === user?.id}
                              title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="sidebar-btn"
                              style={{ padding: '4px 8px', color: '#ef4444' }}
                              disabled={u._id === user?.id}
                              title="Delete Account"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Usage Analytics Dashboard View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* KPI cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--border-primary)', border: '1px solid var(--border-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Chat Sessions</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {analytics?.summary?.totalRequests || 0}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--border-primary)', border: '1px solid var(--border-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Est. Prompt Tokens</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {Math.round((analytics?.summary?.totalPromptChars || 0) / 4).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--border-primary)', border: '1px solid var(--border-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Est. Generated Tokens</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {Math.round((analytics?.summary?.totalCompletionChars || 0) / 4).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--border-primary)', border: '1px solid var(--border-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Tokens Used</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {Math.round(((analytics?.summary?.totalPromptChars || 0) + (analytics?.summary?.totalCompletionChars || 0)) / 4).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Providers and Models share row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Providers Share */}
                <div style={{ border: '1px solid var(--border-primary)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                    Usage Share by Provider
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analytics?.providers?.map((p, idx) => {
                      const percentage = analytics.summary.totalRequests > 0 ? (p.count / analytics.summary.totalRequests) * 100 : 0;
                      return (
                        <div key={p._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: '500', textTransform: 'uppercase' }}>{p._id}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{p.count} requests ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${percentage}%`, 
                              backgroundColor: idx === 0 ? 'var(--accent-cyan)' : idx === 1 ? 'var(--accent-color)' : '#22c55e', 
                              borderRadius: '3px' 
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics?.providers || analytics.providers.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>No provider analytics recorded.</div>
                    )}
                  </div>
                </div>

                {/* Models breakdown */}
                <div style={{ border: '1px solid var(--border-primary)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                    Most Active Models
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }} className="scroller">
                    {analytics?.models?.map((m, idx) => {
                      const percentage = analytics.summary.totalRequests > 0 ? (m.count / analytics.summary.totalRequests) * 100 : 0;
                      return (
                        <div key={m._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: '500' }}>{m._id.split('/').pop()}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{m.count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${percentage}%`, 
                              backgroundColor: 'var(--text-secondary)', 
                              borderRadius: '3px' 
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics?.models || analytics.models.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>No model analytics recorded.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Series Chart */}
              <div style={{ border: '1px solid var(--border-primary)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
                  Request History (Past 7 Days)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '10px 20px', gap: '12px' }}>
                  {analytics?.daily?.map(day => {
                    // Normalize height relative to maximum count in history
                    const maxCount = Math.max(...analytics.daily.map(d => d.count), 1);
                    const barHeight = (day.count / maxCount) * 100;
                    
                    return (
                      <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{day.count}</div>
                        <div style={{ 
                          height: `${barHeight}px`, 
                          width: '100%', 
                          maxWidth: '32px',
                          backgroundColor: 'var(--accent-cyan)', 
                          borderRadius: '4px 4px 0 0',
                          minHeight: '4px',
                          transition: 'height 0.3s ease'
                        }} />
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', transform: 'rotate(-25deg)', transformOrigin: 'top center', marginTop: '4px', whiteSpace: 'nowrap' }}>
                          {day._id.split('-').slice(1).join('/')}
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.daily || analytics.daily.length === 0) && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No time-series analytics logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanelOverlay;
