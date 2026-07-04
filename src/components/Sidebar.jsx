/* Sidebar.jsx - Organization Sidebar with Collapsible Folders & Drag-and-Drop for Much */

import React, { useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  MessageSquare, Plus, Search, Folder, ChevronDown, ChevronRight, 
  Settings, Bookmark, PanelLeftClose, Sparkles, Cpu, Library, 
  FolderPlus, Trash2, Edit3, Check, X, Star, Upload, Shield
} from 'lucide-react';

function Sidebar({ isOpen, onClose, onOpenSettings, onOpenAuth, onOpenAgents, onOpenAdmin }) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  
  const { 
    chats, 
    folders, 
    createFolder, 
    renameFolder, 
    deleteFolder, 
    toggleFolderCollapse,
    createNewChat, 
    deleteChat, 
    renameChat, 
    toggleFavoriteChat,
    moveChatToFolder,
    importSingleChat,
    user
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Folder Creator State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  // Inline Rename Chat State
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState('');

  // Inline Rename Folder State
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderTitle, setEditFolderTitle] = useState('');

  // Drag and drop hover states
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  const handleCreateFolderSubmit = (e) => {
    e.preventDefault();
    if (newFolderTitle.trim()) {
      createFolder(newFolderTitle.trim());
      setNewFolderTitle('');
      setIsCreatingFolder(false);
    }
  };

  const handleStartRename = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditChatTitle(chat.title);
  };

  const handleSaveRename = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    renameChat(id, editChatTitle);
    setEditingChatId(null);
  };

  const handleCancelRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(null);
  };

  // Folder Renaming handlers
  const handleStartRenameFolder = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditFolderTitle(folder.title);
  };

  const handleSaveRenameFolder = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    renameFolder(id, editFolderTitle);
    setEditingFolderId(null);
  };

  const handleCancelRenameFolder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFolderId(null);
  };

  const handleCreateNewChat = (folderId = null) => {
    const newId = createNewChat(folderId);
    navigate(`/chat/${newId}`);
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'groq': return <Cpu size={13} style={{ color: 'var(--accent-cyan)' }} />;
      case 'gemini': return <Sparkles size={13} style={{ color: 'var(--accent-color)' }} />;
      case 'nvidia': return <Cpu size={13} style={{ color: 'var(--accent-cyan)' }} />;
      case 'ollama': return <Library size={13} style={{ color: 'hsl(142, 70%, 45%)' }} />;
      default: return <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const importInputRef = useRef(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      });

      const data = JSON.parse(text);

      let title = data.title || file.name.replace('.json', '');
      let messages = [];

      if (Array.isArray(data)) {
        messages = data.map((msg, i) => ({
          id: msg.id || `${msg.role}_${Date.now()}_${i}`,
          role: msg.role || 'user',
          content: msg.content || '',
          provider: msg.provider || 'groq',
          model: msg.model || 'llama-3.1-8b-instant',
          timestamp: msg.timestamp || new Date().toISOString()
        }));
      } else if (data && Array.isArray(data.messages)) {
        messages = data.messages.map((msg, i) => ({
          id: msg.id || `${msg.role}_${Date.now()}_${i}`,
          role: msg.role || 'user',
          content: msg.content || '',
          provider: msg.provider || 'groq',
          model: msg.model || 'llama-3.1-8b-instant',
          timestamp: msg.timestamp || new Date().toISOString()
        }));
      } else {
        alert('⚠️ Invalid conversation format. Must be a JSON array of messages or a valid Much conversation JSON.');
        return;
      }

      const newChat = {
        id: `chat_import_${Date.now()}`,
        title,
        folderId: null,
        isFavorite: false,
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      importSingleChat(newChat);
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error importing chat:', err);
      alert('Failed to parse conversation file: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Filter chats by query (checking both title and message contents)
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.messages && chat.messages.some(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Group chats: root level vs in folders
  const rootChats = filteredChats.filter(chat => !chat.folderId);
  const favorites = filteredChats.filter(chat => chat.isFavorite);

  if (!isOpen) return null;

  return (
    <aside className={`sidebar-left scroller ${isOpen ? '' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="brand-section">
          <img src="/logo.png" alt="Much Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', marginRight: '4px' }} />
          <span className="brand-name">Much</span>
        </div>
        <button 
          className="sidebar-btn" 
          onClick={onClose} 
          title="Collapse Sidebar"
          aria-label="Collapse Left Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Action Triggers */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: '8px' }}>
        <button 
          className="accent-btn" 
          style={{ flex: 1.6, justifyContent: 'center', height: '40px' }}
          onClick={() => handleCreateNewChat(null)}
        >
          <Plus size={16} />
          New Chat
        </button>
        <button 
          className="sidebar-btn" 
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            height: '40px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}
          onClick={onOpenAgents}
          title="Explore Custom AI Assistants"
        >
          <Sparkles size={14} style={{ color: 'var(--accent-color)' }} />
          Agents
        </button>
      </div>

      {/* Search Input */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={14} />
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        
        {/* Starred / Favorites Section */}
        {favorites.length > 0 && (
          <div>
            <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={11} />
              <span>Starred</span>
            </div>
            <div className="chat-list-group">
              {favorites.map(chat => (
                <Link 
                  key={chat.id} 
                  to={`/chat/${chat.id}`}
                  className={`chat-item ${chatId === chat.id ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    {getProviderIcon(chat.provider)}
                    <span className="chat-item-title">{chat.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Folders Section */}
        <div>
          <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Folders</span>
            <button 
              onClick={() => setIsCreatingFolder(prev => !prev)}
              title="Create New Folder"
              style={{ color: 'var(--text-muted)' }}
              className="sidebar-btn"
            >
              <FolderPlus size={12} />
            </button>
          </div>

          {/* Inline Folder Creation Form */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolderSubmit} style={{ padding: '4px 8px', display: 'flex', gap: '4px' }}>
              <input 
                type="text" 
                placeholder="Folder title..." 
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                autoFocus
                className="search-input"
                style={{ padding: '6px 8px' }}
              />
              <button type="submit" className="sidebar-btn" style={{ padding: '4px' }}><Check size={14} /></button>
              <button type="button" onClick={() => setIsCreatingFolder(false)} className="sidebar-btn" style={{ padding: '4px' }}><X size={14} /></button>
            </form>
          )}

          <div className="chat-list-group" style={{ marginTop: '4px' }}>
            {folders.map(folder => {
              const folderChats = filteredChats.filter(chat => chat.folderId === folder.id);
              const isDragOver = dragOverFolderId === folder.id;
              
              return (
                <div 
                  key={folder.id} 
                  className={`folder-item ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDragOverFolderId(folder.id)}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedChatId = e.dataTransfer.getData('text/plain');
                    if (droppedChatId) {
                      moveChatToFolder(droppedChatId, folder.id);
                    }
                    setDragOverFolderId(null);
                  }}
                >
                  {editingFolderId === folder.id ? (
                    /* Inline Folder Rename Input */
                    <div style={{ display: 'flex', gap: '4px', padding: '4px 8px' }}>
                      <input 
                        type="text"
                        value={editFolderTitle}
                        onChange={(e) => setEditFolderTitle(e.target.value)}
                        className="search-input"
                        style={{ padding: '4px' }}
                        autoFocus
                      />
                      <button onClick={(e) => handleSaveRenameFolder(e, folder.id)} className="sidebar-btn"><Check size={12} /></button>
                      <button onClick={handleCancelRenameFolder} className="sidebar-btn"><X size={12} /></button>
                    </div>
                  ) : (
                    /* Standard Folder Header */
                    <div className="folder-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                        onClick={() => toggleFolderCollapse(folder.id)}
                      >
                        {folder.isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        <Folder size={13} style={{ marginLeft: '4px', color: 'var(--accent-color)' }} />
                        <span className="folder-title">{folder.title}</span>
                      </div>
                      
                      {/* Folder Quick Actions */}
                      <div style={{ display: 'flex', gap: '2px' }} className="folder-actions">
                        <button 
                          onClick={() => handleCreateNewChat(folder.id)} 
                          title="New Chat in Folder"
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                        >
                          <Plus size={12} />
                        </button>
                        <button 
                          onClick={(e) => handleStartRenameFolder(e, folder)} 
                          title="Rename Folder"
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => deleteFolder(folder.id)} 
                          title="Delete Folder"
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!folder.isCollapsed && (
                    <div className="folder-children">
                      {folderChats.map(chat => (
                        <div key={chat.id} style={{ position: 'relative' }}>
                          {editingChatId === chat.id ? (
                            <div style={{ display: 'flex', gap: '4px', padding: '4px 8px' }}>
                              <input 
                                type="text"
                                value={editChatTitle}
                                onChange={(e) => setEditChatTitle(e.target.value)}
                                className="search-input"
                                style={{ padding: '4px' }}
                                autoFocus
                              />
                              <button onClick={(e) => handleSaveRename(e, chat.id)} className="sidebar-btn"><Check size={12} /></button>
                              <button onClick={handleCancelRename} className="sidebar-btn"><X size={12} /></button>
                            </div>
                          ) : (
                            <Link 
                              to={`/chat/${chat.id}`}
                              className={`chat-item ${chatId === chat.id ? 'active' : ''}`}
                              style={{ paddingRight: '60px' }}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', chat.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                {getProviderIcon(chat.provider)}
                                <span className="chat-item-title">{chat.title}</span>
                              </div>

                              {/* Hover actions */}
                              <div className="chat-item-actions" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'none', gap: '4px' }}>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteChat(chat.id); }} style={{ color: chat.isFavorite ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                                  <Star size={12} fill={chat.isFavorite ? 'var(--accent-color)' : 'none'} />
                                </button>
                                <button onClick={(e) => handleStartRename(e, chat)}>
                                  <Edit3 size={12} />
                                </button>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteChat(chat.id); }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </Link>
                          )}
                        </div>
                      ))}
                      {folderChats.length === 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px' }}>Empty folder</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Chats Section */}
        <div 
          className={`recent-chats-container ${dragOverRoot ? 'drag-over' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragOverRoot(true)}
          onDragLeave={() => setDragOverRoot(false)}
          onDrop={(e) => {
            e.preventDefault();
            const droppedChatId = e.dataTransfer.getData('text/plain');
            if (droppedChatId) {
              moveChatToFolder(droppedChatId, null);
            }
            setDragOverRoot(false);
          }}
        >
          <div className="sidebar-section-title">Recent Chats</div>
          <div className="chat-list-group">
            {rootChats.map(chat => (
              <div key={chat.id} style={{ position: 'relative' }}>
                {editingChatId === chat.id ? (
                  <div style={{ display: 'flex', gap: '4px', padding: '4px 8px' }}>
                    <input 
                      type="text"
                      value={editChatTitle}
                      onChange={(e) => setEditChatTitle(e.target.value)}
                      className="search-input"
                      style={{ padding: '4px' }}
                      autoFocus
                    />
                    <button onClick={(e) => handleSaveRename(e, chat.id)} className="sidebar-btn"><Check size={12} /></button>
                    <button onClick={handleCancelRename} className="sidebar-btn"><X size={12} /></button>
                  </div>
                ) : (
                  <Link 
                    to={`/chat/${chat.id}`}
                    className={`chat-item ${chatId === chat.id ? 'active' : ''}`}
                    style={{ paddingRight: '60px' }}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', chat.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      {getProviderIcon(chat.provider)}
                      <span className="chat-item-title">{chat.title}</span>
                    </div>

                    {/* Hover actions */}
                    <div className="chat-item-actions" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'none', gap: '4px' }}>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteChat(chat.id); }} style={{ color: chat.isFavorite ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                        <Star size={12} fill={chat.isFavorite ? 'var(--accent-color)' : 'none'} />
                      </button>
                      <button onClick={(e) => handleStartRename(e, chat)}>
                        <Edit3 size={12} />
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteChat(chat.id); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </Link>
                )}
              </div>
            ))}
            {rootChats.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No conversations
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div 
          className="user-profile" 
          onClick={onOpenAuth} 
          title={user ? `Signed in as ${user.email}. Click to manage account.` : "Click to log in/sign up"}
        >
          <div 
            className="user-avatar" 
            style={{ 
              backgroundColor: user ? 'var(--accent-color)' : 'var(--border-primary)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {user ? user.email[0].toUpperCase() : 'G'}
          </div>
          <span className="user-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '110px' }}>
            {user ? user.email : 'Guest Mode'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="sidebar-btn" 
            onClick={handleImportClick}
            title="Import Chat (JSON)"
            aria-label="Import conversation transcript"
          >
            <Upload size={18} />
          </button>
          {user && user.role === 'admin' && (
            <button 
              className="sidebar-btn" 
              onClick={onOpenAdmin}
              title="Admin Panel"
              aria-label="Open Admin Dashboard"
              style={{ color: 'var(--accent-cyan)' }}
            >
              <Shield size={18} />
            </button>
          )}
          <button 
            className="sidebar-btn" 
            onClick={onOpenSettings}
            title="Settings"
            aria-label="Open Workspace Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Hidden file input for single conversation JSON imports */}
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImportChange} 
        accept=".json" 
        style={{ display: 'none' }} 
      />
    </aside>
  );
}

export default Sidebar;
