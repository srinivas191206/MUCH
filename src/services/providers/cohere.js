/* cohere.js - Cohere Provider Adapter for Much */

export const CohereProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    // Format history: Cohere requires the last message in 'message' and the rest in 'chat_history'
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'USER' : 'CHATBOT',
      message: msg.content
    }));

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'command-r-plus',
        message: lastUserMessage,
        chat_history: chatHistory,
        temperature: options.temperature ?? 0.7,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cohere API error: ${response.status} - ${errText}`);
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
            // Cohere event-type stream yields chunks inside event_type 'text-generation'
            if (data.event_type === 'text-generation' && data.text) {
              onChunk(data.text);
            }
          } catch (e) {
            // Ignore parse errors for metadata lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
