/* keyManager.js - Dynamic API Key Selector and Auto-Rotation layer for Much */

import { FALLBACK_KEYS } from '../constants/apiKeys';

// Track current active index for each provider key pool
const activeIndices = {
  gemini: 0,
  groq: 0,
  openrouter: 0,
  nvidia: 0
};

export const KeyManager = {
  /**
   * Get the API Key to use for a request.
   * If user has entered their own key in Settings, use that.
   * Otherwise, return the current fallback key from the pool.
   * 
   * @param {string} provider - 'gemini' | 'groq' | 'openrouter' | 'nvidia'
   * @param {string} userKey - user's custom API key (optional)
   * @returns {string} resolved API key
   */
  getKey(provider, userKey) {
    if (userKey && userKey.trim()) {
      return userKey.trim();
    }
    
    const pool = FALLBACK_KEYS[provider] || [];
    if (pool.length === 0) return '';
    
    const index = activeIndices[provider] % pool.length;
    return pool[index];
  },

  /**
   * Rotates the key index for a provider.
   * Only applicable when using fallback keys.
   * 
   * @param {string} provider - 'gemini' | 'groq' | 'openrouter' | 'nvidia'
   * @param {string} userKey - user's custom API key
   * @returns {string} next API key in pool
   */
  rotateKey(provider, userKey) {
    if (userKey && userKey.trim()) {
      return userKey.trim(); // Can't rotate user's own custom key
    }

    const pool = FALLBACK_KEYS[provider] || [];
    if (pool.length <= 1) return pool[0] || '';

    // Move to next index
    activeIndices[provider] = (activeIndices[provider] + 1) % pool.length;
    console.log(`Rotating fallback key for ${provider}. New active index: ${activeIndices[provider]}`);
    
    return pool[activeIndices[provider]];
  }
};
