/* image.js - Express Route wrapping keyless Pollinations Stable Diffusion / Flux Image Generation API */

import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect image generation routes with token auth
router.use(verifyToken);

router.get('/generate', async (req, res) => {
  try {
    const { prompt, model = 'flux', width = 1024, height = 768 } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt query parameter is required.' });
    }

    // Clean prompt string for URL parameter matching
    const sanitizedPrompt = encodeURIComponent(prompt.trim());
    
    // Choose model engine (defaulting to flux, fallback to turbo for speed)
    const engineModel = ['flux', 'turbo'].includes(model.toLowerCase()) ? model.toLowerCase() : 'flux';
    
    // Construct Pollinations keyless GET request URL
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${sanitizedPrompt}?width=${width}&height=${height}&model=${engineModel}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    console.log(`[ImageGen] Requesting: ${pollinationsUrl}`);

    const response = await fetch(pollinationsUrl);
    
    if (!response.ok) {
      throw new Error(`External image generation service returned status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream binary image back
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(buffer);

  } catch (error) {
    console.error('[ImageGen] Generation failed:', error);
    res.status(500).json({ error: 'Failed to generate image. Please try again later.' });
  }
});

export default router;
