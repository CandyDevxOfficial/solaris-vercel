export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('ID is required');

  const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!FETCH_URL || !FETCH_TOKEN) return res.status(500).send('Server Error');

  try {
    const redisResponse = await fetch(`${FETCH_URL}/get/raw:${id}`, {
      headers: { Authorization: `Bearer ${FETCH_TOKEN}` },
    });

    const data = await redisResponse.json();
    if (!data.result) return res.status(404).send('Script not found');

    const item = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

    const userAgent = req.headers['user-agent'] || '';
    const isBrowser = userAgent.includes('Mozilla') && !userAgent.includes('Roblox');

    if (isBrowser) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(403).send(`
        <!DOCTYPE html><html><head><title>403 Forbidden</title>
        <style>body{background:#05070f;color:white;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}
        .box{text-align:center;background:rgba(13,17,28,0.9);padding:40px;border-radius:20px;border:1px solid #ff5722;}
        h1{font-size:70px;color:#ff5722;margin:0;}</style></head>
        <body><div class="box"><h1>403</h1><h2>Access Denied</h2><p>Direct Web Access Blocked. Executable Only.</p></div></body></html>
      `);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(item.code || item);
  } catch (error) {
    return res.status(500).send('Internal Error');
  }
}
