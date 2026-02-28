import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const send = (res, status, body) => {
  res.status(status).json(body);
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const key = req.query?.key;
    if (!key) return send(res, 400, { error: "Missing key" });

    try {
      const value = await redis.get(key);
      return send(res, 200, { value: value ?? null });
    } catch {
      return send(res, 503, {
        error:
          "Remote storage unavailable. Configure Upstash Redis integration in Vercel.",
      });
    }
  }

  if (req.method === "POST") {
    const { key, value, ttlSeconds } = req.body || {};
    if (!key || typeof value === "undefined") {
      return send(res, 400, { error: "Missing key or value" });
    }

    try {
      const ttl = Number.isFinite(ttlSeconds) ? Math.max(60, Math.floor(ttlSeconds)) : null;
      if (ttl) {
        await redis.set(key, value, { ex: ttl });
      } else {
        await redis.set(key, value);
      }
      return send(res, 200, { ok: true });
    } catch {
      return send(res, 503, {
        error:
          "Remote storage unavailable. Configure Upstash Redis integration in Vercel.",
      });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return send(res, 405, { error: "Method not allowed" });
}
