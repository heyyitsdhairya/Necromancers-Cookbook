export const DREAMLAYER_API_KEY = import.meta.env.VITE_DREAMLAYER_API_KEY;

export async function downloadAssetAsBlobUrl(assetUrl) {
  try {
    const res = await fetch(assetUrl, {
      headers: { 'Authorization': `Bearer ${DREAMLAYER_API_KEY}` }
    });
    if (!res.ok) throw new Error(`Failed to download asset: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error downloading asset blob:", e);
    return null;
  }
}

// Helper to parse SSE
async function parseEventStreamForAsset(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assetUrl = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    let isAssetEvent = false;
    for (let line of lines) {
      if (line.startsWith('event: asset')) {
        isAssetEvent = true;
      } else if (line.startsWith('data:') && isAssetEvent) {
        try {
          const data = JSON.parse(line.replace('data:', '').trim());
          if (data.download_url) {
            assetUrl = data.download_url;
          }
        } catch(e) {
          console.error("Error parsing SSE data", e);
        }
        isAssetEvent = false; // reset for next event
      }
    }
    // Stream complete
  }
  
  if (assetUrl) {
    return assetUrl;
  }
  return null;
}

export async function generateBossImage(level) {
  if (!DREAMLAYER_API_KEY) {
    console.warn("No DreamLayer API Key found!");
    return null;
  }

  const adjectives = ['colossal', 'grotesque', 'shadowy', 'eldritch', 'blood-soaked', 'ethereal', 'bone-chilling', 'crystalline', 'decaying'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const prompt = `An illustration of a ${adj} dark fantasy boss monster, cosmic horror, high detail 2d game art`;
  
  try {
    const res = await fetch('https://api.dreamlayer.io/v1/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DREAMLAYER_API_KEY}`,
        'DreamLayer-Version': '1',
        'Idempotency-Key': `boss-gen-${Date.now()}-${Math.random()}`,
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '1:1',
        max_credits: 1
      })
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await parseEventStreamForAsset(res);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function sacrificeMonsterImage(monsterImageUrl, ingredientName) {
  if (!DREAMLAYER_API_KEY) return null;

  try {
    // 1. Fetch the image as a Blob to upload it
    let imgRes;
    if (monsterImageUrl.startsWith('https://api.dreamlayer.io')) {
      imgRes = await fetch(monsterImageUrl, {
        headers: { 'Authorization': `Bearer ${DREAMLAYER_API_KEY}` }
      });
    } else {
      imgRes = await fetch(monsterImageUrl);
    }
    const imgBlob = await imgRes.blob();

    // 2. Upload to DreamLayer
    const formData = new FormData();
    formData.append('file', imgBlob, 'reference.png');

    const uploadRes = await fetch('https://api.dreamlayer.io/v1/input-assets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DREAMLAYER_API_KEY}`
      },
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Failed to upload reference image');
    const uploadData = await uploadRes.json();
    const inputAssetId = uploadData.input_asset_id;

    // 3. Execute Image-to-Image
    const prompt = `A corrupted, mutated dark fantasy version of this creature using ${ingredientName}, horror, 2d game art`;

    const execRes = await fetch('https://api.dreamlayer.io/v1/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DREAMLAYER_API_KEY}`,
        'DreamLayer-Version': '1',
        'Idempotency-Key': `sac-${Date.now()}-${Math.random()}`,
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        input_asset_id: inputAssetId,
        aspect_ratio: '1:1',
        max_credits: 1
      })
    });

    if (!execRes.ok) throw new Error(`Exec API Error: ${execRes.status}`);
    return await parseEventStreamForAsset(execRes);
    
  } catch (err) {
    console.error(err);
    return null;
  }
}
