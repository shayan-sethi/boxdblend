const send = (res, status, body) => {
  res.status(status).json(body);
};

const MAX_TMDB_CALLS_PER_SECOND = 40;
const MIN_TMDB_INTERVAL_MS = Math.ceil(1000 / MAX_TMDB_CALLS_PER_SECOND);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let tmdbQueue = Promise.resolve();
let lastTmdbDispatchMs = 0;

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const tmdbSearchCache = new Map();
const tmdbDetailsCache = new Map();

const getCache = (cache, key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const setCache = (cache, key, value) => {
  cache.set(key, { ts: Date.now(), value });
};

const scheduleTmdbCall = (task) => {
  const gate = tmdbQueue.then(async () => {
    const elapsed = Date.now() - lastTmdbDispatchMs;
    const waitMs = Math.max(0, MIN_TMDB_INTERVAL_MS - elapsed);
    if (waitMs > 0) await sleep(waitMs);
    lastTmdbDispatchMs = Date.now();
  }, async () => {
    const elapsed = Date.now() - lastTmdbDispatchMs;
    const waitMs = Math.max(0, MIN_TMDB_INTERVAL_MS - elapsed);
    if (waitMs > 0) await sleep(waitMs);
    lastTmdbDispatchMs = Date.now();
  });

  tmdbQueue = gate.catch(() => undefined);
  return gate.then(task);
};

const toYear = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const match = str.match(/\d{4}/);
  return match ? match[0] : null;
};

const normalize = (name, year) => `${String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "")}:${toYear(year) || ""}`;

const normalizeTitle = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const selectBestMatch = (filmName, filmYear, results) => {
  const year = toYear(filmYear);
  const target = normalizeTitle(filmName);
  const list = Array.isArray(results) ? results : [];

  const exactTitleMatches = list.filter(r =>
    normalizeTitle(r?.title) === target || normalizeTitle(r?.original_title) === target
  );

  if (year) {
    const exactTitleAndYear = exactTitleMatches.find(r => (r?.release_date || "").slice(0, 4) === year);
    if (exactTitleAndYear) return exactTitleAndYear;
    return null;
  }

  return exactTitleMatches[0] || null;
};

const searchMovie = async ({ apiKey, bearerToken, minRuntimeMinutes }, film) => {
  const cacheKey = `${normalize(film.name, film.year)}:${minRuntimeMinutes || 0}`;
  const cached = getCache(tmdbSearchCache, cacheKey);
  if (cached) {
    const runtime = Number(cached.runtime || 0);
    if (minRuntimeMinutes > 0 && runtime < minRuntimeMinutes) {
      tmdbSearchCache.delete(cacheKey);
    } else {
      return cached;
    }
  }

  const params = new URLSearchParams({
    query: film.name,
    include_adult: "false",
  });

  if (apiKey) params.set("api_key", apiKey);

  const year = toYear(film.year);
  if (year) params.set("year", year);

  const authHeaders = bearerToken
    ? {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      }
    : { Accept: "application/json" };

  const resp = await scheduleTmdbCall(() =>
    fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
      headers: authHeaders,
    })
  );
  if (!resp.ok) return null;

  const json = await resp.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  if (!results.length) return null;

  const best = selectBestMatch(film.name, year, results);
  if (!best?.id) return null;

  const detailsParams = new URLSearchParams();
  if (apiKey) detailsParams.set("api_key", apiKey);

  const detailKey = String(best.id);
  let details = getCache(tmdbDetailsCache, detailKey);
  if (!details) {
    const detailsResp = await scheduleTmdbCall(() =>
      fetch(`https://api.themoviedb.org/3/movie/${best.id}?${detailsParams.toString()}`, {
        headers: authHeaders,
      })
    );

    if (!detailsResp.ok) return null;
    details = await detailsResp.json();
    setCache(tmdbDetailsCache, detailKey, details);
  }

  const runtime = Number(details?.runtime || 0);
  if (minRuntimeMinutes > 0 && runtime < minRuntimeMinutes) return null;

  const out = {
    key: normalize(film.name, film.year),
    inputName: film.name,
    inputYear: year,
    tmdbId: best.id,
    title: best.title || film.name,
    year: (best.release_date || "").slice(0, 4) || year || "",
    popularity: Number(best.popularity || 0),
    voteCount: Number(best.vote_count || 0),
    voteAverage: Number(best.vote_average || 0),
    runtime,
  };

  setCache(tmdbSearchCache, cacheKey, out);
  return out;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed" });
  }

  const apiKey = String(process.env.TMDB_API_KEY || "").trim();
  const bearerToken = String(process.env.TMDB_BEARER_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN || "").trim();

  if (!apiKey && !bearerToken) {
    return send(res, 503, {
      error: "TMDB is not configured. Add TMDB_API_KEY or TMDB_BEARER_TOKEN.",
    });
  }

  const films = Array.isArray(req.body?.films) ? req.body.films : [];
  const minRuntimeMinutes = Number(req.body?.minRuntimeMinutes || 0);
  if (!films.length) return send(res, 400, { error: "Missing films array" });

  const uniqueFilms = [];
  const seen = new Set();
  for (const film of films) {
    const name = String(film?.name || "").trim();
    if (!name) continue;
    const year = toYear(film?.year);
    const key = normalize(name, year);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueFilms.push({ name, year });
  }

  try {
    const results = await Promise.all(
      uniqueFilms.map(async (f) => {
        try {
          return await searchMovie({ apiKey, bearerToken, minRuntimeMinutes }, f);
        } catch {
          return null;
        }
      })
    );
    if (!results.some(Boolean)) {
      return send(res, 502, {
        error: "TMDB returned no matches. Check your TMDB key/token permissions.",
      });
    }
    return send(res, 200, {
      items: results.filter(Boolean),
    });
  } catch {
    return send(res, 502, { error: "TMDB request failed" });
  }
}
