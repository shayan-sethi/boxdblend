export function TopActorCard({ r, n1, n2 }) {
  return (
    <div className="sc">
      <div className="sc-head">
        <div className="sc-title">Favorite Actor</div>
        <div className="sc-sub">who you've watched the most</div>
      </div>
      <div className="sc-body">
        <div className="two-col">
          {[{ actor: r.topAct1, name: n1, color: "var(--gold)" },
            { actor: r.topAct2, name: n2, color: "var(--amber)" }].map(({ actor, name, color }) => (
            <div key={name} className="hbox" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div className="hbox-label">{name}</div>
              {actor ? (
                <>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color, lineHeight: 1.3 }}>
                    {actor.name}
                  </div>
                  <div className="hbox-sub">{actor.count} films</div>
                </>
              ) : (
                <div className="hbox-sub" style={{ color: "var(--muted)" }}>No actor data</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
