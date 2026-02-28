import { useState, useEffect } from "react";

/**
 * Dynamically loads JSZip from the Cloudflare CDN and returns it once ready.
 * Returns null while loading — callers should gate on this before using.
 */
export function useJSZip() {
  const [JSZip, setJSZip] = useState(null);

  useEffect(() => {
    if (window.JSZip) { setJSZip(window.JSZip); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => setJSZip(window.JSZip);
    document.head.appendChild(script);
  }, []);

  return JSZip;
}
