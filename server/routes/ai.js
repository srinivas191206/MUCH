import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { GeminiProvider, GroqProvider, OpenRouterProvider, PollinationsProvider } from '../services/providers.js';
import { Usage } from '../models/Usage.js';
import * as mcpManager from '../services/mcpManager.js';

const router = express.Router();

const PROVIDERS = {
  gemini: GeminiProvider,
  groq: GroqProvider,
  openrouter: OpenRouterProvider,
  pollinations: PollinationsProvider
};

// Server-Side Fallback Keys
const FALLBACK_KEYS = {
  gemini: [],
  groq: [],
  openrouter: []
};

// Rotation Indices
const activeIndices = {
  gemini: 0,
  groq: 0,
  openrouter: 0
};

// Helper to resolve key
const getApiKey = (provider, customKey) => {
  if (customKey && customKey.trim()) {
    return customKey.trim();
  }
  // Try environment variable
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  // Fall back to pool
  const pool = FALLBACK_KEYS[provider] || [];
  if (pool.length === 0) return '';
  return pool[activeIndices[provider] % pool.length];
};

// Helper to rotate key
const rotateApiKey = (provider) => {
  const pool = FALLBACK_KEYS[provider] || [];
  if (pool.length <= 1) return;
  activeIndices[provider] = (activeIndices[provider] + 1) % pool.length;
  console.log(`Rotated key for ${provider}. New index: ${activeIndices[provider]}`);
};

async function handleGeminiTools(model, messages, apiKey, options, res, signal, reqUserId, promptChars) {
  let currentMessages = [...messages];
  let responseChars = 0;
  
  while (true) {
    const mcpTools = mcpManager.listTools();
    if (mcpTools.length === 0) break;

    // Convert MCP tools to Gemini function declarations
    const declarations = mcpTools.map(t => ({
      name: `${t.serverName}__${t.name}`,
      description: t.description || `Exposed tool ${t.name}`,
      parameters: t.inputSchema || { type: 'OBJECT', properties: {} }
    }));

    const contents = currentMessages
      .filter(m => m.role !== 'system')
      .map(m => {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (m.parts) {
          return { role, parts: m.parts };
        }
        return { role, parts: [{ text: m.content || '' }] };
      });

    const systemMsg = currentMessages.find(m => m.role === 'system');
    const requestBody = {
      contents,
      tools: [{ functionDeclarations: declarations }],
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Tool Call error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    const parts = content?.parts || [];

    // Check if the model requested a function call
    const functionCalls = parts.filter(p => p.functionCall);
    if (functionCalls.length > 0) {
      // Add the model's call to the thread
      currentMessages.push({
        role: 'assistant',
        parts: parts
      });

      // Execute each function call and collect responses
      const responseParts = [];
      for (const part of functionCalls) {
        const fc = part.functionCall;
        const [serverName, actualToolName] = fc.name.split('__');
        res.write(`\n[Executing tool: ${actualToolName}...]\n`);
        let toolResult;
        try {
          toolResult = await mcpManager.callTool(serverName, actualToolName, fc.args);
        } catch (err) {
          toolResult = { error: err.message };
        }
        responseParts.push({
          functionResponse: {
            name: fc.name,
            response: { result: toolResult }
          }
        });
      }

      currentMessages.push({
        role: 'tool',
        parts: responseParts
      });
      
      // Continue the loop to let the model process the tool output
      continue;
    }

    // No more function calls, output final text
    const finalParts = parts.filter(p => p.text);
    const finalOutput = finalParts.map(p => p.text).join('');
    res.write(finalOutput);
    responseChars += finalOutput.length;
    break;
  }

  // Log usage
  try {
    await Usage.create({
      userId: reqUserId,
      provider: 'gemini',
      model,
      promptChars,
      completionChars: responseChars
    });
  } catch (err) {
    console.error("Failed to log usage metrics:", err);
  }
}

async function handleOpenAiCompatibleTools(provider, model, messages, apiKey, options, res, signal, reqUserId, promptChars) {
  let currentMessages = [...messages];
  let responseChars = 0;
  const endpoint = provider === 'openrouter' 
    ? 'https://openrouter.ai/api/v1/chat/completions' 
    : 'https://api.groq.com/openai/v1/chat/completions';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://much.ai';
    headers['X-Title'] = 'Much Workspace';
  }

  while (true) {
    const mcpTools = mcpManager.listTools();
    if (mcpTools.length === 0) break;

    // Convert MCP tools to OpenAI tool schemas
    const tools = mcpTools.map(t => ({
      type: 'function',
      function: {
        name: `${t.serverName}__${t.name}`,
        description: t.description || `Exposed tool ${t.name}`,
        parameters: t.inputSchema || { type: 'object', properties: {} }
      }
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: currentMessages.map(m => ({
          role: m.role === 'tool' ? 'tool' : m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || '',
          ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
          ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
        })),
        tools,
        tool_choice: 'auto',
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.9
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${provider.toUpperCase()} Tool Call error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Add assistant message to history
      currentMessages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
      });

      // Execute each tool call
      for (const tc of message.tool_calls) {
        const fc = tc.function;
        const [serverName, actualToolName] = fc.name.split('__');
        
        let args = {};
        try {
          args = typeof fc.arguments === 'string' ? JSON.parse(fc.arguments) : fc.arguments;
        } catch (e) {
          args = {};
        }

        res.write(`\n[Executing tool: ${actualToolName}...]\n`);
        let toolResult;
        try {
          toolResult = await mcpManager.callTool(serverName, actualToolName, args);
        } catch (err) {
          toolResult = { error: err.message };
        }

        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: fc.name,
          content: JSON.stringify(toolResult)
        });
      }

      continue;
    }

    // No tool calls, output final text
    const textOutput = message?.content || '';
    res.write(textOutput);
    responseChars += textOutput.length;
    break;
  }

  // Log usage
  try {
    await Usage.create({
      userId: reqUserId,
      provider,
      model,
      promptChars,
      completionChars: responseChars
    });
  } catch (err) {
    console.error("Failed to log usage metrics:", err);
  }
}

