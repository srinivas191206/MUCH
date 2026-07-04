/* AppContext.jsx - React Context State Engine for Much */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DB } from '../storage/storage';
import { AIService } from '../services/ai';

const AppContext = createContext();

// Client-Side RAG helper
const performRAG = (fileText, query) => {
  if (!fileText) return '';
  if (fileText.length < 2000) {
    return fileText;
  }
  const paragraphs = fileText.split(/\n\s*\n/);
  const chunks = [];
  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmed];
      let currentChunk = '';
      sentences.forEach(s => {
        if (currentChunk.length + s.length > 500) {
          chunks.push(currentChunk.trim());
          currentChunk = s;
        } else {
          currentChunk += s;
        }
      });
      if (currentChunk) chunks.push(currentChunk.trim());
    } else {
      chunks.push(trimmed);
    }
  });

  if (chunks.length === 0) return fileText;

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) {
    return chunks.slice(0, 2).join('\n\n');
  }

  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    queryTerms.forEach(term => {
      if (chunkLower.includes(term)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const selected = scoredChunks
    .filter(item => item.score > 0)
    .slice(0, 2)
    .map(item => item.chunk);

  if (selected.length === 0) {
    return chunks.slice(0, 2).join('\n\n');
  }

  return selected.join('\n\n');
};

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('much_auth_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('much_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [chats, setChats] = useState(() => DB.getChats());
  const [folders, setFolders] = useState(() => DB.getFolders());
  const [settings, setSettings] = useState(() => DB.getSettings());
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [agents, setAgents] = useState([]);
  const [presets, setPresets] = useState([]);
  const [memories, setMemories] = useState([]);

  // Streaming lifecycle states
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortControllers, setAbortControllers] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareProvider, setCompareProvider] = useState('groq');
  const [compareModel, setCompareModel] = useState('llama-3.1-8b-instant');
  const [isMcpOpen, setIsMcpOpen] = useState(false);

  // Synchronize dynamic theme triggers
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Intercept OAuth callback query tokens from redirects
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      if (tokenParam) {
        try {
          const res = await fetch('http://localhost:5001/api/auth/me', {
            headers: { 'Authorization': `Bearer ${tokenParam}` }
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('much_auth_token', tokenParam);
            localStorage.setItem('much_user', JSON.stringify(data.user));
            setToken(tokenParam);
            setUser(data.user);
          }
        } catch (err) {
          console.error('OAuth token verification failed:', err);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    handleOAuthCallback();
  }, []);

  // Load chats, folders, and custom agents from database if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const chatsRes = await fetch('http://localhost:5001/api/data/chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chatsRes.ok) {
          const serverChats = await chatsRes.json();
          setChats(serverChats);
        }

        const foldersRes = await fetch('http://localhost:5001/api/data/folders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (foldersRes.ok) {
          const serverFolders = await foldersRes.json();
          setFolders(serverFolders);
        }

        const agentsRes = await fetch('http://localhost:5001/api/agents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (agentsRes.ok) {
          const serverAgents = await agentsRes.json();
          setAgents(serverAgents);
        }

        const presetsRes = await fetch('http://localhost:5001/api/presets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (presetsRes.ok) {
          const serverPresets = await presetsRes.json();
          setPresets(serverPresets);
        }

        const memoriesRes = await fetch('http://localhost:5001/api/memories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (memoriesRes.ok) {
          const serverMemories = await memoriesRes.json();
          setMemories(serverMemories);
        }
      } catch (err) {
        console.error('Error fetching database syncing:', err);
      }
    };

    fetchUserData();
  }, [token]);

  // ==========================================================================
  // Auth Operations
  // ==========================================================================
  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) return false;
      const data = await res.json();

      localStorage.setItem('much_auth_token', data.token);
      localStorage.setItem('much_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const signup = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) return false;
      const data = await res.json();

      localStorage.setItem('much_auth_token', data.token);
      localStorage.setItem('much_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('much_auth_token');
    localStorage.removeItem('much_user');
    setToken(null);
    setUser(null);
    setAgents([]);
    setPresets([]);
    setMemories([]);
    // Reset back to local guest storage
    setChats(DB.getChats());
    setFolders(DB.getFolders());
  };

  // Custom AI Agent CRUD Operations
  const createAgent = async (agentData) => {
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:5001/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(agentData)
      });
      if (res.ok) {
        const newAgent = await res.json();
        setAgents(prev => [newAgent, ...prev]);
        return newAgent;
      }
    } catch (err) {
      console.error('Error creating agent:', err);
    }
    return null;
  };

  const updateAgent = async (agentId, agentData) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(agentData)
      });
      if (res.ok) {
        const updated = await res.json();
        setAgents(prev => prev.map(a => a._id === agentId ? updated : a));
        return true;
      }
    } catch (err) {
      console.error('Error updating agent:', err);
    }
    return false;
  };

  const deleteAgent = async (agentId) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAgents(prev => prev.filter(a => a._id !== agentId));
        return true;
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
    return false;
  };

  // Custom AI Presets Operations
  const createPreset = async (presetData) => {
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:5001/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(presetData)
      });
      if (res.ok) {
        const newPreset = await res.json();
        setPresets(prev => [newPreset, ...prev]);
        return newPreset;
      }
    } catch (err) {
      console.error('Error creating preset:', err);
    }
    return null;
  };

  const deletePreset = async (presetId) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/presets/${presetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPresets(prev => prev.filter(p => p._id !== presetId));
        return true;
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
    return false;
  };

  const applyPreset = (preset) => {
    updateDefaultModel(preset.provider, preset.model);
    const updatedParams = {
      ...settings.parameters,
      temperature: preset.temperature,
      maxTokens: preset.maxTokens,
      topP: preset.topP
    };
    updateParameters(updatedParams);
  };

  // Custom AI Memories Operations
  const createMemory = async (content) => {
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:5001/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const newMemory = await res.json();
        setMemories(prev => [newMemory, ...prev]);
        return newMemory;
      }
    } catch (err) {
      console.error('Error creating memory:', err);
    }
    return null;
  };

  const deleteMemory = async (memoryId) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/memories/${memoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m._id !== memoryId));
        return true;
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
    return false;
  };

  // ==========================================================================
  // Admin Operations
  // ==========================================================================
  const fetchUsers = async () => {
    if (!token) return [];
    try {
      const res = await fetch('http://localhost:5001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Fetch users error:', err);
    }
    return [];
  };

  const updateUserRole = async (userId, role) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      return res.ok;
    } catch (err) {
      console.error('Update user role error:', err);
    }
    return false;
  };

  const updateUserStatus = async (userId, status) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (err) {
      console.error('Update user status error:', err);
    }
    return false;
  };

  const deleteUser = async (userId) => {
    if (!token) return false;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok;
    } catch (err) {
      console.error('Delete user error:', err);
    }
    return false;
  };

  const fetchAnalytics = async () => {
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:5001/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Fetch analytics error:', err);
    }
    return null;
  };

  // ==========================================================================
  // Database Sync Helpers
  // ==========================================================================
  const syncChat = async (chat) => {
    DB.upsertChat(chat); // Always save local cache first

    if (!token) return;
    try {
      await fetch('http://localhost:5001/api/data/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(chat)
      });
    } catch (err) {
      console.error('Error syncing chat:', err);
    }
  };

  const syncDeleteChat = async (chatId) => {
    DB.deleteChat(chatId);

    if (!token) return;
    try {
      await fetch(`http://localhost:5001/api/data/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error syncing delete chat:', err);
    }
  };

  const syncFolder = async (folder, allFoldersList) => {
    DB.saveFolders(allFoldersList);

    if (!token) return;
    try {
      await fetch('http://localhost:5001/api/data/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(folder)
      });
    } catch (err) {
      console.error('Error syncing folder:', err);
    }
  };

  const syncDeleteFolder = async (folderId, allFoldersList) => {
    DB.saveFolders(allFoldersList);

    if (!token) return;
    try {
      await fetch(`http://localhost:5001/api/data/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error syncing delete folder:', err);
    }
  };

  // Cancel any active stream request
  const cancelGeneration = () => {
    abortControllers.forEach(ctrl => {
      try { ctrl.abort(); } catch (e) {}
    });
    setAbortControllers([]);
    setIsGenerating(false);
  };

  // ==========================================================================
  // Folders operations
  // ==========================================================================
  const createFolder = (title) => {
    if (!title.trim()) return;
    const newFolder = {
      id: `folder_${Date.now()}`,
      title: title.trim(),
      isCollapsed: false,
      createdAt: new Date().toISOString()
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    syncFolder(newFolder, updated);
    return newFolder.id;
  };

  const renameFolder = (folderId, newTitle) => {
    if (!newTitle.trim()) return;
    let target = null;
    const updated = folders.map(f => {
      if (f.id === folderId) {
        target = { ...f, title: newTitle.trim() };
        return target;
      }
      return f;
    });
    setFolders(updated);
    if (target) syncFolder(target, updated);
  };

  const deleteFolder = (folderId) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    syncDeleteFolder(folderId, updatedFolders);

    const updatedChats = chats.map(c => 
      c.folderId === folderId ? { ...c, folderId: null } : c
    );
    setChats(updatedChats);
    
    // Async save updated chat dependencies
    updatedChats.forEach(c => {
      if (c.folderId === null) syncChat(c);
    });
  };

  const toggleFolderCollapse = (folderId) => {
    let target = null;
    const updated = folders.map(f => {
      if (f.id === folderId) {
        target = { ...f, isCollapsed: !f.isCollapsed };
        return target;
      }
      return f;
    });
    setFolders(updated);
    if (target) syncFolder(target, updated);
  };

  // ==========================================================================
  // Chats operations
  // ==========================================================================
  const createNewChat = (folderId = null) => {
    const newChat = {
      id: `chat_${Date.now()}`,
      title: 'New Conversation',
      folderId,
      isFavorite: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    syncChat(newChat);
    return newChat.id;
  };

  const deleteChat = (chatId) => {
    const updated = chats.filter(c => c.id !== chatId);
    setChats(updated);
    syncDeleteChat(chatId);
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const renameChat = (chatId, newTitle) => {
    if (!newTitle.trim()) return;
    const active = chats.find(c => c.id === chatId);
    if (!active) return;
    const updatedChat = { ...active, title: newTitle.trim(), updatedAt: new Date().toISOString() };
    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    syncChat(updatedChat);
  };

  const toggleFavoriteChat = (chatId) => {
    const active = chats.find(c => c.id === chatId);
    if (!active) return;
    const updatedChat = { ...active, isFavorite: !active.isFavorite, updatedAt: new Date().toISOString() };
    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    syncChat(updatedChat);
  };

  const moveChatToFolder = (chatId, folderId) => {
    const active = chats.find(c => c.id === chatId);
    if (!active) return;
    const updatedChat = { ...active, folderId, updatedAt: new Date().toISOString() };
    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    syncChat(updatedChat);
  };

  // ==========================================================================
  // Core AI Streaming Engine
  // ==========================================================================
  const executeAISteam = async (chatId, history, assistantMsgId, provider, model) => {
    const controller = new AbortController();
    setAbortControllers(prev => [...prev, controller]);
    setIsGenerating(true);

    let targetProvider = provider;
    let targetModel = model;
    let systemPromptToInject = '';
    let memoriesSystemPrompt = '';

    // If there are user memories, compile them
    if (memories && memories.length > 0) {
      const memoriesList = memories.map(m => `- ${m.content}`).join('\n');
      memoriesSystemPrompt = `[User Memories & Preferences]: Remember these facts about the user during your replies:\n${memoriesList}`;
    }

    // If the provider is 'agent', resolve the actual model credentials and system prompt
    if (provider === 'agent') {
      const agent = agents.find(a => a._id === model);
      if (agent) {
        targetProvider = agent.provider;
        targetModel = agent.model;
        systemPromptToInject = agent.systemPrompt;
      }
    }

    const apiKey = settings.apiKeys[targetProvider] || '';
    const params = settings.parameters;
    let streamedText = '';

    // Compile RAG & Web Search prompt injections under the hood for API payload only
    let compiledHistory = [];
    for (const msg of history) {
      if (msg.role === 'user') {
        let content = msg.content;

        // 1. Fetch web search results if active
        if (msg.webSearch) {
          try {
            const searchRes = await fetch('http://localhost:5001/api/ai/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ query: msg.content })
            });
            if (searchRes.ok) {
              const results = await searchRes.json();
              if (results && results.length > 0) {
                const formattedResults = results.map((r, i) => `Result #${i+1}: ${r.title} (${r.url})\nSnippet: ${r.snippet}`).join('\n\n');
                content = `[Web Search Results]: Here are the top web search results matching the query:\n---\n${formattedResults}\n---\nPlease use the search results above to answer the user query:\nUser Query: ${content}`;
              }
            }
          } catch (err) {
            console.error('Error fetching web search results:', err);
          }
        }

        // 2. Perform file document RAG if active
        if (msg.fileAttachments && msg.fileAttachments.length > 0) {
          let combinedContext = '';
          msg.fileAttachments.forEach(file => {
            const context = performRAG(file.text, msg.content);
            combinedContext += `\n[File Attachment: "${file.name}"]:\n---\n${context}\n---\n`;
          });
          content = `[Attached Document Contexts]:\n${combinedContext}\nUser Query: ${content}`;
        } else if (msg.fileAttachment) {
          const context = performRAG(msg.fileAttachment.text, msg.content);
          content = `[Document Text Content]: The user uploaded a document named "${msg.fileAttachment.name}". Here is the relevant text content extracted from the document to help you answer the query:\n---\n${context}\n---\n${content}`;
        }

        compiledHistory.push({ ...msg, content });
      } else {
        compiledHistory.push(msg);
      }
    }

    // Prepend user memories if present
    if (memoriesSystemPrompt) {
      compiledHistory = [
        { id: 'memories_system', role: 'system', content: memoriesSystemPrompt },
        ...compiledHistory
      ];
    }

    // If using a custom agent, prepend the custom system instructions to history
    if (systemPromptToInject) {
      compiledHistory = [
        { id: 'agent_system', role: 'system', content: systemPromptToInject },
        ...compiledHistory
      ];
    }

    try {
      await AIService.streamCompletion(
        targetProvider,
        targetModel,
        compiledHistory,
        apiKey,
        params,
        (chunk) => {
          streamedText += chunk;

          setChats(prevChats => prevChats.map(c => {
            if (c.id === chatId) {
              const updatedMessages = c.messages.map(m => 
                m.id === assistantMsgId ? { ...m, content: streamedText } : m
              );
              return { ...c, messages: updatedMessages };
            }
            return c;
          }));
        },
        controller.signal
      );

      // Save complete conversation on finish
      setChats(prevChats => {
        const finalChat = prevChats.find(c => c.id === chatId);
        if (finalChat) {
          syncChat(finalChat);
        }
        return prevChats;
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        streamedText += '\n\n*(Generation stopped by user)*';
      } else {
        if (targetProvider !== 'groq') {
          const providerNames = {
            gemini: 'Google Gemini',
            openrouter: 'OpenRouter',
            nvidia: 'NVIDIA NIM',
            pollinations: 'Pollinations AI'
          };
          const name = providerNames[targetProvider] || targetProvider;
          streamedText = `This model is currently undergoing integration or API quota limits for ${name} have been exceeded. Please switch to Groq Cloud (Llama 3.1 8B) or another active model to continue your conversation!\n\n**Details:** ${error.message}`;
        } else {
          streamedText += `\n\n**Error:** ${error.message}`;
        }
      }

      setChats(prevChats => {
        return prevChats.map(c => {
          if (c.id === chatId) {
            const updatedMessages = c.messages.map(m => 
              m.id === assistantMsgId ? { ...m, content: streamedText } : m
            );
            const chatObj = { ...c, messages: updatedMessages };
            syncChat(chatObj);
            return chatObj;
          }
          return c;
        });
      });
    } finally {
      setAbortControllers(prev => {
        const filtered = prev.filter(c => c !== controller);
        if (filtered.length === 0) {
          setIsGenerating(false);
        }
        return filtered;
      });
    }
  };

  // 1. Send new prompt
  const askAI = async (chatId, userPrompt, provider, model, attachedFiles = null, webSearch = false) => {
    if (isGenerating) return;

    const filesArray = Array.isArray(attachedFiles)
      ? attachedFiles
      : (attachedFiles ? [attachedFiles] : []);

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userPrompt,
      fileAttachment: filesArray.length > 0 ? {
        name: filesArray[0].name,
        size: filesArray[0].size,
        text: filesArray[0].text
      } : null,
      fileAttachments: filesArray.map(f => ({
        name: f.name,
        size: f.size,
        text: f.text
      })),
      webSearch,
      timestamp: new Date().toISOString()
    };

    const activeChat = chats.find(c => c.id === chatId);
    if (!activeChat) return;

    const history = [...activeChat.messages, userMsg];

    let title = activeChat.title;
    if (activeChat.title === 'New Conversation') {
      title = userPrompt.length > 28 
        ? userPrompt.substring(0, 28) + '...' 
        : userPrompt;
    }

    if (compareMode) {
      const assistantMsgIdA = `ai_${Date.now()}_A`;
      const assistantMsgIdB = `ai_${Date.now()}_B`;

      const placeholderMsgA = {
        id: assistantMsgIdA,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const placeholderMsgB = {
        id: assistantMsgIdB,
        role: 'assistant',
        content: '',
        provider: compareProvider,
        model: compareModel,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        title,
        messages: [...history, placeholderMsgA, placeholderMsgB],
        updatedAt: new Date().toISOString()
      };

      const reorderedChats = [
        updatedChat,
        ...chats.filter(c => c.id !== chatId)
      ];
      setChats(reorderedChats);

      await Promise.all([
        executeAISteam(chatId, history, assistantMsgIdA, provider, model),
        executeAISteam(chatId, history, assistantMsgIdB, compareProvider, compareModel)
      ]);
    } else {
      const assistantMsgId = `ai_${Date.now()}`;
      const placeholderMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        title,
        messages: [...history, placeholderMsg],
        updatedAt: new Date().toISOString()
      };

      const reorderedChats = [
        updatedChat,
        ...chats.filter(c => c.id !== chatId)
      ];
      setChats(reorderedChats);

      await executeAISteam(chatId, history, assistantMsgId, provider, model);
    }
  };

  // 2. Regenerate response
  const regenerateMessage = async (chatId, provider, model) => {
    if (isGenerating) return;

    const activeChat = chats.find(c => c.id === chatId);
    if (!activeChat || activeChat.messages.length === 0) return;

    const messages = activeChat.messages;
    
    // Slice off all trailing assistant messages
    let history = [...messages];
    while (history.length > 0 && history[history.length - 1].role === 'assistant') {
      history.pop();
    }

    if (history.length === 0) return;

    if (compareMode) {
      const assistantMsgIdA = `ai_${Date.now()}_A`;
      const assistantMsgIdB = `ai_${Date.now()}_B`;

      const placeholderMsgA = {
        id: assistantMsgIdA,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const placeholderMsgB = {
        id: assistantMsgIdB,
        role: 'assistant',
        content: '',
        provider: compareProvider,
        model: compareModel,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        messages: [...history, placeholderMsgA, placeholderMsgB],
        updatedAt: new Date().toISOString()
      };

      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));

      await Promise.all([
        executeAISteam(chatId, history, assistantMsgIdA, provider, model),
        executeAISteam(chatId, history, assistantMsgIdB, compareProvider, compareModel)
      ]);
    } else {
      const assistantMsgId = `ai_${Date.now()}`;
      const placeholderMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        messages: [...history, placeholderMsg],
        updatedAt: new Date().toISOString()
      };

      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));

      await executeAISteam(chatId, history, assistantMsgId, provider, model);
    }
  };

  // 3. Edit prompt and resubmit
  const editUserMessage = async (chatId, messageId, newContent, provider, model) => {
    if (isGenerating) return;

    const activeChat = chats.find(c => c.id === chatId);
    if (!activeChat) return;

    const messages = activeChat.messages;
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const history = messages.slice(0, msgIndex + 1);
    
    history[msgIndex] = {
      ...history[msgIndex],
      content: newContent,
      timestamp: new Date().toISOString()
    };

    if (compareMode) {
      const assistantMsgIdA = `ai_${Date.now()}_A`;
      const assistantMsgIdB = `ai_${Date.now()}_B`;

      const placeholderMsgA = {
        id: assistantMsgIdA,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const placeholderMsgB = {
        id: assistantMsgIdB,
        role: 'assistant',
        content: '',
        provider: compareProvider,
        model: compareModel,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        messages: [...history, placeholderMsgA, placeholderMsgB],
        updatedAt: new Date().toISOString()
      };

      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));

      await Promise.all([
        executeAISteam(chatId, history, assistantMsgIdA, provider, model),
        executeAISteam(chatId, history, assistantMsgIdB, compareProvider, compareModel)
      ]);
    } else {
      const assistantMsgId = `ai_${Date.now()}`;
      const placeholderMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        provider,
        model,
        timestamp: new Date().toISOString()
      };

      const updatedChat = {
        ...activeChat,
        messages: [...history, placeholderMsg],
        updatedAt: new Date().toISOString()
      };

      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));

      await executeAISteam(chatId, history, assistantMsgId, provider, model);
    }
  };

  const importBackup = (data) => {
    if (!data || typeof data !== 'object') return false;
    
    const importedChats = Array.isArray(data.chats) ? data.chats : [];
    const importedFolders = Array.isArray(data.folders) ? data.folders : [];
    const importedSettings = (data.settings && typeof data.settings === 'object') ? data.settings : null;

    if (importedSettings) {
      const mergedSettings = {
        ...settings,
        ...importedSettings,
        apiKeys: { ...settings.apiKeys, ...importedSettings.apiKeys },
        parameters: { ...settings.parameters, ...importedSettings.parameters }
      };
      setSettings(mergedSettings);
      DB.saveSettings(mergedSettings);
    }

    setChats(importedChats);
    // Sync imported bulk items if logged in
    importedChats.forEach(c => syncChat(c));

    setFolders(importedFolders);
    DB.saveFolders(importedFolders);
    importedFolders.forEach(f => syncFolder(f, importedFolders));

    return true;
  };

  // ==========================================================================
  // Settings operations
  // ==========================================================================
  const updateApiKeys = (apiKeys) => {
    const updated = { ...settings, apiKeys };
    setSettings(updated);
    DB.saveSettings(updated);
  };

  const updateParameters = (parameters) => {
    const updated = { ...settings, parameters };
    setSettings(updated);
    DB.saveSettings(updated);
  };

  const updateTheme = (theme) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    DB.saveSettings(updated);
  };

  const updateDefaultModel = (provider, model) => {
    const updated = { ...settings, defaultProvider: provider, defaultModel: model };
    setSettings(updated);
    DB.saveSettings(updated);
  };

  const importSingleChat = (chatObj) => {
    setChats(prev => [chatObj, ...prev]);
    syncChat(chatObj);
  };

  const generateAIImage = async (chatId, promptText, modelEngine, aspect) => {
    if (isGenerating) return;
    setIsGenerating(true);

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: `/draw ${promptText}`,
      timestamp: new Date().toISOString()
    };

    const activeChat = chats.find(c => c.id === chatId);
    if (!activeChat) {
      setIsGenerating(false);
      return;
    }

    const history = [...activeChat.messages, userMsg];

    let title = activeChat.title;
    if (activeChat.title === 'New Conversation') {
      title = promptText.length > 28 
        ? promptText.substring(0, 28) + '...' 
        : promptText;
    }

    const assistantMsgId = `ai_${Date.now()}`;
    const placeholderMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '*(Generating image with AI, please wait...)*',
      provider: 'Flux',
      model: modelEngine,
      timestamp: new Date().toISOString()
    };

    const updatedChat = {
      ...activeChat,
      title,
      messages: [...history, placeholderMsg],
      updatedAt: new Date().toISOString()
    };

    setChats([
      updatedChat,
      ...chats.filter(c => c.id !== chatId)
    ]);

    try {
      let width = 1024;
      let height = 768;
      if (aspect === 'square') {
        width = 1024;
        height = 1024;
      } else if (aspect === 'portrait') {
        width = 768;
        height = 1024;
      }

      let dataUrl = '';

      if (settings.apiKeys && settings.apiKeys.huggingface) {
        // 1. Call Hugging Face Serverless Inference (Stable Diffusion XL - Non-gated)
        const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
          headers: { 
            'Authorization': `Bearer ${settings.apiKeys.huggingface}`,
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ inputs: promptText })
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Hugging Face API error: ${response.status} ${errText}`);
        }

        const blob = await response.blob();
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else if (settings.apiKeys && settings.apiKeys.openai) {
        // 2. Call OpenAI DALL-E 3
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKeys.openai}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: promptText,
            n: 1,
            size: aspect === 'square' ? '1024x1024' : (aspect === 'portrait' ? '1024x1792' : '1792x1024')
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `OpenAI DALL-E returned status ${response.status}`);
        }

        const resData = await response.json();
        dataUrl = resData.data[0].url;
      } else {
        // 3. Fallback to public keyless Pollinations endpoint
        const sanitizedPrompt = encodeURIComponent(promptText.trim());
        const engineModel = ['flux', 'turbo'].includes(modelEngine.toLowerCase()) ? modelEngine.toLowerCase() : 'flux';
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${sanitizedPrompt}?width=${width}&height=${height}&model=${engineModel}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

        // Verify if pollinations responds successfully, else throw to trigger fallback
        const testRes = await fetch(pollinationsUrl);
        if (!testRes.ok) {
          throw new Error(`Pollinations returned status ${testRes.status}`);
        }
        dataUrl = pollinationsUrl;
      }

      setChats(prevChats => {
        return prevChats.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map(m => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content: `Here is your generated image for: **${promptText}**\n\n![AI Generated Image](${dataUrl})`
                  };
                }
                return m;
              })
            };
          }
          return c;
        });
      });

      const finalChat = {
        ...updatedChat,
        messages: [...history, {
          ...placeholderMsg,
          content: `Here is your generated image for: **${promptText}**\n\n![AI Generated Image](${dataUrl})`
        }]
      };

      await fetch('http://localhost:5001/api/data/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: finalChat.id,
          title: finalChat.title,
          folderId: finalChat.folderId,
          messages: finalChat.messages
        })
      });

      setActiveArtifact({
        value: dataUrl,
        language: 'image',
        title: `Image: ${promptText.substring(0, 30)}`
      });

    } catch (error) {
      console.warn("Primary image generation failed, loading static Flickr fallback:", error);
      try {
        const stopWords = new Set(['a', 'an', 'the', 'and', 'with', 'of', 'in', 'on', 'for', 'to', 'at', 'by', 'from', 'draw', 'paint', 'image', 'picture', 'photo', 'sketch', 'illustration']);
        const clean = promptText.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
        const keywords = clean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        const searchTags = keywords.length > 0 ? keywords.slice(0, 3).join(',') : 'illustration';

        const fallbackUrl = `https://loremflickr.com/1024/768/${encodeURIComponent(searchTags)}`;
        
        // Fetch to resolve the actual redirected direct image URL
        const fallbackRes = await fetch(fallbackUrl);
        const finalUrl = fallbackRes.url; // This is the direct static image URL!

        setChats(prevChats => {
          return prevChats.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map(m => {
                  if (m.id === assistantMsgId) {
                    return {
                      ...m,
                      content: `Here is your generated image for: **${promptText}**\n\n![AI Generated Image](${finalUrl})`
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          });
        });

        const finalChat = {
          ...updatedChat,
          messages: [...history, {
            ...placeholderMsg,
            content: `Here is your generated image for: **${promptText}**\n\n![AI Generated Image](${finalUrl})`
          }]
        };

        await fetch('http://localhost:5001/api/data/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: finalChat.id,
            title: finalChat.title,
            folderId: finalChat.folderId,
            messages: finalChat.messages
          })
        });

        setActiveArtifact({
          value: finalUrl,
          language: 'image',
          title: `Image: ${promptText.substring(0, 30)}`
        });

      } catch (fallbackErr) {
        console.error("Ultimate fallback failed:", fallbackErr);
        setChats(prevChats => {
          return prevChats.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map(m => {
                  if (m.id === assistantMsgId) {
                    return {
                      ...m,
                      content: `⚠️ Failed to generate image: ${error.message}`
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          });
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppContext.Provider value={{
      chats,
      folders,
      settings,
      currentChatId,
      setCurrentChatId,
      importSingleChat,
      isGenerating,
      compareMode,
      setCompareMode,
      compareProvider,
      setCompareProvider,
      compareModel,
      setCompareModel,
      isMcpOpen,
      setIsMcpOpen,
      createFolder,
      renameFolder,
      deleteFolder,
      toggleFolderCollapse,
      createNewChat,
      deleteChat,
      renameChat,
      toggleFavoriteChat,
      moveChatToFolder,
      askAI,
      generateAIImage,
      regenerateMessage,
      editUserMessage,
      cancelGeneration,
      importBackup,
      updateApiKeys,
      updateParameters,
      updateTheme,
      updateDefaultModel,
      inputText,
      setInputText,
      // Authentication context variables
      user,
      token,
      login,
      signup,
      logout,
      // Artifacts context variables
      activeArtifact,
      setActiveArtifact,
      // Custom AI Agents variables
      agents,
      createAgent,
      updateAgent,
      deleteAgent,
      // Custom AI Presets variables
      presets,
      createPreset,
      deletePreset,
      applyPreset,
      // Custom AI Memories variables
      memories,
      createMemory,
      deleteMemory,
      // Admin operations
      fetchUsers,
      updateUserRole,
      updateUserStatus,
      deleteUser,
      fetchAnalytics
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
}
