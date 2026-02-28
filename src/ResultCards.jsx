import { useState, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const Stars = ({ r }) => {
  if (r == null) return <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>;
  return (
    <span style={{ color: "var(--gold)", fontSize: 12 }}>
      {"★".repeat(Math.floor(r))}{r % 1 >= 0.5 ? "½" : ""}
    </span>
  );
};

const ratingColor = r =>
  r >= 4 ? "var(--green)" :
  r >= 3 ? "var(--gold)" :
  r >= 2 ? "var(--amber)" :
  "var(--red)";

const starsStr = val =>
  "★".repeat(Math.floor(val)) + (val % 1 >= 0.5 ? "½" : "");

// ─── ScoreCard ────────────────────────────────────────────────────────────────

export function ScoreCard({ r, n1, n2 }) {
  const [barW, setBarW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarW(r.blendScore), 80);
    return () => clearTimeout(t);
  }, [r.blendScore]);

  return (
    <div className="score-hero">
      <div className="s-eye">blend score</div>
      <div className="s-num">
        {r.blendScore}<span className="s-pct">%</span>
      </div>
      <div className="s-lbl">{r.label}</div>
      <div className="s-names">{n1} ✦ {n2}</div>
      <div className="s-bar-wrap">
        <div className="s-bar-fill" style={{ width: `${barW}%` }} />
      </div>
    </div>
  );
}

// ─── StatsCard ────────────────────────────────────────────────────────────────

