/* pollinations.js - Pollinations AI Keyless Free Provider Adapter for Much */

export const PollinationsProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'openai', // 'openai' routes to GPT-4o
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: options.temperature ?? 0.7,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pollinations AI error: ${response.status} - ${errText}`);
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
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.substring(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse Pollinations delta line:', trimmed, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
