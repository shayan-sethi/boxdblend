import { useState, useRef, useCallback } from "react";
import { useJSZip } from "./useJSZip";
import { parseLetterboxdCSV, mergeWatchedAndRatings } from "./csv";



export function FileUploader({ onLoad, loaded, showName = true, nameValue = "", onNameChange }) {
  const inputRef = useRef();
  const JSZip = useJSZip();
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState(null);

  // Find a file in a JSZip by exact name, then case-insensitive suffix match
  const findInZip = (zip, filename) =>
    zip.file(filename) ||
    zip.file(new RegExp(filename.replace(".", "\\.") + "$", "i"))[0] ||
    null;

  const finish = (films, fname, diary2026Count = 0) => {
    if (!films.length) {
      setErr("No films found. Make sure it's your Letterboxd export zip.");
      return;
    }
    setErr(null);
    const ratedCount = films.filter(f => f.Rating).length;
    onLoad(films, fname, ratedCount, diary2026Count);
  };

  const handleZip = async (file) => {
    if (!JSZip) { setErr("ZIP support loading, try again in a moment."); return; }
    setExtracting(true);
    try {
      const zip = await JSZip.loadAsync(file);

      const watchedFile = findInZip(zip, "watched.csv");
      const ratingsFile = findInZip(zip, "ratings.csv");
      const diaryFile = findInZip(zip, "diary.csv");

      if (!watchedFile && !ratingsFile) {
        setErr("Couldn't find watched.csv or ratings.csv in this zip. Make sure it's your Letterboxd export.");
        setExtracting(false);
        return;
      }

      let films;
      let diary2026Count = 0;

      if (diaryFile) {
        const diaryText = await diaryFile.async("string");
        const diaryEntries = parseLetterboxdCSV(diaryText);
        console.log("Diary sample:", diaryEntries[0]);
        diary2026Count = diaryEntries.filter(entry => {
          const watchedDate = entry["Watched Date"] || entry.Date || entry["Date"];
          if (!watchedDate) return false;
          const year = watchedDate.split("-")[0];
          return year === "2026";
        }).length;
        console.log("2026 diary entries found:", diary2026Count);
      }

      if (watchedFile && ratingsFile) {
        const [watchedText, ratingsText] = await Promise.all([
          watchedFile.async("string"),
          ratingsFile.async("string"),
        ]);
        const watched = parseLetterboxdCSV(watchedText);
        const ratings = parseLetterboxdCSV(ratingsText);
        films = mergeWatchedAndRatings(watched, ratings);
      } else if (watchedFile) {
        films = parseLetterboxdCSV(await watchedFile.async("string"));
      } else {
        films = parseLetterboxdCSV(await ratingsFile.async("string"));
      }

      finish(films, file.name, diary2026Count);
    } catch (e) {
      setErr("Couldn't read zip: " + e.message);
    }
    setExtracting(false);
  };

  const handleCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const films = parseLetterboxdCSV(e.target.result);
      finish(films, file.name);
    };
    reader.readAsText(file);
  };

  const handleFile = (file) => {
    if (!file) return;
    setErr(null);
    file.name.endsWith(".zip") ? handleZip(file) : handleCSV(file);
  };

  const onDrop = useCallback(
    (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); },
    [JSZip, onLoad]
  );

  return (
    <div
      className={`uploader ${loaded ? "loaded" : ""} ${err ? "errored" : ""}`}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      {showName && (
        <div className="upl-name-wrap">
          <div className="upl-label">Your name</div>
          <input
            className="upl-name-input"
            placeholder="Enter your name…"
            value={nameValue}
            onChange={e => onNameChange(e.target.value)}
          />
        </div>
      )}

      <div className="drop-zone" onClick={() => inputRef.current.click()}>
        <div className="drop-icon">
          {extracting ? "⏳" : loaded ? "🎬" : "📂"}
        </div>
        <div className="drop-text">
          {extracting
            ? "merging watched + ratings…"
            : loaded
            ? "drop new file to replace"
            : <><span>ZIP</span> (best) or <span>watched.csv / ratings.csv</span></>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.zip"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {err && <div className="file-err">⚠ {err}</div>}

      {loaded && !err && (
        <div className="file-ok">
          <div className="file-ok-dot" />
          <div>
            <div className="file-ok-name">{loaded.fname}</div>
            <div className="file-ok-count">
              {loaded.count} films · {loaded.ratedCount} rated
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
