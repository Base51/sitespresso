import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;
let lastConnectFailureAt = 0;
const REDIS_RETRY_DELAY_MS = 30 * 1000;

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (client?.isOpen) return client;

  if (Date.now() - lastConnectFailureAt < REDIS_RETRY_DELAY_MS) {
    return null;
  }

  try {
    if (!client) {
      client = createClient({ url: redisUrl });
      client.on('error', (err) => console.error('Redis error:', err));
    }

    if (!client.isOpen) {
      await client.connect();
    }

    console.log('✓ Connected to Redis');
    lastConnectFailureAt = 0;
    return client;
  } catch (err) {
    lastConnectFailureAt = Date.now();
    console.error('Failed to connect to Redis:', err);

    if (client) {
      try {
        if (client.isOpen) {
          await client.quit();
        }
      } catch {
        // Ignore close errors and fall back to in-memory quotas.
      }
    }

    client = null;
    return null;
  }
}

export async function disconnectRedis() {
  if (client) {
    if (client.isOpen) {
      await client.quit();
    }
    client = null;
  }

  lastConnectFailureAt = 0;
}
