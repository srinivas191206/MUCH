import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Sidebar from '../components/Sidebar';
import RightDrawer from '../components/RightDrawer';
import Header from '../components/Header';
import SettingsOverlay from '../components/SettingsOverlay';
import AuthOverlay from '../components/AuthOverlay';
import ArtifactsPanel from '../components/ArtifactsPanel';
import AgentsOverlay from '../components/AgentsOverlay';
import AdminPanelOverlay from '../components/AdminPanelOverlay';
import AdminDashboardView from '../components/AdminDashboardView';
import McpOverlay from '../components/McpOverlay';

function DashboardLayout() {
  // Consume unified state from AppContext
  const { 
    settings, 
    updateApiKeys, 
    updateParameters, 
    updateTheme, 
    updateDefaultModel,
    user,
    isMcpOpen,
    setIsMcpOpen
  } = useApp();

  // Keep sidebar drawer states local to layout, persisted in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('much_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(() => {
    const saved = localStorage.getItem('much_right_drawer_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('much_sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('much_right_drawer_open', JSON.stringify(isRightDrawerOpen));
  }, [isRightDrawerOpen]);

  const toggleTheme = () => {
    updateTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  if (user && user.role === 'admin') {
    return <AdminDashboardView />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dashboard-container">
      {/* Column 1: Left Navigation Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAgents={() => setIsAgentsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Column 2: Center Main Workspace */}
      <div className="main-workspace" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Header 
          isSidebarOpen={isSidebarOpen}
          isRightDrawerOpen={isRightDrawerOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onToggleRightDrawer={() => setIsRightDrawerOpen(prev => !prev)}
          defaultProvider={settings.defaultProvider}
          defaultModel={settings.defaultModel}
          onModelChange={updateDefaultModel}
        />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Render child pages, passing settings context */}
            <Outlet context={{ 
              isSettingsOpen, 
              setIsSettingsOpen 
            }} />
          </div>
          
          <ArtifactsPanel />
        </div>
      </div>

      {/* Column 3: Right Parameters Drawer */}
      <RightDrawer 
        isOpen={isRightDrawerOpen} 
        onClose={() => setIsRightDrawerOpen(false)}
        parameters={settings.parameters}
        onUpdateParameters={updateParameters}
        apiKeys={settings.apiKeys}
      />

      {/* Global Settings Dialog */}
      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={settings.theme}
        onToggleTheme={toggleTheme}
        apiKeys={settings.apiKeys}
        onSaveKeys={updateApiKeys}
        defaultProvider={settings.defaultProvider}
        defaultModel={settings.defaultModel}
        onModelChange={updateDefaultModel}
      />

      {/* Global Auth Dialog */}
      <AuthOverlay 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Global Agents Dialog */}
      <AgentsOverlay 
        isOpen={isAgentsOpen} 
        onClose={() => setIsAgentsOpen(false)}
      />

      {/* Global Admin panel dashboard */}
      <AdminPanelOverlay 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Global MCP Settings Dialog */}
      <McpOverlay 
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />
    </div>
  );
}

export default DashboardLayout;
