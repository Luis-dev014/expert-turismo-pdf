export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, imageBase64 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const key = process.env.GEMINI_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GEMINI_KEY not configured' });
  }

  const parts = [{ text: prompt }];

  if (imageBase64) {
    const cleanB64 = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.match(/data:(image\/[a-z]+);/)?.[1] || 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data: cleanB64 } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data });
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  return res.status(200).json({ text });
}
