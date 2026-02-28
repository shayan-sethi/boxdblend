import { useEffect, useState } from "react";
import {
  ScoreCard,
  StatsCard,
  AgreedCard,
  ClashCard,
  MostRewatchedCard,
  GenerosityGapCard,
  RecentlyWatchedCard,
  ShareCard,
  FavYearCard,
  EraCard,
  WatchNextCard,
  NicheVsPopularCard,
} from "./ResultCards";

export function ResultsView({ results, n1, n2, onReset }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [tmdbNicheState, setTmdbNicheState] = useState({
    loading: true,
    error: "",
    p1Pick: null,
    p2Pick: null,
    p1AvgPopularity: null,
    p2AvgPopularity: null,
  });

  useEffect(() => {
    let cancelled = false;

    const avgPopularity = (items) => {
      if (!items.length) return null;
      return items.reduce((sum, item) => sum + Number(item.popularity || 0), 0) / items.length;
    };

    const mostNiche = (items) =>
      [...items].sort((a, b) => a.voteCount - b.voteCount || a.popularity - b.popularity)[0] || null;

    const p1Local = (results.allFilms1 || []).map(f => ({
      title: f.Name,
      year: String(f.Year || ""),
      voteCount: 0,
      popularity: 0,
    }));

    const p2Local = (results.allFilms2 || []).map(f => ({
      title: f.Name,
      year: String(f.Year || ""),
      voteCount: 0,
      popularity: 0,
    }));

    const pickFallback = (message = "") => {
      if (cancelled) return;
      setTmdbNicheState({
        loading: false,
        error: message,
        p1Pick: p1Local[0] || null,
        p2Pick: p2Local[0] || null,
        p1AvgPopularity: avgPopularity(p1Local),
        p2AvgPopularity: avgPopularity(p2Local),
      });
    };

    const run = async () => {
      setTmdbNicheState(prev => ({ ...prev, loading: true, error: "" }));

      const p1Candidates = (results.allFilms1 || [])
        .map(f => ({ name: f.Name, year: f.Year, owner: "p1" }));

      const p2Candidates = (results.allFilms2 || [])
        .map(f => ({ name: f.Name, year: f.Year, owner: "p2" }));

      const allCandidates = [...p1Candidates, ...p2Candidates];
      if (!allCandidates.length) return pickFallback();

      try {
        const res = await fetch("/api/tmdb", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            films: allCandidates.map(c => ({ name: c.name, year: c.year })),
            minRuntimeMinutes: 45,
          }),
        });

        if (!res.ok) {
          let backendError = "";
          try {
            const payload = await res.json();
            if (payload?.error) backendError = "";
          } catch {}
          return pickFallback(backendError);
        }

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) return pickFallback();

        const byNameYear = new Map(items.map(i => [`${(i.inputName || "").toLowerCase()}::${i.inputYear || ""}`, i]));
        const matched = allCandidates
          .map(c => {
            const yearKey = String(c.year || "").slice(0, 4);
            return {
              candidate: c,
              tmdb: byNameYear.get(`${c.name.toLowerCase()}::${yearKey}`) || null,
            };
          })
          .filter(x => x.tmdb);

        if (!matched.length) return pickFallback();

        const p1Pool = matched
          .filter(x => x.candidate.owner === "p1")
          .map(x => x.tmdb);
        const p2Pool = matched
          .filter(x => x.candidate.owner === "p2")
          .map(x => x.tmdb);

        if (cancelled) return;
        setTmdbNicheState({
          loading: false,
          error: "",
          p1Pick: mostNiche(p1Pool),
          p2Pick: mostNiche(p2Pool),
          p1AvgPopularity: avgPopularity(p1Pool),
          p2AvgPopularity: avgPopularity(p2Pool),
        });
      } catch {
        pickFallback();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [results]);

  const cards = [
    <ScoreCard key="score" r={results} n1={n1} n2={n2} />,
    <StatsCard key="stats" r={results} n1={n1} n2={n2} />,
    <AgreedCard key="agreed" r={results} n1={n1} n2={n2} />,
    <ClashCard key="clash" r={results} n1={n1} n2={n2} />,
    <NicheVsPopularCard key="niche-popular" r={results} n1={n1} n2={n2} tmdbState={tmdbNicheState} />,
    <WatchNextCard key="watch" r={results} n1={n1} n2={n2} />,
    <MostRewatchedCard key="rewatch" r={results} n1={n1} n2={n2} />,
    <FavYearCard key="year" r={results} n1={n1} n2={n2} />,
    <EraCard key="era" r={results} n1={n1} n2={n2} />,
    <GenerosityGapCard key="generosity" r={results} n1={n1} n2={n2} />,
    <RecentlyWatchedCard key="recent" r={results} n1={n1} n2={n2} />,
    <ShareCard key="share" r={results} n1={n1} n2={n2} />,
  ];

  const next = () => setCardIndex(i => Math.min(i + 1, cards.length - 1));
  const prev = () => setCardIndex(i => Math.max(i - 1, 0));

  return (
    <>
      <div className="reveal-card">{cards[cardIndex]}</div>
      <div className="card-nav">
        <button className="nav-btn" disabled={cardIndex === 0} onClick={prev}>
          ← Prev
        </button>
        <div className="card-pips">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`pip ${i === cardIndex ? "active" : i < cardIndex ? "done" : ""}`}
              onClick={() => setCardIndex(i)}
            />
          ))}
        </div>
        <button className="nav-btn" disabled={cardIndex === cards.length - 1} onClick={next}>
          Next →
        </button>
      </div>
      <div className="card-counter">
        Card {cardIndex + 1} of {cards.length}
      </div>
      <button className="action-btn ghost" style={{ marginTop: 20 }} onClick={onReset}>
        ← Start Over
      </button>
    </>
  );
}
