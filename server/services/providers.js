import fetch from 'node-fetch';

// ==========================================================================
// Google Gemini Provider
// ==========================================================================
export const GeminiProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const systemMsg = messages.find(m => m.role === 'system');
    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.9
      }
    };

    if (systemMsg) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMsg.content }]
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const bodyStream = response.body;
    let buffer = '';

    for await (const chunk of bodyStream) {
      buffer += chunk.toString();

      let startIdx = 0;
      let braceCount = 0;
      let insideString = false;
      let escape = false;

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];

        if (insideString) {
          if (escape) {
            escape = false;
          } else if (char === '\\') {
            escape = true;
          } else if (char === '"') {
            insideString = false;
          }
        } else {
          if (char === '"') {
            insideString = true;
          } else if (char === '{') {
            if (braceCount === 0) {
              startIdx = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const jsonStr = buffer.substring(startIdx, i + 1);
              try {
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  onChunk(text);
                }
              } catch (err) {
                // Ignore parse issues of partial blocks
              }
            }
          }
        }
      }

      if (braceCount > 0) {
        buffer = buffer.substring(startIdx);
      } else {
        buffer = '';
      }
    }
  }
};

// ==========================================================================
// Groq Cloud Provider
// ==========================================================================
export const GroqProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.9,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const bodyStream = response.body;
    let buffer = '';

    for await (const chunk of bodyStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.substring(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
};

// ==========================================================================
// OpenRouter Provider
// ==========================================================================
export const OpenRouterProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://much.ai',
        'X-Title': 'Much Workspace'
      },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.9,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const bodyStream = response.body;
    let buffer = '';

    for await (const chunk of bodyStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.substring(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
};

// ==========================================================================
// Pollinations AI Provider
// ==========================================================================
export const PollinationsProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'openai',
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

    const bodyStream = response.body;
    let buffer = '';

    for await (const chunk of bodyStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.substring(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
};
