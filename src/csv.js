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
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, "").trim());
  console.log("CSV Headers:", headers);
  const films = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 2) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (row[idx] || "").replace(/^"|"$/g, "").trim(); });
    if (obj.Name) films.push(obj);
  }
  console.log("First film parsed:", films[0]);
  return films;
}

// Slim down films for cloud storage (strips unused fields, keeps size manageable)
export const slimFilms = films =>
  films.map(f => ({ n: f.Name, y: f.Year, r: f.Rating ? parseFloat(f.Rating) : null }));

// Re-inflate slim films back into the standard shape expected by analysis
export const fattenFilms = slim =>
  slim.map(s => ({ Name: s.n, Year: s.y, Rating: s.r != null ? String(s.r) : "" }));