// Apply verifyToken to secure AI completions
router.post('/chat', verifyToken, async (req, res) => {
  const { provider, model, messages, customKey, options = {} } = req.body;

  const adapter = PROVIDERS[provider];
  if (!adapter) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  }

  // Set streaming headers
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let apiKey = getApiKey(provider, customKey);

  // Pollinations does not require keys
  if (provider !== 'pollinations' && !apiKey) {
    res.write(`Error: API Key for ${provider.toUpperCase()} is missing.`);
    return res.end();
  }

  const poolSize = FALLBACK_KEYS[provider]?.length || 1;
  const maxAttempts = customKey ? 1 : Math.min(3, poolSize);

  const promptChars = messages.reduce((acc, m) => acc + (m.content || '').length, 0);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const mcpTools = mcpManager.listTools();
      const hasMcpTools = mcpTools.length > 0 && (provider === 'gemini' || provider === 'groq' || provider === 'openrouter');

      if (hasMcpTools) {
        if (provider === 'gemini') {
          await handleGeminiTools(model, messages, apiKey, options, res, req.signal, req.userId, promptChars);
        } else {
          await handleOpenAiCompatibleTools(provider, model, messages, apiKey, options, res, req.signal, req.userId, promptChars);
        }
        return res.end();
      }

      let responseChars = 0;
      await adapter.streamMessage(
        model,
        messages,
        apiKey,
        options,
        (chunk) => {
          responseChars += chunk.length;
          res.write(chunk);
        },
        req.signal
      );

      // Save usage analytics asynchronously
      try {
        await Usage.create({
          userId: req.userId,
          provider,
          model,
          promptChars,
          completionChars: responseChars
        });
      } catch (err) {
        console.error("Failed to log usage metrics:", err);
      }

      return res.end();
    } catch (error) {
      console.error(`AI Proxy attempt ${attempt} failed:`, error.message);
      
      const errorMsg = error.message.toLowerCase();
      const isAuthError = errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('unauthorized') || errorMsg.includes('key');
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('throttled');
      const canRetry = (isAuthError || isRateLimit) && attempt < maxAttempts && !customKey;

      if (canRetry) {
        rotateApiKey(provider);
        apiKey = getApiKey(provider, customKey);
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }

      res.write(`Error: ${error.message}`);
      return res.end();
    }
  }
});

// GET organic search results from DuckDuckGo without API keys
router.post('/search', verifyToken, async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.json([]);
    }

    const html = await response.text();
    const results = [];
    const parts = html.split('class="result ');

    for (let i = 1; i < parts.length && results.length < 5; i++) {
      const part = parts[i];
      const urlMatch = part.match(/href="([^"]*)"/);
      const titleMatch = part.match(/class="result__url"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = part.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (urlMatch && titleMatch && snippetMatch) {
        let url = urlMatch[1];
        if (url.includes('uddg=')) {
          const queryParam = url.split('uddg=')[1]?.split('&')[0];
          if (queryParam) {
            url = decodeURIComponent(queryParam);
          }
        }
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();

        results.push({ title, snippet, url });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Search route handler error:', err);
    res.status(500).json({ error: 'Web search execution failed.' });
  }
});

export default router;
