export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).end();

  const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const getRes = await fetch(`${FETCH_URL}/get/raw:${id}`, {
      headers: { Authorization: `Bearer ${FETCH_TOKEN}` }
    });
    const getData = await getRes.json();
    
    if (getData.result) {
      let item = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
      item.copies = (item.copies || 0) + 1;

      await fetch(`${FETCH_URL}/set/raw:${id}`, {
        headers: { Authorization: `Bearer ${FETCH_TOKEN}`, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(item)
      });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).end();
  }
                                            }
                  
