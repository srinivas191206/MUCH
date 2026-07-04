/* ai.js - Frontend API Gateway Client for Much */

import { API_URL } from '../config.js';

export const AIService = {
  /**
   * Route completion requests to our backend Express stream proxy.
   * Keeps API keys hidden securely on the server and avoids CORS issues.
   */
  async streamCompletion(provider, model, messages, userApiKey, options = {}, onChunk, signal) {
    const token = localStorage.getItem('much_auth_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        provider,
        model,
        messages,
        customKey: userApiKey,
        options
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Handle error strings written inside the stream
        if (chunk.startsWith('Error:')) {
          throw new Error(chunk.substring(6).trim());
        }

        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  }
};
