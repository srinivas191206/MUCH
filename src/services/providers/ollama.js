/* ollama.js - Local Ollama Provider Adapter for Much */

export const OllamaProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2048,
          top_p: options.topP ?? 0.9
        },
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Retain last incomplete line in buffer
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            const content = data.message?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.warn('Failed to parse Ollama JSON-line:', trimmed, e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