export function StatsCard({ r, n1, n2 }) {
  const same = Math.abs(r.avg1 - r.avg2) < 0.1;
  const harsher = parseFloat(r.avg1) < parseFloat(r.avg2) ? n1 : n2;

  const items = [
    [r.shared.length,      "films in common"],
    [r.sharedPct + "%",    "overlap rate"],
    [r.total1 + r.total2,  "combined"],
    ["⭑ " + r.avg1,        n1 + "'s avg"],
    ["⭑ " + r.avg2,        n2 + "'s avg"],
    [same ? "🤝" : "🔪",  same ? "equal harshness" : harsher + " rates lower"],
    [r.only1Count,         "only " + n1 + " saw"],
    [r.only2Count,         "only " + n2 + " saw"],
    [r.ratedSharedCount,   "both rated"],
  ];

  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">By the Numbers</div>
        <div className="sc-sub">the raw data</div>
      </div>
      <div className="sc-body">
        <div className="qs-grid">
          {items.map(([val, lbl], i) => (
            <div className="qs-item" key={i}>
              <div className="qs-num" style={{ fontSize: String(val).length > 6 ? 17 : undefined }}>
                {val}
              </div>
              <div className="qs-label">{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ─── AgreedCard ───────────────────────────────────────────────────────────────

export function AgreedCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Most Agreed</div>
        <div className="sc-sub">films you saw completely eye-to-eye on</div>
      </div>
      <div className="sc-body">
        {!r.agreedFilms.length
          ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No commonly rated films.</p>
          : (
            <div className="film-list">
              {r.agreedFilms.map((f, i) => (
                <div className="film-row" key={i}>
                  <div className="film-rank">{i + 1}</div>
                  <div className="film-info">
                    <div className="film-title">{f.name}</div>
                    <div className="film-year">{f.year}</div>
                  </div>
                  <div className="film-ratings">
                    <div className="film-rating">
                      <Stars r={f.r1} />
                      <div className="film-rating-who">{n1.slice(0, 6)}</div>
                    </div>
                    <div className="film-rating">
                      <Stars r={f.r2} />
                      <div className="film-rating-who">{n2.slice(0, 6)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: f.diff === 0 ? "var(--green)" : "var(--muted)", width: 34, textAlign: "right", flexShrink: 0 }}>
                    {f.diff === 0 ? "exact" : `±${f.diff.toFixed(1)}`}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── ClashCard ────────────────────────────────────────────────────────────────

export function ClashCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Biggest Clashes</div>
        <div className="sc-sub">where your ratings diverged hardest</div>
      </div>
      <div className="sc-body">
        {!r.disagreedFilms.length
          ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No rating clashes found.</p>
          : r.disagreedFilms.slice(0, 7).map((f, i) => {
              const [hiW, hiR, loW, loR] = f.r1 >= f.r2
                ? [n1, f.r1, n2, f.r2]
                : [n2, f.r2, n1, f.r1];
              return (
                <div className="clash-row" key={i}>
                  <div className="clash-info">
                    <div className="clash-title">{f.name}</div>
                    <div className="clash-year">{f.year}</div>
                  </div>
                  <div className="clash-ratings">
                    <div className="clash-r">
                      <span className="clash-r-stars" style={{ color: ratingColor(loR) }}>
                        {starsStr(loR)}
                      </span>
                      <span className="clash-r-who">{loW.slice(0, 6)}</span>
                    </div>
                    <span className="clash-arrow">→</span>
                    <div className="clash-r">
                      <span className="clash-r-stars" style={{ color: ratingColor(hiR) }}>
                        {starsStr(hiR)}
                      </span>
                      <span className="clash-r-who">{hiW.slice(0, 6)}</span>
                    </div>
                    <div className="clash-delta">Δ{f.diff.toFixed(1)}</div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ─── GuiltyCard ───────────────────────────────────────────────────────────────

export function MostRewatchedCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Most Rewatched</div>
        <div className="sc-sub">films you came back to</div>
      </div>
      <div className="sc-body">
        <div className="two-col">
          {[{ list: r.topRewatch1, name: n1 }, { list: r.topRewatch2, name: n2 }].map(({ list, name }) => (
            <div key={name}>
              <div className="col-label">{name}</div>
              {list && list.length > 0 ? (
                <div className="film-list">
                  {list.map((f, i) => (
                    <div className="film-row" key={i} style={{ paddingLeft: 0 }}>
                      <div className="film-info">
                        <div className="film-title">{f.name}</div>
                      </div>
                      <div className="film-year">{f.count}x</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hbox-sub" style={{ color: "var(--muted)" }}>No rewatches</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FavYearCard ──────────────────────────────────────────────────────────────

export function FavYearCard({ r, n1, n2 }) {
  const [y1, c1] = r.topYear1 || ["?", 0];
  const [y2, c2] = r.topYear2 || ["?", 0];

  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Favourite Year</div>
        <div className="sc-sub">the release year each person watched the most from</div>
      </div>
      <div className="sc-body">
        <div className="two-col">
          {[{ name: n1, year: y1, count: c1, color: "var(--gold)" },
            { name: n2, year: y2, count: c2, color: "var(--amber)" }].map(({ name, year, count, color }) => (
            <div key={name} className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div className="hbox-label">{name}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 900, color, lineHeight: 1 }}>
                {year}
              </div>
              <div className="hbox-sub">{count} films</div>
            </div>
          ))}
        </div>
        {y1 === y2 && (
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "var(--gold)", letterSpacing: ".1em" }}>
            ✦ &nbsp;you both gravitate to {y1} films&nbsp; ✦
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EraCard ──────────────────────────────────────────────────────────────────

export function EraCard({ r, n1, n2 }) {
  const max = Math.max(
    ...r.allDecades.map(d => Math.max(r.decades1[d] || 0, r.decades2[d] || 0)),
    1
  );

  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Era Preferences</div>
        <div className="sc-sub">films watched by decade</div>
      </div>
      <div className="sc-body">
        {r.allDecades.map(d => {
          const c1 = r.decades1[d] || 0;
          const c2 = r.decades2[d] || 0;
          return (
            <div className="decade-row" key={d}>
              <div className="decade-lbl">{d}s</div>
              <div className="decade-bars">
                {[{ who: n1, count: c1, color: "var(--gold)" },
                  { who: n2, count: c2, color: "var(--amber)" }].map(({ who, count, color }) => (
                  <div className="decade-bar-line" key={who}>
                    <div className="decade-who">{who.slice(0, 2)}</div>
                    <div className="decade-track">
                      <div className="decade-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
                    </div>
                    <div className="decade-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WatchNextCard ────────────────────────────────────────────────────────────

export function WatchNextCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Watch Next</div>
        <div className="sc-sub">top picks the other hasn't seen yet</div>
      </div>
      <div className="sc-body">
        <div className="two-col">
          {[{ list: r.topOnly1, name: n1 }, { list: r.topOnly2, name: n2 }].map(({ list, name }) => (
            <div key={name}>
              <div className="col-label">{name} recommends →</div>
              <div className="film-list">
                {list.map(f => (
                  <div className="film-row" key={f.Name} style={{ paddingLeft: 0 }}>
                    <div className="film-info">
                      <div className="film-title">{f.Name}</div>
                      <div className="film-year">{f.Year}</div>
                    </div>
                    <Stars r={parseFloat(f.Rating)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NicheVsPopularCard({ r, n1, n2, tmdbState }) {
  const [activeTab, setActiveTab] = useState("p1");
  const resolvedTmdbState = tmdbState || {
    loading: true,
    error: "",
    p1Pick: null,
    p2Pick: null,
    p1AvgPopularity: null,
    p2AvgPopularity: null,
  };

  const activePick = activeTab === "p1" ? resolvedTmdbState.p1Pick : resolvedTmdbState.p2Pick;
  const activeName = activeTab === "p1" ? n1 : n2;
  const p1Score = resolvedTmdbState.p1AvgPopularity;
  const p2Score = resolvedTmdbState.p2AvgPopularity;
  const hasBothScores = p1Score != null && p2Score != null;
  const nichestName = !hasBothScores
    ? null
    : p1Score === p2Score
      ? null
      : p1Score < p2Score
        ? n1
        : n2;

  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Niche Battle</div>
        <div className="sc-sub">two tabs, one niche pick per person</div>
      </div>
      <div className="sc-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[{ key: "p1", label: n1 }, { key: "p2", label: n2 }].map(tab => (
            <button
              key={tab.key}
              className="copy-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                marginTop: 0,
                flex: 1,
                opacity: activeTab === tab.key ? 1 : 0.65,
                borderColor: activeTab === tab.key ? "var(--gold)" : "var(--border)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <div className="hbox-label">{activeName}'s most niche pick</div>
          {resolvedTmdbState.loading ? (
            <div className="hbox-sub" style={{ color: "var(--muted)" }}>Checking TMDB…</div>
          ) : activePick ? (
            <>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "var(--gold)", lineHeight: 1.2 }}>
                {activePick.title}
              </div>
              <div className="hbox-sub">{activePick.year || ""}</div>
              {activePick.voteCount > 0 && (
                <div className="hbox-sub">TMDB votes: {activePick.voteCount}</div>
              )}
              <div className="hbox-sub">Popularity: {Number(activePick.popularity || 0).toFixed(1)}</div>
            </>
          ) : (
            <div className="hbox-sub" style={{ color: "var(--muted)" }}>No exclusive films yet</div>
          )}
        </div>

        <div className="two-col" style={{ marginTop: 14 }}>
          <div className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <div className="hbox-label">{n1} popularity score</div>
            <div className="hbox-sub">{p1Score != null ? p1Score.toFixed(1) : "N/A"}</div>
          </div>
          <div className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <div className="hbox-label">{n2} popularity score</div>
            <div className="hbox-sub">{p2Score != null ? p2Score.toFixed(1) : "N/A"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--gold-dim)", letterSpacing: ".08em" }}>
          {nichestName ? `i guess ${nichestName} is more niche` : "i guess it is a tie"}
        </div>

        {!!resolvedTmdbState.error && (
          <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
            {resolvedTmdbState.error}
          </div>
        )}
      </div>
    </div>
  );
}

export function BiggestClashCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Biggest Rating Clashes</div>
        <div className="sc-sub">films you rated completely differently</div>
      </div>
      <div className="sc-body">
        {!r.clashData || !r.clashData.length ? (
          <p style={{ color: "var(--muted)", fontSize: 12 }}>No clashes found.</p>
        ) : (
          r.clashData.slice(0, 5).map((f, i) => {
            const [hiW, hiR, loW, loR] = f.r1 >= f.r2
              ? [n1, f.r1, n2, f.r2]
              : [n2, f.r2, n1, f.r1];
            return (
              <div className="clash-row" key={i}>
                <div className="clash-info">
                  <div className="clash-title">{f.name}</div>
                  <div className="clash-year">{f.year}</div>
                </div>
                <div className="clash-ratings">
                  <div className="clash-r">
                    <span className="clash-r-stars" style={{ color: "var(--red)" }}>★{loR}</span>
                    <span className="clash-r-who">{loW.slice(0, 6)}</span>
                  </div>
                  <span className="clash-arrow">→</span>
                  <div className="clash-r">
                    <span className="clash-r-stars" style={{ color: "var(--green)" }}>★{hiR}</span>
                    <span className="clash-r-who">{hiW.slice(0, 6)}</span>
                  </div>
                  <div className="clash-delta">Δ{f.diff.toFixed(1)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function GenerosityGapCard({ r, n1, n2 }) {
  const harsherName = r.generosityData?.harsher === "p1" ? n1 : n2;
  const kinderName = r.generosityData?.kinder === "p1" ? n1 : n2;
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Rating Generosity</div>
        <div className="sc-sub">who rates harsher or kinder</div>
      </div>
      <div className="sc-body">
        {r.generosityData && (
          <div className="two-col">
            <div className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div className="hbox-label">Harsher Critic</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--red)", lineHeight: 1 }}>
                {harsherName}
              </div>
              <div className="hbox-sub">avg: {r.generosityData.harsher === "p1" ? r.avg1 : r.avg2}★</div>
            </div>
            <div className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div className="hbox-label">More Generous</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>
                {kinderName}
              </div>
              <div className="hbox-sub">avg: {r.generosityData.kinder === "p1" ? r.avg1 : r.avg2}★</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
          Gap: {r.generosityData?.gap}★
        </div>
      </div>
    </div>
  );
}

export function RecentlyWatchedCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Recently Watched</div>
        <div className="sc-sub">latest diary entries from each of you</div>
      </div>
      <div className="sc-body">
        <div className="two-col">
          {[{ list: r.recent1, name: n1 }, { list: r.recent2, name: n2 }].map(({ list, name }) => (
            <div key={name}>
              <div className="col-label">{name}</div>
              <div className="film-list">
                {list && list.map((f, i) => (
                  <div className="film-row" key={i} style={{ paddingLeft: 0 }}>
                    <div className="film-info">
                      <div className="film-title">{f.Name}</div>
                      <div className="film-year">{f.Year}</div>
                    </div>
                    <Stars r={f.Rating ? parseFloat(f.Rating) : null} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShareCard({ r, n1, n2 }) {
  const [copied, setCopied] = useState(false);
  const shareText = `Cinema Blend for ${n1} × ${n2}\nBlend Score: ${r.blendScore}%\n${r.label}\nShared films: ${r.shared.length} (${r.sharedPct}%)`;

  const copyShare = async () => {
    try {
      await navigator.clipboard?.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Cinema Blend",
          text: shareText,
        });
      }
    } catch { }
  };

  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Share</div>
        <div className="sc-sub">send your blend score to friends</div>
      </div>
      <div className="sc-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="hbox" style={{ flexDirection: "column", gap: 8 }}>
          <div className="hbox-label">preview</div>
          <div className="hbox-sub" style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{shareText}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`copy-btn ${copied ? "copied" : ""}`} style={{ marginTop: 0, flex: 1 }} onClick={copyShare}>
            {copied ? "✓ Copied" : "Copy Text"}
          </button>
          <button className="copy-btn" style={{ marginTop: 0, flex: 1 }} onClick={nativeShare}>
            Share…
          </button>
        </div>
      </div>
    </div>
  );
}