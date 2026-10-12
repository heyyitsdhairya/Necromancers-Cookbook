import { useState, useEffect } from 'react';
import { downloadAssetAsBlobUrl } from '../game/api';

// A helper to display an image with a fallback if the user hasn't added the file yet.
export default function ItemIcon({ src, alt, className = '' }) {
  const [error, setError] = useState(false);
  const [finalSrc, setFinalSrc] = useState(src);

  // Reset error state if src changes
  useEffect(() => {
    setError(false);
    let isMounted = true;
    
    if (src && src.startsWith('https://api.dreamlayer.io')) {
      downloadAssetAsBlobUrl(src).then(blobUrl => {
        if (isMounted) {
          if (blobUrl) setFinalSrc(blobUrl);
          else setError(true);
        }
      });
    } else if (src && src.startsWith('/') && !src.startsWith('//')) {
      setFinalSrc('.' + src);
    } else {
      setFinalSrc(src);
    }
    
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (error || !finalSrc) {
    return (
      <div className={`fallback-img ${className}`} title={alt}>
        {alt || 'Missing'}
      </div>
    );
  }

  return (
    <img 
      src={finalSrc} 
      alt={alt} 
      className={`item-img ${className}`} 
      onError={() => setError(true)} 
      draggable="false"
    />
  );
}
