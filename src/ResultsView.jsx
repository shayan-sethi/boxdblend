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
  CreatorSpotlightCard,
  HoursWatchedCard,
  FavoriteGenreCard,
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
    p1TopDirector: null,
    p2TopDirector: null,
    p1TopActor: null,
    p2TopActor: null,
    p1HoursWatched: null,
    p2HoursWatched: null,
    p1FavGenre: null,
    p2FavGenre: null,
    p1PopularityIndex: {},
    p2PopularityIndex: {},
  });

  useEffect(() => {
    let cancelled = false;

    const avgPopularity = (items) => {
      if (!items.length) return null;
      return items.reduce((sum, item) => sum + Number(item.popularity || 0), 0) / items.length;
    };

    const topPerson = (items, key) => {
      const counts = {};
      items.forEach((item) => {
        const name = String(item?.[key] || "").trim();
        if (!name) return;
        counts[name] = (counts[name] || 0) + 1;
      });

      const ranked = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      if (!ranked.length) return null;
      return { name: ranked[0][0], count: ranked[0][1] };
    };

    const hoursWatched = (items) => {
      if (!items.length) return null;
      const totalMinutes = items.reduce((sum, item) => sum + Number(item.runtime || 0), 0);
      return totalMinutes / 60;
    };

    const favoriteGenre = (items) => {
      const counts = {};
      items.forEach((item) => {
        const genres = Array.isArray(item?.genres) ? item.genres : [];
        genres.forEach((genre) => {
          const name = String(genre || "").trim();
          if (!name) return;
          counts[name] = (counts[name] || 0) + 1;
        });
      });

      const ranked = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      if (!ranked.length) return null;
      return { name: ranked[0][0], count: ranked[0][1] };
    };

    const sortByNiche = (items) =>
      [...items].sort((a, b) => a.voteCount - b.voteCount || a.popularity - b.popularity);

    const normalizeKey = (title, year) => {
      const normalizedTitle = String(title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedYear = String(year || "").slice(0, 4);
      return `${normalizedTitle}:${normalizedYear}`;
    };

    const buildPopularityIndex = (items) => {
      const index = {};
      (Array.isArray(items) ? items : []).forEach((item) => {
        const popularity = Number(item?.popularity || 0);

        // Index by original input fields to match Letterboxd CSV names reliably.
        const inputKey = normalizeKey(item?.inputName, item?.inputYear);
        if (inputKey) index[inputKey] = popularity;

        // Also index by TMDB canonical title/year as a fallback.
        const tmdbKey = normalizeKey(item?.title, item?.year);
        if (tmdbKey) index[tmdbKey] = popularity;
      });
      return index;
    };

    const isSameFilm = (left, right) => {
      if (!left || !right) return false;
      if (left.tmdbId && right.tmdbId) return left.tmdbId === right.tmdbId;

      const leftTitle = String(left.title || "").trim().toLowerCase();
      const rightTitle = String(right.title || "").trim().toLowerCase();
      const leftYear = String(left.year || "").trim();
      const rightYear = String(right.year || "").trim();
      return leftTitle === rightTitle && leftYear === rightYear;
    };

    const pickUniqueNichePair = (p1Items, p2Items) => {
      const p1Ranked = sortByNiche(p1Items);
      const p2Ranked = sortByNiche(p2Items);

      const maxIndex = Math.max(p1Ranked.length, p2Ranked.length);
      for (let index = 0; index < maxIndex; index += 1) {
        const p1Pick = p1Ranked[index] || null;
        const p2Pick = p2Ranked[index] || null;
        if (!p1Pick || !p2Pick || !isSameFilm(p1Pick, p2Pick)) {
          return { p1Pick, p2Pick };
        }
      }

      return { p1Pick: p1Ranked[0] || null, p2Pick: p2Ranked[0] || null };
    };

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
        p1TopDirector: null,
        p2TopDirector: null,
        p1TopActor: null,
        p2TopActor: null,
        p1HoursWatched: null,
        p2HoursWatched: null,
        p1FavGenre: null,
        p2FavGenre: null,
        p1PopularityIndex: {},
        p2PopularityIndex: {},
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
            if (payload?.error) backendError = payload.error;
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

        const { p1Pick, p2Pick } = pickUniqueNichePair(p1Pool, p2Pool);

        if (cancelled) return;
        setTmdbNicheState({
          loading: false,
          error: "",
          p1Pick,
          p2Pick,
          p1AvgPopularity: avgPopularity(p1Pool),
          p2AvgPopularity: avgPopularity(p2Pool),
          p1TopDirector: topPerson(p1Pool, "director"),
          p2TopDirector: topPerson(p2Pool, "director"),
          p1TopActor: topPerson(p1Pool, "topActor"),
          p2TopActor: topPerson(p2Pool, "topActor"),
          p1HoursWatched: hoursWatched(p1Pool),
          p2HoursWatched: hoursWatched(p2Pool),
          p1FavGenre: favoriteGenre(p1Pool),
          p2FavGenre: favoriteGenre(p2Pool),
          p1PopularityIndex: buildPopularityIndex(p1Pool),
          p2PopularityIndex: buildPopularityIndex(p2Pool),
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
    <CreatorSpotlightCard key="creator-spotlight" r={results} n1={n1} n2={n2} tmdbState={tmdbNicheState} />,
    <HoursWatchedCard key="hours-watched" n1={n1} n2={n2} tmdbState={tmdbNicheState} />,
    <FavoriteGenreCard key="favorite-genre" n1={n1} n2={n2} tmdbState={tmdbNicheState} />,
    <WatchNextCard key="watch" r={results} n1={n1} n2={n2} tmdbState={tmdbNicheState} />,
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
