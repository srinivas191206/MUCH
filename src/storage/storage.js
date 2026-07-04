/* storage.js - Local Storage Management Layer for Much Workspace */

const VERSION = 'v1';

export const STORAGE_KEYS = {
  CHATS: `much_chats_${VERSION}`,
  FOLDERS: `much_folders_${VERSION}`,
  SETTINGS: `much_settings_${VERSION}`
};

// Initial default settings state
const DEFAULT_SETTINGS = {
  theme: 'dark',
  apiKeys: {
    groq: '',
    gemini: '',
    openrouter: '',
    nvidia: '',
    cohere: '',
    openai: '',
    huggingface: ''
  },
  parameters: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9
  },
  defaultProvider: 'gemini',
  defaultModel: 'gemini-2.5-flash'
};

export const DB = {
  // Initialize storage structure if not present
  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing LocalStorage database:', error);
    }
  },

  // ==========================================================================
  // Settings API
  // ==========================================================================
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.init();
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  },

  // ==========================================================================
  // Folders API
  // ==========================================================================
  getFolders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse folders:', e);
      return [];
    }
  },

  saveFolders(folders) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      return true;
    } catch (e) {
      console.error('Failed to save folders:', e);
      return false;
    }
  },

  // ==========================================================================
  // Chats API
  // ==========================================================================
  getChats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse chats:', e);
      return [];
    }
  },

  saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
      return true;
    } catch (e) {
      console.error('Failed to save chats:', e);
      return false;
    }
  },

  getChatById(id) {
    const chats = this.getChats();
    return chats.find(c => c.id === id) || null;
  },

  // Save or update a single chat
  upsertChat(chat) {
    const chats = this.getChats();
    const index = chats.findIndex(c => c.id === chat.id);
    const now = new Date().toISOString();
    
    const targetChat = {
      ...chat,
      updatedAt: now
    };

    if (index >= 0) {
      chats[index] = targetChat;
    } else {
      targetChat.createdAt = now;
      chats.unshift(targetChat);
    }
    
    return this.saveChats(chats);
  },

  deleteChat(id) {
    const chats = this.getChats();
    const filtered = chats.filter(c => c.id !== id);
    return this.saveChats(filtered);
  }
};

// Auto-run initialization
DB.init();
