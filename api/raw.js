export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!FETCH_URL || !FETCH_TOKEN) return res.status(500).json({ error: 'Missing Redis Env' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !body.code) return res.status(400).json({ error: 'No code provided' });

    const scriptId = Math.random().toString(36).substring(2, 10);
    const scriptData = {
      id: scriptId,
      title: body.title || 'Untitled Script',
      game: body.game || 'General',
      code: body.code,
      isPublic: body.isPublic ?? true,
      copies: 0
    };

    await fetch(`${FETCH_URL}/set/raw:${scriptId}`, {
      headers: { Authorization: `Bearer ${FETCH_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(scriptData),
    });

    if (scriptData.isPublic) {
      await fetch(`${FETCH_URL}/lpush/public_scripts`, {
        headers: { Authorization: `Bearer ${FETCH_TOKEN}`, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(scriptData),
      });
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const rawUrl = `${protocol}://${host}/raw/${scriptId}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    return res.status(200).json({ loadstring, rawUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save script' });
  }
}
