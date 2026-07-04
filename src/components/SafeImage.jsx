import React, { useState, useEffect } from 'react';

export default function SafeImage({ src, alt, style = {}, onClick, ...props }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    // If it's a local file or base64 data, render directly
    if (!src || src.startsWith('data:')) {
      setImgSrc(src);
      setLoading(false);
      return;
    }

    const primaryImg = new Image();
    primaryImg.src = src;

    // Set a timeout of 12 seconds to load from Pollinations. 
    // If it hangs (due to community server outage), fallback to Flickr search.
    const timeoutId = setTimeout(() => {
      primaryImg.onload = null;
      primaryImg.onerror = null;
      triggerFallback();
    }, 12000);

    const triggerFallback = () => {
      console.warn("Primary image load failed or timed out. Falling back to Flickr search.");
      
      let rawQuery = 'artwork';
      try {
        // Try to extract the prompt from the URL path
        if (src.includes('pollinations.ai')) {
          const parts = src.split('/prompt/');
          if (parts.length > 1) {
            rawQuery = parts[1].split('?')[0];
          }
        }
      } catch (e) {
        console.error("Failed to parse prompt from URL", e);
      }

      if ((!rawQuery || rawQuery === 'artwork') && alt) {
        rawQuery = alt;
      }

      // 1. Decode the URL-encoded query first (e.g., %20 -> spaces)
      let decodedQuery = 'artwork';
      try {
        decodedQuery = decodeURIComponent(rawQuery);
      } catch (e) {
        decodedQuery = rawQuery;
      }

      // 2. Filter common stop words so Flickr receives high-signal keywords
      const stopWords = new Set(['a', 'an', 'the', 'and', 'with', 'of', 'in', 'on', 'for', 'to', 'at', 'by', 'from', 'draw', 'paint', 'image', 'picture', 'photo', 'sketch', 'illustration']);
      
      // Clean query and split into words
      const clean = decodedQuery.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
      const keywords = clean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      
      // Join tags with commas (max 3)
      const searchTags = keywords.length > 0 
        ? encodeURIComponent(keywords.slice(0, 3).join(','))
        : 'illustration';

      const fallbackUrl = `https://loremflickr.com/1024/768/${searchTags}`;
      
      const fallbackImg = new Image();
      fallbackImg.src = fallbackUrl;
      fallbackImg.onload = () => {
        setImgSrc(fallbackUrl);
        setLoading(false);
      };
      fallbackImg.onerror = () => {
        setError(true);
        setLoading(false);
      };
    };

    primaryImg.onload = () => {
      clearTimeout(timeoutId);
      setImgSrc(src);
      setLoading(false);
    };

    primaryImg.onerror = () => {
      clearTimeout(timeoutId);
      triggerFallback();
    };

    return () => {
      clearTimeout(timeoutId);
      primaryImg.onload = null;
      primaryImg.onerror = null;
    };
  }, [src, alt]);

  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '540px',
          aspectRatio: '4/3',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          margin: '12px 0',
          ...style
        }}
        className="glass-panel"
      >
        <div 
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--accent-color)',
            animation: 'safe-spin 1s linear infinite'
          }}
        />
        <span>AI is sketching, please wait...</span>
        <style>{`
          @keyframes safe-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 0, 0, 0.04)',
          border: '1px solid rgba(255, 0, 0, 0.15)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          ...style
        }}
      >
        <span>⚠️ Service busy or network rate-limited.</span>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      style={{
        maxWidth: '100%',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-premium)',
        transition: 'transform var(--transition-fast) ease',
        cursor: onClick ? 'pointer' : 'zoom-in',
        ...style
      }}
      onClick={onClick || (() => window.open(imgSrc, '_blank'))}
      {...props}
    />
  );
}
