import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (client) return client;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not set. Rate limiting will use in-memory fallback.');
    return null;
  }

  try {
    client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    console.log('✓ Connected to Redis');
    return client;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return null;
  }
}

export async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
