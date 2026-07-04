import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';
import { useApp } from './contexts/AppContext';

function App() {
  const { user } = useApp();

  return (
    <BrowserRouter>
      <Routes>
        {/* If logged out, render LandingPage at "/" */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/workspace" replace /> : <LandingPage />} 
        />
        
        {/* Protected Workspace Dashboard Routes */}
        <Route 
          path="/workspace" 
          element={user ? <DashboardLayout /> : <Navigate to="/" replace />}
        >
          {/* Default view is a new chat */}
          <Route index element={<ChatPage />} />
          {/* View a specific conversation */}
          <Route path="chat/:chatId" element={<ChatPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
