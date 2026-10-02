// Reads live captions shown by Google Meet, Microsoft Teams or Zoom (web) and
// sends each finished caption phrase to the Duet side panel for translation.
// Captions must be switched ON inside the meeting, with the spoken language set
// to the other person's language.
(() => {
  if (window.__duetCaptions) return;
  window.__duetCaptions = true;

  const host = location.hostname;
  const site = host.includes("meet.google") ? "Google Meet" : host.includes("zoom") ? "Zoom" : "Teams";
  const STABLE_MS = 1300;          // a phrase counts as finished after this long without changes
  const state = new WeakMap();     // element -> { last, since, sent }

  const clean = s => (s || "").replace(/\s+/g, " ").trim();

  // Returns [{el, speaker, text}] for every caption block currently on screen.
  function captionBlocks() {
    const out = [];

    // Microsoft Teams
    document.querySelectorAll('[data-tid="closed-caption-text"]').forEach(el => {
      const item = el.closest('[data-tid="closed-caption-message"], .fui-ChatMessageCompact, li, div');
      const author = item && item.parentElement ? item.parentElement.querySelector('[data-tid="author"]') : null;
      out.push({ el, speaker: clean(author && author.textContent), text: clean(el.textContent) });
    });
    if (out.length) return out;

    // Zoom web client
    document.querySelectorAll(".live-transcription-subtitle__item, #live-transcription-subtitle span").forEach(el => {
      out.push({ el, speaker: "", text: clean(el.textContent) });
    });
    if (out.length) return out;

    // Google Meet: a "Captions" region with one block per speaker turn
    const region = document.querySelector('[role="region"][aria-label*="aption" i]') ||
                   document.querySelector('div[jsname="dsyhDe"]');
    if (region) {
      for (const block of region.children) {
        const lines = (block.innerText || "").split("\n").map(clean).filter(Boolean);
        if (!lines.length) continue;
        const speaker = lines.length > 1 ? lines[0] : "";
        const text = clean(lines.slice(lines.length > 1 ? 1 : 0).join(" "));
        out.push({ el: block, speaker, text });
      }
    }
    return out;
  }

  function send(msg) {
    try { chrome.runtime.sendMessage(msg).catch(() => {}); } catch { /* extension reloaded */ }
  }

  function scan() {
    const now = Date.now();
    for (const { el, speaker, text } of captionBlocks()) {
      if (!text) continue;
      let st = state.get(el);
      if (!st) { st = { last: "", since: now, sent: "" }; state.set(el, st); }
      if (text !== st.last) { st.last = text; st.since = now; continue; }
      if (now - st.since < STABLE_MS || text === st.sent) continue;
      const delta = st.sent && text.startsWith(st.sent) ? text.slice(st.sent.length) : text;
      st.sent = text;
      if (clean(delta).length > 1) send({ type: "duet-caption", site, speaker, text: clean(delta) });
    }
  }

  setInterval(scan, 500);
  send({ type: "duet-caption-ready", site });
})();
