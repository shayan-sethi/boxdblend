// ─── CSV Parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseLetterboxdCSV(text) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  console.log("CSV Headers:", headers);
  const films = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 2) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (row[idx] || "").replace(/^"|"$/g, "").trim(); });
    if (obj.Name) films.push(obj);
  }
  if (films.length > 0) console.log("First film sample:", films[0]);
  return films;
}

/**
 * Letterboxd's watched.csv has NO ratings — ratings live in ratings.csv.
 * This merges the two: every film in watchedFilms gets its Rating injected
 * from ratingsFilms if a match is found by normalized name.
 *
 * Also works if only ratingsFilms is provided (watched.csv missing),
 * or if the single CSV already has a Rating column (just returns it as-is).
 */
export function mergeWatchedAndRatings(watchedFilms, ratingsFilms) {
  // Build a lookup from normalized name → rating value
  const ratingMap = {};
  for (const f of ratingsFilms) {
    if (f.Rating && f.Name) {
      const k = f.Name.toLowerCase().replace(/[^a-z0-9]/g, "");
      ratingMap[k] = f.Rating;
    }
  }

  return watchedFilms.map(f => {
    // If watched.csv already has a rating, keep it
    if (f.Rating) return f;
    const k = f.Name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return { ...f, Rating: ratingMap[k] || "" };
  });
}

// Slim down films for cloud storage (strips unused fields, keeps size manageable)
export const slimFilms = films =>
  films.map(f => ({ n: f.Name, y: f.Year, r: f.Rating ? parseFloat(f.Rating) : null }));

// Re-inflate slim films back into the standard shape expected by analysis
export const fattenFilms = slim =>
  slim.map(s => ({ Name: s.n, Year: s.y, Rating: s.r != null ? String(s.r) : "" }));
