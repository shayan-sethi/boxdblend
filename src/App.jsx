import { useState, useRef, useEffect } from "react";
import css from "./styles";
import { analyzeBlend } from "./analysis";
import { slimFilms, fattenFilms } from "./csv";
import { FileUploader } from "./FileUploader";
import { ResultsView } from "./ResultsView";
import "./storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genCode = () => Math.random().toString(36).toUpperCase().slice(2, 8);

// Subtitle shown under the header based on current screen
const SUBTITLES = {
  home:        "compare your film taste with a friend",
  creating:    "upload your letterboxd data to start",
  waiting:     "waiting for your friend to join…",
  "join-entry": "enter your friend's code",
  joining:     null, // set dynamically from p1Name
  results:     null, // set dynamically from names
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Screen states: "home" | "creating" | "waiting" | "join-entry" | "joining" | "results"
  const [screen, setScreen]         = useState("home");

  // Shared file state (used by both Person 1 and Person 2 paths)
  const [myName, setMyName]         = useState("");
  const [myFilms, setMyFilms]       = useState(null);
  const [myMeta, setMyMeta]         = useState(null);

  // Session / joining
  const [sessionCode, setSessionCode] = useState("");
  const [joinCode, setJoinCode]       = useState("");
  const [joinErr, setJoinErr]         = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [p1Name, setP1Name]           = useState("");

  // Code copy feedback
  const [copied, setCopied]         = useState(false);

  // Results
  const [results, setResults]       = useState(null);
  const [resN1, setResN1]           = useState("");
  const [resN2, setResN2]           = useState("");

  const pollRef = useRef(null);

  // ── Reset everything back to home ──────────────────────────────────────────
  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setScreen("home");
    setMyName(""); setMyFilms(null); setMyMeta(null);
    setSessionCode(""); setJoinCode(""); setJoinErr("");
    setResults(null); setResN1(""); setResN2(""); setP1Name("");
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── PERSON 1: Create session ───────────────────────────────────────────────
  const handleCreate = async () => {
    if (!myFilms || !myName.trim()) return;
    const code = genCode();
    const payload = {
      p1Name: myName.trim(),
      p1Films: slimFilms(myFilms),
      p2Name: null,
      p2Films: null,
      created: Date.now(),
    };
    try {
      await window.storage.set("blend:" + code, JSON.stringify(payload), true);
      setSessionCode(code);
      setScreen("waiting");
      startPolling(code, myName.trim(), myFilms);
    } catch (e) {
      alert("Storage error: " + e.message);
    }
  };

  // Poll every 2.5 s until Person 2 uploads their data
  const startPolling = (code, n1, f1) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await window.storage.get("blend:" + code, true);
        if (!res) return;
        const data = JSON.parse(res.value);
        if (data.p2Films && data.p2Name) {
          clearInterval(pollRef.current);
          const f2 = fattenFilms(data.p2Films);
          setResN1(n1);
          setResN2(data.p2Name);
          setResults(analyzeBlend(f1, f2));
          setScreen("results");
        }
      } catch { /* ignore transient errors */ }
    }, 2500);
  };

  // ── PERSON 2: Look up code ─────────────────────────────────────────────────
  const handleJoinLookup = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setJoinErr("Enter the full code your friend shared."); return; }
    setJoinLoading(true); setJoinErr("");
    try {
      const res = await window.storage.get("blend:" + code, true);
      if (!res) { setJoinErr("No blend found with that code. Double-check it."); setJoinLoading(false); return; }
      const data = JSON.parse(res.value);
      if (data.p2Films) { setJoinErr("This blend already has two people. Ask your friend for a new one."); setJoinLoading(false); return; }
      setP1Name(data.p1Name);
      setJoinCode(code);
      setScreen("joining");
    } catch (e) {
      setJoinErr("Error: " + e.message);
    }
    setJoinLoading(false);
  };

  // ── PERSON 2: Submit file ──────────────────────────────────────────────────
  const handleJoinSubmit = async () => {
    if (!myFilms || !myName.trim()) return;
    try {
      const res = await window.storage.get("blend:" + joinCode, true);
      if (!res) { alert("Session expired. Ask your friend to create a new blend."); return; }
      const data = JSON.parse(res.value);
      data.p2Name = myName.trim();
      data.p2Films = slimFilms(myFilms);
      await window.storage.set("blend:" + joinCode, JSON.stringify(data), true);
      const f1 = fattenFilms(data.p1Films);
      setResN1(data.p1Name);
      setResN2(myName.trim());
      setResults(analyzeBlend(f1, myFilms));
      setScreen("results");
    } catch (e) {
      alert("Error saving: " + e.message);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(sessionCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Header subtitle ────────────────────────────────────────────────────────
  const subtitle =
    screen === "joining" ? `joining ${p1Name}'s blend` :
    screen === "results" ? `${resN1} × ${resN2}` :
    SUBTITLES[screen] ?? "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <div className="hdr">
          <div className="hdr-eye">✦ letterboxd ✦</div>
          <h1>Cinema<br /><em>Blend</em></h1>
          <div className="divider" />
          <div className="hdr-sub">{subtitle}</div>
        </div>

        {/* ── HOME ── */}
        {screen === "home" && (
          <>
            <div className="mode-grid">
              <button className="mode-btn" onClick={() => setScreen("creating")}>
                <div className="mode-icon">🎬</div>
                <div className="mode-title">Start a Blend</div>
                <div className="mode-desc">
                  Upload your Letterboxd data and get a code to share with your friend.
                </div>
              </button>
              <button className="mode-btn" onClick={() => setScreen("join-entry")}>
                <div className="mode-icon">🔗</div>
                <div className="mode-title">Join a Blend</div>
                <div className="mode-desc">
                  Got a code from your friend? Enter it here and upload your own data.
                </div>
              </button>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", letterSpacing: ".08em", lineHeight: 1.8 }}>
              Export at <span style={{ color: "var(--gold-dim)" }}>letterboxd.com/settings/data</span> → Download Data<br />
              Drop the <strong style={{ color: "var(--gold-dim)" }}>.zip directly</strong> or extract and use <strong style={{ color: "var(--gold-dim)" }}>watched.csv</strong>
            </div>
          </>
        )}

        {/* ── CREATING ── */}
        {screen === "creating" && (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Your Letterboxd Data</div>
              <div className="panel-sub">upload your export — .zip or watched.csv</div>
            </div>
            <div className="panel-body">
              <FileUploader
                showName
                nameValue={myName}
                onNameChange={setMyName}
                loaded={myMeta}
                onLoad={(films, fname) => { setMyFilms(films); setMyMeta({ fname, count: films.length }); }}
              />
              <button className="action-btn" disabled={!myFilms || !myName.trim()} onClick={handleCreate}>
                Generate Blend Code →
              </button>
              <button className="action-btn ghost" onClick={reset}>← Back</button>
            </div>
          </div>
        )}

        {/* ── WAITING ── */}
        {screen === "waiting" && (
          <>
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Share this Code</div>
                <div className="panel-sub">send it to your friend and wait for them to join</div>
              </div>
              <div className="panel-body">
                <div className="code-box">
                  <div className="code-eye">your blend code</div>
                  <div className="code-val">{sessionCode}</div>
                  <div className="code-hint">
                    Tell your friend to open this app, choose <strong>Join a Blend</strong>,<br />
                    and enter the code above
                  </div>
                  <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copyCode}>
                    {copied ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
              </div>
            </div>

            <div className="waiting-box">
              <div className="waiting-spinner">⏳</div>
              <div className="waiting-title">Waiting for your friend…</div>
              <div className="waiting-sub">
                This page updates automatically once they join.<br />You can leave it open.
              </div>
            </div>

            <button className="action-btn ghost" style={{ marginTop: 14 }} onClick={reset}>
              Cancel
            </button>
          </>
        )}

        {/* ── JOIN ENTRY ── */}
        {screen === "join-entry" && (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Enter Your Friend's Code</div>
              <div className="panel-sub">they created a blend and shared a 6-character code</div>
            </div>
            <div className="panel-body">
              <div className="code-input-wrap">
                <input
                  className="code-input"
                  placeholder="ABC123"
                  maxLength={6}
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoinLookup()}
                />
                <button
                  className="join-btn"
                  disabled={joinCode.length < 4 || joinLoading}
                  onClick={handleJoinLookup}
                >
                  {joinLoading ? "…" : "Look Up →"}
                </button>
              </div>
              {joinErr
                ? <div className="join-err">⚠ {joinErr}</div>
                : <div className="join-info">Your friend generated this code when they uploaded their data.</div>}
              <button className="action-btn ghost" onClick={reset}>← Back</button>
            </div>
          </div>
        )}

        {/* ── JOINING ── */}
        {screen === "joining" && (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">You're joining {p1Name}'s Blend</div>
              <div className="panel-sub">now upload your own letterboxd data</div>
            </div>
            <div className="panel-body">
              <div className="friend-banner">
                <div className="friend-banner-dot" />
                <div className="friend-banner-text">
                  {p1Name} has uploaded their data — your turn!
                </div>
              </div>
              <FileUploader
                showName
                nameValue={myName}
                onNameChange={setMyName}
                loaded={myMeta}
                onLoad={(films, fname) => { setMyFilms(films); setMyMeta({ fname, count: films.length }); }}
              />
              <button className="action-btn" disabled={!myFilms || !myName.trim()} onClick={handleJoinSubmit}>
                ✦ &nbsp;See the Results&nbsp; ✦
              </button>
              <button className="action-btn ghost" onClick={reset}>← Cancel</button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && results && (
          <ResultsView results={results} n1={resN1} n2={resN2} onReset={reset} />
        )}

      </div>
    </>
  );
}
