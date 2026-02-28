import { useState, useRef, useCallback } from "react";
import { useJSZip } from "./useJSZip";
import { parseLetterboxdCSV } from "./csv";

/**
 * Drag-and-drop / click-to-browse file uploader.
 * Accepts .csv and .zip (extracts watched.csv from inside).
 *
 * Props:
 *   onLoad(films, filename)  — called when a valid file is successfully parsed
 *   loaded                   — { fname, count } if a file is already loaded, else null
 *   showName                 — whether to show the name input above the drop zone
 *   nameValue                — controlled value for the name input
 *   onNameChange(value)      — change handler for the name input
 */
export function FileUploader({ onLoad, loaded, showName = true, nameValue = "", onNameChange }) {
  const inputRef = useRef();
  const JSZip = useJSZip();
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState(null);

  const processCSV = (text, fname) => {
    const films = parseLetterboxdCSV(text);
    if (!films.length) {
      setErr("No films found — make sure this is watched.csv");
      return;
    }
    console.log("Sample film data:", films[0]);
    setErr(null);
    onLoad(films, fname);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setErr(null);

    if (file.name.endsWith(".zip")) {
      if (!JSZip) { setErr("ZIP support loading, try again in a moment."); return; }
      setExtracting(true);
      try {
        const zip = await JSZip.loadAsync(file);
        const csv =
          zip.file("watched.csv") ||
          zip.file(/watched\.csv$/i)[0] ||
          zip.file(/\.csv$/i)[0];
        if (!csv) {
          setErr("No CSV found in zip. Use your Letterboxd export zip.");
          setExtracting(false);
          return;
        }
        processCSV(await csv.async("string"), file.name);
      } catch (e) {
        setErr("Couldn't read zip: " + e.message);
      }
      setExtracting(false);
    } else {
      const reader = new FileReader();
      reader.onload = e => processCSV(e.target.result, file.name);
      reader.readAsText(file);
    }
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
            ? "extracting…"
            : loaded
            ? "drop new file to replace"
            : <><span>CSV or ZIP</span> — your Letterboxd export</>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.zip"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {err && (
        <div className="file-err">⚠ {err}</div>
      )}

      {loaded && !err && (
        <div className="file-ok">
          <div className="file-ok-dot" />
          <div>
            <div className="file-ok-name">{loaded.fname}</div>
            <div className="file-ok-count">{loaded.count} films loaded</div>
          </div>
        </div>
      )}
    </div>
  );
}
