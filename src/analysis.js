// ─── Blend Analysis ───────────────────────────────────────────────────────────

// Normalize a film title to a comparison key:
// lowercase + strip non-alphanumeric so punctuation differences don't break matching
const nk = name => name.toLowerCase().replace(/[^a-z0-9]/g, "");

export function analyzeBlend(films1, films2) {
  const map1 = {}, map2 = {};
  films1.forEach(f => { map1[nk(f.Name)] = f; });
  films2.forEach(f => { map2[nk(f.Name)] = f; });

  // Find shared films and compute per-film rating diffs
  const shared = [];
  Object.keys(map1).forEach(k => {
    if (!map2[k]) return;
    const f1 = map1[k], f2 = map2[k];
    const r1 = f1.Rating ? parseFloat(f1.Rating) : null;
    const r2 = f2.Rating ? parseFloat(f2.Rating) : null;
    shared.push({
      name: f1.Name,
      year: f1.Year,
      r1, r2,
      diff: r1 != null && r2 != null ? Math.abs(r1 - r2) : null,
    });
  });

  const total = Math.max(films1.length, films2.length);
  const sharedPct = total > 0 ? (shared.length / total) * 100 : 0;

  const ratedShared = shared.filter(s => s.diff != null);
  const avgDiff = ratedShared.length > 0
    ? ratedShared.reduce((a, b) => a + b.diff, 0) / ratedShared.length
    : 0;

  // 100% agreement when avgDiff = 0, 0% when avgDiff = 5 (max star gap)
  const ratingAgree = Math.max(0, Math.min(100, (1 - avgDiff / 5) * 100));

  // Both components reach 100% when same file is uploaded on both sides
  const blendScore = Math.min(100, Math.round(sharedPct * 0.45 + ratingAgree * 0.55));

  const label =
    blendScore === 100 ? "one of you has to be copying the other one" :
    blendScore >= 88   ? "practically the same taste" :
    blendScore >= 74   ? "very similar taste" :
    blendScore >= 58   ? "averagely similar taste" :
    blendScore >= 42   ? "not good friends" :
    blendScore >= 26   ? "nothing in common" :
                         "are you guys even friends?";

  // Use spread copies to avoid mutating the source array with .sort()
  const agreedFilms = [...ratedShared]
    .sort((a, b) => a.diff - b.diff || (b.r1 + b.r2) - (a.r1 + a.r2))
    .slice(0, 8);

  const disagreedFilms = [...ratedShared]
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 8);

  // Films only one person has watched
  const only1 = films1.filter(f => !map2[nk(f.Name)]);
  const only2 = films2.filter(f => !map1[nk(f.Name)]);

  const topOnly1 = [...only1]
    .filter(f => f.Rating)
    .sort((a, b) => parseFloat(b.Rating) - parseFloat(a.Rating))
    .slice(0, 6);

  const topOnly2 = [...only2]
    .filter(f => f.Rating)
    .sort((a, b) => parseFloat(b.Rating) - parseFloat(a.Rating))
    .slice(0, 6);

  // Average ratings
  const rated1 = films1.filter(f => f.Rating);
  const rated2 = films2.filter(f => f.Rating);
  const avg1 = rated1.length ? rated1.reduce((a, b) => a + parseFloat(b.Rating), 0) / rated1.length : 0;
  const avg2 = rated2.length ? rated2.reduce((a, b) => a + parseFloat(b.Rating), 0) / rated2.length : 0;

  // Decade breakdown
  const decadeCount = films => {
    const d = {};
    films.forEach(f => {
      if (!f.Year) return;
      const year = parseInt(f.Year);
      if (year >= 2020) return;
      const dec = Math.floor(year / 10) * 10;
      d[dec] = (d[dec] || 0) + 1;
    });
    return d;
  };
  const decades1 = decadeCount(films1);
  const decades2 = decadeCount(films2);
  const allDecades = [...new Set([...Object.keys(decades1), ...Object.keys(decades2)])]
    .map(Number)
    .filter(d => d < 2020)
    .sort();

  // Guilty pleasure: exclusive film rated furthest above the person's own average
  const guiltyPleasure = (onlyList, avg) =>
    [...onlyList]
      .filter(f => f.Rating)
      .map(f => ({ ...f, aboveAvg: parseFloat(f.Rating) - avg }))
      .sort((a, b) => b.aboveAvg - a.aboveAvg)[0] || null;

  const gp1 = guiltyPleasure(only1, avg1);
  const gp2 = guiltyPleasure(only2, avg2);

  // Favourite release year (most-watched)
  const favYear = films => {
    console.log("Sample years from films:", films.slice(0, 10).map(f => ({ name: f.Name, year: f.Year, yearType: typeof f.Year })));
    const films2026 = films.filter(f => {
      const year = f.Year ? String(f.Year).trim() : "";
      return year === "2026";
    });
    console.log("2026 films found:", films2026.length, films2026.slice(0, 3).map(f => f.Name));
    return films2026.length > 0 ? ["2026", films2026.length] : ["2026", 0];
  };

  return {
    blendScore,
    label,
    shared,
    sharedPct: Math.round(sharedPct),
    agreedFilms,
    disagreedFilms,
    topOnly1,
    topOnly2,
    only1Count: only1.length,
    only2Count: only2.length,
    avg1: avg1.toFixed(2),
    avg2: avg2.toFixed(2),
    rated1Count: rated1.length,
    rated2Count: rated2.length,
    total1: films1.length,
    total2: films2.length,
    decades1,
    decades2,
    allDecades,
    gp1,
    gp2,
    topYear1: favYear(films1),
    topYear2: favYear(films2),
    ratedSharedCount: ratedShared.length,
  };
}
