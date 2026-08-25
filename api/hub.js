export default async function handler(req, res) {
  const FETCH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const FETCH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const response = await fetch(`${FETCH_URL}/lrange/public_scripts/0/30`, {
      headers: { Authorization: `Bearer ${FETCH_TOKEN}` },
    });

    const data = await response.json();
    const list = (data.result || []).map(item => typeof item === 'string' ? JSON.parse(item) : item);

    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json([]);
  }
}
