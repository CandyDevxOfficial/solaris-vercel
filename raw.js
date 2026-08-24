const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body.code) return res.status(400).send('No code provided');

            const scriptId = Math.random().toString(36).substring(2, 10);

            await fetch(`${FETCH_URL}/set/${scriptId}`, {
                headers: { Authorization: `Bearer ${FETCH_TOKEN}` },
                method: 'POST',
                body: JSON.stringify(body.code)
            });

            return res.status(200).json({ id: scriptId });
        } catch (e) {
            return res.status(500).send('Database Error');
        }
    }

    if (req.method === 'GET') {
        const userAgent = req.headers['user-agent'] || '';

        // บล็อกเบราว์เซอร์ ป้องกันคนแอบเปิดเอาสคริปต์
        if (userAgent.includes('Mozilla') && !userAgent.includes('Roblox')) {
            return res.status(403).send('<h1 style="color:#ff5722;text-align:center;margin-top:50px;">403 Access Denied</h1>');
        }

        const response = await fetch(`${FETCH_URL}/get/${id}`, {
            headers: { Authorization: `Bearer ${FETCH_TOKEN}` }
        });
        const data = await response.json();

        if (!data.result) {
            return res.status(404).send('-- Script not found or expired');
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(data.result);
    }

    return res.status(405).send('Method Not Allowed');
}
  
