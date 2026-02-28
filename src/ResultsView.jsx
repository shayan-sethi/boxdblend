import { useState } from "react";
import {
  ScoreCard,
  StatsCard,
  AgreedCard,
  ClashCard,
  GuiltyCard,
  FavYearCard,
  EraCard,
  WatchNextCard,
} from "./ResultCards";

export function ResultsView({ results, n1, n2, onReset }) {
  const [cardIndex, setCardIndex] = useState(0);

  const cards = [
    <ScoreCard key="score" r={results} n1={n1} n2={n2} />,
    <StatsCard key="stats" r={results} n1={n1} n2={n2} />,
    <AgreedCard key="agreed" r={results} n1={n1} n2={n2} />,
    <ClashCard key="clash" r={results} n1={n1} n2={n2} />,
    <WatchNextCard key="watch" r={results} n1={n1} n2={n2} />,
    <GuiltyCard key="guilty" r={results} n1={n1} n2={n2} />,
    <FavYearCard key="year" r={results} n1={n1} n2={n2} />,
    <EraCard key="era" r={results} n1={n1} n2={n2} />,
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
