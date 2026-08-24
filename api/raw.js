export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // เพิ่มขีดจำกัดขนาดข้อมูลเป็น 10MB รองรับข้อความได้หลายล้านตัวอักษร
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!FETCH_URL || !FETCH_TOKEN) {
    return res.status(500).json({ error: 'Missing Redis Environment Variables' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    if (!body || !body.code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // สุ่มสร้าง ID ความยาว 8 หลัก
    const scriptId = Math.random().toString(36).substring(2, 10);

    // ยิง API บันทึกลง Upstash Redis
    const redisResponse = await fetch(`${FETCH_URL}/set/raw:${scriptId}`, {
      headers: {
        Authorization: `Bearer ${FETCH_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      method: 'POST',
      body: body.code,
    });

    if (!redisResponse.ok) {
      return res.status(500).json({ error: 'Failed to store code in Upstash' });
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const rawUrl = `${protocol}://${host}/api/get?id=${scriptId}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    return res.status(200).json({ loadstring, rawUrl });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to convert script' });
  }
}
