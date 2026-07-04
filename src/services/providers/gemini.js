/* gemini.js - Google Gemini Provider Adapter for Much */

export const GeminiProvider = {
  async streamMessage(model, messages, apiKey, options, onChunk, signal) {
    // 1. Format messages history for Gemini API specs
    const contents = messages
      .filter(m => m.role !== 'system') // Filter out system instructions from contents array
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

    // Inject system instructions if present
    if (systemMsg) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMsg.content }]
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Robust Balanced Braces parser for streamed JSON arrays
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
                  console.warn('Failed to parse Gemini object part:', jsonStr, err);
                }
              }
            }
          }
        }

        // Retain only incomplete braces in the buffer
        if (braceCount > 0) {
          buffer = buffer.substring(startIdx);
        } else {
          buffer = '';
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
