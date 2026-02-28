import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

const MAX_TMDB_CALLS_PER_SECOND = 40
const MIN_TMDB_INTERVAL_MS = Math.ceil(1000 / MAX_TMDB_CALLS_PER_SECOND)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const toYear = (value) => {
  if (!value) return null
  const str = String(value).trim()
  const match = str.match(/\d{4}/)
  return match ? match[0] : null
}

const normalize = (name, year) => `${String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${toYear(year) || ''}`

const normalizeTitle = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const selectBestMatch = (filmName, filmYear, results) => {
  const year = toYear(filmYear)
  const target = normalizeTitle(filmName)
  const list = Array.isArray(results) ? results : []

  const exactTitleMatches = list.filter((r) =>
    normalizeTitle(r?.title) === target || normalizeTitle(r?.original_title) === target
  )

  if (year) {
    const exactTitleAndYear = exactTitleMatches.find((r) => (r?.release_date || '').slice(0, 4) === year)
    if (exactTitleAndYear) return exactTitleAndYear
    return null
  }

  return exactTitleMatches[0] || null
}

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

const sendJson = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const requestJson = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (resp) => {
      let raw = ''
      resp.on('data', (chunk) => {
        raw += chunk
      })
      resp.on('end', () => {
        try {
          const json = raw ? JSON.parse(raw) : {}
          resolve({ ok: resp.statusCode >= 200 && resp.statusCode < 300, status: resp.statusCode, json })
        } catch {
          resolve({ ok: false, status: resp.statusCode || 0, json: {} })
        }
      })
    })
    req.on('error', reject)
  })

const pickEnv = (env, keys) => {
  for (const key of keys) {
    const value = String((env && env[key]) || process.env[key] || '').trim()
    if (value) return value
  }
  return ''
}

const tmdbDevApiPlugin = (env) => {
  const getCredentials = () => ({
    apiKey: pickEnv(env, ['TMDB_API_KEY', 'VITE_TMDB_API_KEY', '\uFEFFTMDB_API_KEY']),
    bearerToken: pickEnv(env, ['TMDB_BEARER_TOKEN', 'TMDB_READ_ACCESS_TOKEN', 'VITE_TMDB_BEARER_TOKEN', 'VITE_TMDB_READ_ACCESS_TOKEN']),
  })

  let tmdbQueue = Promise.resolve()
  let lastTmdbDispatchMs = 0

  const CACHE_TTL_MS = 1000 * 60 * 60 * 6
  const tmdbSearchCache = new Map()
  const tmdbDetailsCache = new Map()

  const getCache = (cache, key) => {
    const hit = cache.get(key)
    if (!hit) return null
    if (Date.now() - hit.ts > CACHE_TTL_MS) {
      cache.delete(key)
      return null
    }
    return hit.value
  }

  const setCache = (cache, key, value) => {
    cache.set(key, { ts: Date.now(), value })
  }

  const scheduleTmdbCall = (task) => {
    const gate = tmdbQueue.then(async () => {
      const elapsed = Date.now() - lastTmdbDispatchMs
      const waitMs = Math.max(0, MIN_TMDB_INTERVAL_MS - elapsed)
      if (waitMs > 0) await sleep(waitMs)
      lastTmdbDispatchMs = Date.now()
    }, async () => {
      const elapsed = Date.now() - lastTmdbDispatchMs
      const waitMs = Math.max(0, MIN_TMDB_INTERVAL_MS - elapsed)
      if (waitMs > 0) await sleep(waitMs)
      lastTmdbDispatchMs = Date.now()
    })
    tmdbQueue = gate.catch(() => undefined)
    return gate.then(task)
  }

  const searchMovie = async (film, minRuntimeMinutes) => {
    const cacheKey = `${normalize(film.name, film.year)}:${minRuntimeMinutes || 0}`
    const cached = getCache(tmdbSearchCache, cacheKey)
    if (cached) {
      const runtime = Number(cached.runtime || 0)
      if (minRuntimeMinutes > 0 && runtime < minRuntimeMinutes) {
        tmdbSearchCache.delete(cacheKey)
      } else {
        return cached
      }
    }

    const params = new URLSearchParams({
      query: film.name,
      include_adult: 'false',
    })

    const { apiKey, bearerToken } = getCredentials()

    if (apiKey) params.set('api_key', apiKey)

    const authHeaders = bearerToken
      ? {
          Accept: 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        }
      : { Accept: 'application/json' }

    const year = toYear(film.year)
    if (year) params.set('year', year)

    const resp = await scheduleTmdbCall(() =>
      requestJson(`https://api.themoviedb.org/3/search/movie?${params.toString()}`,
        authHeaders)
    )
    if (!resp.ok) return null

    const json = resp.json
    const results = Array.isArray(json?.results) ? json.results : []
    if (!results.length) return null

    const best = selectBestMatch(film.name, year, results)
    if (!best?.id) return null

    const detailsParams = new URLSearchParams()
    if (apiKey) detailsParams.set('api_key', apiKey)

    const detailKey = String(best.id)
    let details = getCache(tmdbDetailsCache, detailKey)
    if (!details) {
      const detailsResp = await scheduleTmdbCall(() =>
        requestJson(`https://api.themoviedb.org/3/movie/${best.id}?${detailsParams.toString()}`,
          authHeaders)
      )
      if (!detailsResp.ok) return null
      details = detailsResp.json
      setCache(tmdbDetailsCache, detailKey, details)
    }

    const runtime = Number(details?.runtime || 0)
    if (minRuntimeMinutes > 0 && runtime < minRuntimeMinutes) return null

    const out = {
      key: normalize(film.name, film.year),
      inputName: film.name,
      inputYear: year,
      tmdbId: best.id,
      title: best.title || film.name,
      year: (best.release_date || '').slice(0, 4) || year || '',
      popularity: Number(best.popularity || 0),
      voteCount: Number(best.vote_count || 0),
      voteAverage: Number(best.vote_average || 0),
      runtime,
    }

    setCache(tmdbSearchCache, cacheKey, out)
    return out
  }

  return {
    name: 'tmdb-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/tmdb', async (req, res) => {
        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST')
          return sendJson(res, 405, { error: 'Method not allowed' })
        }

        const { apiKey, bearerToken } = getCredentials()

        if (!apiKey && !bearerToken) {
          return sendJson(res, 503, {
            error: 'TMDB is not configured. Add TMDB_API_KEY (or VITE_TMDB_API_KEY) or TMDB_BEARER_TOKEN.',
          })
        }

        try {
          const body = await readJsonBody(req)
          const films = Array.isArray(body?.films) ? body.films : []
          const minRuntimeMinutes = Number(body?.minRuntimeMinutes || 0)
          if (!films.length) return sendJson(res, 400, { error: 'Missing films array' })

          const uniqueFilms = []
          const seen = new Set()
          for (const film of films) {
            const name = String(film?.name || '').trim()
            if (!name) continue
            const year = toYear(film?.year)
            const key = normalize(name, year)
            if (seen.has(key)) continue
            seen.add(key)
            uniqueFilms.push({ name, year })
          }

          const results = await Promise.all(
            uniqueFilms.map(async (f) => {
              try {
                return await searchMovie(f, minRuntimeMinutes)
              } catch {
                return null
              }
            })
          )
          if (!results.some(Boolean)) {
            return sendJson(res, 502, {
              error: 'TMDB returned no matches. Check your TMDB key/token permissions.',
            })
          }

          return sendJson(res, 200, { items: results.filter(Boolean) })
        } catch {
          return sendJson(res, 502, { error: 'TMDB request failed' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tmdbDevApiPlugin(env)],
  }
})
